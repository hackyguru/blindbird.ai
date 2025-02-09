export interface EncryptedPayload {
  message: string;  // Regular message content
  metadata?: {
    encryptedValue?: string;  // Encrypted numerical value if any
    isHomomorphic: boolean;
  }
} 