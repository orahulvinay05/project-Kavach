export enum AppMode {
  ENCODE = 'ENCODE',
  DECODE = 'DECODE'
}

export interface ProcessResult {
  success: boolean;
  message?: string;
  data?: string; // For decrypted text
  imageDataUrl?: string; // For encoded image
  error?: string;
}

export const SALT_LENGTH = 16;
export const IV_LENGTH = 12; // Standard GCM IV length
export const KEY_LENGTH_BITS = 256;
export const ITERATIONS = 100000;