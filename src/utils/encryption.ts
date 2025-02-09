import SEAL from 'node-seal'

let seal: any = null
let context: any = null
let encoder: any = null
let encryptor: any = null
let evaluator: any = null
let decryptor: any = null

export const initializeHE = async () => {
  seal = await SEAL()
  
  // Create encryption parameters
  const schemeType = seal.SchemeType.bfv
  const securityLevel = seal.SecurityLevel.tc128
  const polyModulusDegree = 4096
  const bitSizes = [36, 36, 37]
  const bitSize = 20
  
  const encParms = seal.EncryptionParameters(schemeType)
  encParms.setPolyModulusDegree(polyModulusDegree)
  encParms.setCoeffModulus(seal.CoeffModulus.Create(polyModulusDegree, bitSizes))
  encParms.setPlainModulus(seal.PlainModulus.Batching(polyModulusDegree, bitSize))
  
  context = seal.Context(encParms, true)
  
  // Initialize encryption tools
  encoder = seal.BatchEncoder(context)
  const keyGenerator = seal.KeyGenerator(context)
  const publicKey = keyGenerator.createPublicKey()
  const secretKey = keyGenerator.secretKey()
  encryptor = seal.Encryptor(context, publicKey)
  decryptor = seal.Decryptor(context, secretKey)
  evaluator = seal.Evaluator(context)
  
  return {
    encryptMessage: async (value: string) => {
      try {
        const number = parseInt(value)
        const plaintext = seal.PlainText()
        encoder.encode([number], plaintext)
        const ciphertext = seal.CipherText()
        encryptor.encrypt(plaintext, ciphertext)
        return ciphertext.save() // Serialize for transmission
      } catch (error) {
        console.error('Encryption error:', error)
        throw error
      }
    },
    evaluateMessage: async (serializedCiphertext: string) => {
      try {
        const ciphertext = seal.CipherText()
        ciphertext.load(context, serializedCiphertext)
        const result = seal.CipherText()
        evaluator.square(ciphertext, result)
        return result.save()
      } catch (error) {
        console.error('Evaluation error:', error)
        throw error
      }
    },
    decryptMessage: async (serializedCiphertext: string) => {
      try {
        const ciphertext = seal.CipherText()
        ciphertext.load(context, serializedCiphertext)
        const plaintext = seal.PlainText()
        decryptor.decrypt(ciphertext, plaintext)
        const decoded = encoder.decode(plaintext)
        return decoded[0].toString()
      } catch (error) {
        console.error('Decryption error:', error)
        throw error
      }
    }
  }
}

const encryptMessage = (message: string) => {
  const encoded = encoder.encode(stringToArray(message))
  return encryptor.encrypt(encoded)
}

const evaluateMessage = (encryptedMessage: any) => {
  // Simple homomorphic operation (e.g., addition or multiplication)
  return evaluator.square(encryptedMessage)
}

const stringToArray = (str: string): number[] => {
  return Array.from(str).map(char => char.charCodeAt(0))
} 