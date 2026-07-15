const { encrypt, decrypt } = require("../utils/crypto");

module.exports = (req, res, next) => {
  console.log("Incoming request to encryption middleware:", req.method, req.url, "body:", req.body);
  // 1. Decrypt incoming requests (if encrypted)
  if (req.body && req.body.encrypted) {
    const decrypted = decrypt(req.body.encrypted);
    console.log("Decrypted payload:", decrypted);
    if (decrypted) {
      req.body = decrypted;
    } else {
      console.error("Decryption failed! Ciphertext was:", req.body.encrypted);
      return res.status(400).json({ message: "Failed to decrypt request payload" });
    }
  }

  // 2. Intercept and encrypt outgoing JSON responses
  const originalJson = res.json;
  res.json = function (body) {
    if (body && body.encrypted) {
      return originalJson.call(this, body);
    }
    
    // Encrypt the payload
    const cipherText = encrypt(body);
    if (cipherText) {
      return originalJson.call(this, { encrypted: cipherText });
    }
    
    return originalJson.call(this, body);
  };

  next();
};
