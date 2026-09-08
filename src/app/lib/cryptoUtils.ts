/** Legacy XOR/Base64 obfuscation, retained only for existing ENC: record compatibility.
 * This is NOT AES, encryption at rest, or a compliance guarantee.
 * A server-side key migration is required before treating stored TC numbers as encrypted.
 */

// Varsayılan gizli anahtar (Ortam değişkeni `NEXT_PUBLIC_KVKK_ENCRYPTION_KEY` yoksa kullanılır)
const DEFAULT_SECRET = 'AudiPro-KVKK-AES256-Secure-Key-2026';

/**
 * Eski XOR-Base64 veri kodlaması (güvenlik sağlamaz) (Tarayıcı + Node.js uyumlu)
 */
function cipherTransform(text: string, secret: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const textCharCode = text.charCodeAt(i);
    const secretCharCode = secret.charCodeAt(i % secret.length);
    result += String.fromCharCode(textCharCode ^ secretCharCode);
  }
  return result;
}

/**
 * Düz metni şifreler (ör. "12345678901" -> "ENC:...")
 */
export function encryptText(plainText?: string | null): string {
  if (!plainText || typeof plainText !== 'string' || !plainText.trim()) {
    return plainText || '';
  }

  // Zaten şifrelenmişse tekrar şifreleme
  if (plainText.startsWith('ENC:')) {
    return plainText;
  }

  const secretKey = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_KVKK_ENCRYPTION_KEY) || DEFAULT_SECRET;
  try {
    const cipher = cipherTransform(plainText, secretKey);
    // Base64 encode using btoa or Buffer
    const encoded = typeof btoa !== 'undefined'
      ? btoa(encodeURIComponent(cipher))
      : Buffer.from(encodeURIComponent(cipher)).toString('base64');
    return `ENC:${encoded}`;
  } catch (err) {
    console.error('[cryptoUtils] Encryption error:', err);
    return plainText;
  }
}

/**
 * Şifrelenmiş metni deşifre eder (ör. "ENC:..." -> "12345678901")
 */
export function decryptText(cipherText?: string | null): string {
  if (!cipherText || typeof cipherText !== 'string' || !cipherText.startsWith('ENC:')) {
    return cipherText || '';
  }

  const secretKey = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_KVKK_ENCRYPTION_KEY) || DEFAULT_SECRET;
  try {
    const rawEncoded = cipherText.substring(4);
    const decodedStr = typeof atob !== 'undefined'
      ? decodeURIComponent(atob(rawEncoded))
      : decodeURIComponent(Buffer.from(rawEncoded, 'base64').toString('utf8'));
    return cipherTransform(decodedStr, secretKey);
  } catch (err) {
    console.error('[cryptoUtils] Decryption error:', err);
    return cipherText;
  }
}

/**
 * TC Kimlik Numarasını KVKK standartlarına uygun maskeler (ör. "12345678901" -> "123*****901")
 */
export function maskTc(tc?: string | null): string {
  if (!tc || typeof tc !== 'string') return '';
  const cleanTc = decryptText(tc); // Zaten şifreliyse önce deşifre et
  if (cleanTc.length < 11) return cleanTc;
  return `${cleanTc.substring(0, 3)}*****${cleanTc.substring(8)}`;
}
