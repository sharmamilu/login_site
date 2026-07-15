import CryptoJS from "crypto-js";

const SECRET_KEY = import.meta.env.VITE_API_ENCRYPTION_KEY || "sharmamilu_login_site_secret_encryption_key_2026";

export function encrypt(data) {
  try {
    const jsonString = typeof data === "string" ? data : JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
  } catch (error) {
    console.error("Encryption error:", error);
    return null;
  }
}

export function decrypt(ciphertext) {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedText);
  } catch (error) {
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (e) {
      console.error("Decryption error:", e);
      return null;
    }
  }
}
