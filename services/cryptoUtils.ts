import { SALT_LENGTH, IV_LENGTH, ITERATIONS, KEY_LENGTH_BITS } from '../types';

/**
 * Converts a string to a Uint8Array
 */
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function stringToBytes(str: string): Uint8Array {
  return textEncoder.encode(str);
}

/**
 * Base64 encoding/decoding utilities
 */
export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function fromBase64(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derives a cryptographic key from a password and salt using PBKDF2.
 */
async function deriveKeyMaterial(password: string): Promise<CryptoKey> {
  return window.crypto.subtle.importKey(
    "raw",
    stringToBytes(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await deriveKeyMaterial(password);
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: ITERATIONS,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: KEY_LENGTH_BITS },
    true, // Extractable for mutation
    ["encrypt", "decrypt"]
  );
}

/**
 * PROJECT KAVACH CORE INNOVATION:
 * Flips the LSB of the last byte of the key.
 */
async function mutateKey(originalKey: CryptoKey): Promise<CryptoKey> {
  // 1. Export key to raw bytes
  const rawKey = await window.crypto.subtle.exportKey("raw", originalKey);
  const keyBytes = new Uint8Array(rawKey);

  // 2. Flip LSB of the last byte
  // "Innovation": key_list[-1] = last_byte ^ 1
  keyBytes[keyBytes.length - 1] = keyBytes[keyBytes.length - 1] ^ 1;

  // 3. Import back as a new CryptoKey
  return window.crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM", length: KEY_LENGTH_BITS },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts plaintext using AES-256-GCM with the Mutated Key.
 * Returns Base64 string of: [Salt(16) + IV(12) + Ciphertext]
 */
export async function encryptTextAes256(plaintext: string, password: string): Promise<string> {
  // 1. Generate Salt and IV
  const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // 2. Derive Original Key
  const originalKey = await deriveKey(password, salt);

  // 3. Mutate Key (The Kavach Protocol)
  const mutatedKey = await mutateKey(originalKey);

  // 4. Encrypt
  const encodedText = stringToBytes(plaintext);
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    mutatedKey,
    encodedText
  );
  const ciphertext = new Uint8Array(ciphertextBuffer);

  // 5. Pack: Salt + IV + Ciphertext
  const packed = new Uint8Array(salt.length + iv.length + ciphertext.length);
  packed.set(salt, 0);
  packed.set(iv, salt.length);
  packed.set(ciphertext, salt.length + iv.length);

  // 6. Return as Base64 (to be hidden in image)
  return toBase64(packed);
}

/**
 * Decrypts the Base64 payload.
 * Replicates the "Hacker Test":
 * 1. Unpack Salt.
 * 2. Derive Original Key.
 * 3. Apply Mutation (Correction).
 * 4. Decrypt.
 */
export async function decryptTextAes256(encryptedB64: string, password: string): Promise<string> {
  try {
    const encryptedData = fromBase64(encryptedB64);

    // 1. Unpack
    if (encryptedData.length < SALT_LENGTH + IV_LENGTH) {
      throw new Error("Invalid data length");
    }

    const salt = encryptedData.slice(0, SALT_LENGTH);
    const iv = encryptedData.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const ciphertext = encryptedData.slice(SALT_LENGTH + IV_LENGTH);

    // 2. Derive Standard Key
    const originalKey = await deriveKey(password, salt);

    // 3. Correct Key (Mutation)
    const keyToTest = await mutateKey(originalKey);

    // 4. Decrypt
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      keyToTest,
      ciphertext
    );

    return textDecoder.decode(decryptedBuffer);

  } catch (error) {
    // Graceful failure for "Hacker Test"
    console.error("Decryption low-level error:", error);
    throw new Error("Access Denied: Invalid Key or Corrupt Data.");
  }
}