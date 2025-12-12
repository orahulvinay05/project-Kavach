/**
 * Converts a string (our Base64 payload) into a binary string '0101...'
 * This matches the Python logic: get_binary_data -> ''.join(format(byte, '08b')...)
 */
function stringToBinary(str: string): string {
  let binary = "";
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    binary += charCode.toString(2).padStart(8, "0");
  }
  return binary;
}

/**
 * Converts a binary string '0101...' back to text (Base64 payload)
 */
function binaryToString(binary: string): string {
  let text = "";
  for (let i = 0; i < binary.length; i += 8) {
    const byte = binary.slice(i, i + 8);
    text += String.fromCharCode(parseInt(byte, 2));
  }
  return text;
}

/**
 * Hides the encrypted Base64 string inside the Image via LSB.
 */
export async function encodeImage(
  imageSrc: string,
  encryptedDataB64: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageSrc;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      // Prepare payload: Length (32-bit binary) + Data (Binary)
      const binaryData = stringToBinary(encryptedDataB64);
      const dataLen = binaryData.length;
      
      // Safety Check
      const capacity = canvas.width * canvas.height * 3; // 3 channels (RGB)
      if (dataLen + 32 > capacity) {
        reject(new Error(`Message too large. Need ${dataLen + 32} bits, have ${capacity} bits.`));
        return;
      }

      const lenBits = dataLen.toString(2).padStart(32, "0");
      const fullBits = lenBits + binaryData;

      let dataIndex = 0;

      // Iterate pixels and modify LSB
      // pixels is a flat array [R, G, B, A, R, G, B, A...]
      for (let i = 0; i < pixels.length; i += 4) {
        if (dataIndex >= fullBits.length) break;

        // Red
        if (dataIndex < fullBits.length) {
          pixels[i] = (pixels[i] & 0xFE) | parseInt(fullBits[dataIndex]);
          dataIndex++;
        }
        // Green
        if (dataIndex < fullBits.length) {
          pixels[i + 1] = (pixels[i + 1] & 0xFE) | parseInt(fullBits[dataIndex]);
          dataIndex++;
        }
        // Blue
        if (dataIndex < fullBits.length) {
          pixels[i + 2] = (pixels[i + 2] & 0xFE) | parseInt(fullBits[dataIndex]);
          dataIndex++;
        }
        // Skip Alpha (pixels[i+3])
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = () => reject(new Error("Failed to load image"));
  });
}

/**
 * Extracts the hidden Base64 string from the Image LSB.
 */
export async function decodeImage(imageSrc: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageSrc;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      // 1. Extract Length (First 32 bits)
      let lenBits = "";
      let pixelIdx = 0;
      let channelIdx = 0; // 0=R, 1=G, 2=B

      // Helper to iterate RGB only
      const getNextBit = () => {
        const val = pixels[pixelIdx * 4 + channelIdx];
        const bit = val & 1;
        
        // Move to next channel/pixel
        channelIdx++;
        if (channelIdx > 2) {
          channelIdx = 0;
          pixelIdx++;
        }
        return bit;
      }

      for (let i = 0; i < 32; i++) {
        lenBits += getNextBit();
      }

      const messageLength = parseInt(lenBits, 2);
      
      if (isNaN(messageLength) || messageLength <= 0 || messageLength > pixels.length * 3) {
        reject(new Error("Image does not contain a valid Project Kavach payload header."));
        return;
      }

      // 2. Extract Data
      let messageBits = "";
      for (let i = 0; i < messageLength; i++) {
        messageBits += getNextBit();
      }

      const extractedB64 = binaryToString(messageBits);
      resolve(extractedB64);
    };

    img.onerror = () => reject(new Error("Failed to load image"));
  });
}