import SEAL from 'node-seal';

// Types for encryption context
interface EncryptionContext {
  context: any;
  publicKey: any;
  secretKey: any;
  encryptor: any;
  evaluator: any;
  decryptor: any;
  encoder: any;
}

class FunctionalEncryption {
  private static instance: FunctionalEncryption;
  private context: EncryptionContext | null = null;
  private seal: any = null;

  private constructor() {}

  public static getInstance(): FunctionalEncryption {
    if (!FunctionalEncryption.instance) {
      FunctionalEncryption.instance = new FunctionalEncryption();
    }
    return FunctionalEncryption.instance;
  }

  public async initialize(): Promise<void> {
    try {
      console.time('Total encryption initialization');
      
      console.time('SEAL initialization');
      this.seal = await SEAL();
      console.timeEnd('SEAL initialization');
      
      const schemeType = this.seal.SchemeType.bfv;
      const securityLevel = this.seal.SecurityLevel.tc128;
      const polyModulusDegree = 2048;
      const bitSizes = [36, 36];
      const bitSize = 20;

      console.time('Parameter creation');
      // Create encryption parameters
      const encParms = this.seal.EncryptionParameters(schemeType);
      encParms.setPolyModulusDegree(polyModulusDegree);
      encParms.setCoeffModulus(
        this.seal.CoeffModulus.Create(polyModulusDegree, bitSizes)
      );
      encParms.setPlainModulus(
        this.seal.PlainModulus.Batching(polyModulusDegree, bitSize)
      );
      console.timeEnd('Parameter creation');

      console.time('Context creation');
      // Create context with lower precision for faster initialization
      const context = this.seal.Context(
        encParms,
        false,
        securityLevel
      );
      console.timeEnd('Context creation');

      console.time('Key generation');
      // Create keys
      const keyGenerator = this.seal.KeyGenerator(context);
      const publicKey = keyGenerator.createPublicKey();
      const secretKey = keyGenerator.secretKey();
      console.timeEnd('Key generation');

      console.time('Tool creation');
      // Create encryption tools
      const encryptor = this.seal.Encryptor(context, publicKey);
      const evaluator = this.seal.Evaluator(context);
      const decryptor = this.seal.Decryptor(context, secretKey);
      const encoder = this.seal.BatchEncoder(context);
      console.timeEnd('Tool creation');

      this.context = {
        context,
        publicKey,
        secretKey,
        encryptor,
        evaluator,
        decryptor,
        encoder,
      };

      console.timeEnd('Total encryption initialization');
      console.log('Encryption initialized successfully');
    } catch (error) {
      console.error('Error initializing encryption:', error);
      throw error;
    }
  }

  public async encryptPrompt(prompt: string): Promise<string> {
    if (!this.context) {
      throw new Error('Encryption context not initialized');
    }

    try {
      // Convert string to array of numbers (ASCII codes)
      const promptArray = Array.from(prompt).map(char => char.charCodeAt(0));
      
      // Pad array to match batch size
      const batchSize = this.context.encoder.slotCount;
      while (promptArray.length < batchSize) {
        promptArray.push(0);
      }

      // Encode and encrypt
      const plaintext = this.context.encoder.encode(promptArray);
      const ciphertext = this.context.encryptor.encrypt(plaintext);
      
      // Serialize for transmission
      return ciphertext.save();
    } catch (error) {
      console.error('Error encrypting prompt:', error);
      throw error;
    }
  }

  public async decryptResponse(encryptedResponse: string): Promise<string> {
    if (!this.context) {
      throw new Error('Encryption context not initialized');
    }

    try {
      // Load ciphertext
      const ciphertext = this.seal.Ciphertext();
      ciphertext.load(this.context.context, encryptedResponse);

      // Decrypt
      const plaintext = this.context.decryptor.decrypt(ciphertext);
      const decoded = this.context.encoder.decode(plaintext);

      // Convert numbers back to string
      return decoded
        .filter((code: number) => code !== 0) // Remove padding
        .map((code: number) => String.fromCharCode(code))
        .join('');
    } catch (error) {
      console.error('Error decrypting response:', error);
      throw error;
    }
  }

  public async evaluatePrompt(encryptedPrompt: string): Promise<string> {
    if (!this.context) {
      throw new Error('Encryption context not initialized');
    }

    try {
      // Load encrypted prompt
      const ciphertext = this.seal.Ciphertext();
      ciphertext.load(this.context.context, encryptedPrompt);

      // Here we can perform homomorphic operations if needed
      // For now, we just return the ciphertext as is since we're only
      // using FE for access control
      
      return ciphertext.save();
    } catch (error) {
      console.error('Error evaluating prompt:', error);
      throw error;
    }
  }
}

export const encryptionService = FunctionalEncryption.getInstance(); 