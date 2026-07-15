import axios from "axios";
import { encrypt, decrypt } from "./crypto";

// Request interceptor: encrypt data payload before sending
axios.interceptors.request.use(
  (config) => {
    // Add JWT token to Authorization header if present
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Only encrypt POST, PUT, PATCH requests that have a body
    if (config.data && (config.method === "post" || config.method === "put" || config.method === "patch")) {
      const encrypted = encrypt(config.data);
      if (encrypted) {
        config.data = { encrypted };
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: decrypt data payload upon receiving
axios.interceptors.response.use(
  (response) => {
    if (response.data && response.data.encrypted) {
      const decrypted = decrypt(response.data.encrypted);
      if (decrypted) {
        response.data = decrypted;
      }
    }
    return response;
  },
  (error) => {
    // Attempt to decrypt error messages as well
    if (error.response && error.response.data && error.response.data.encrypted) {
      const decrypted = decrypt(error.response.data.encrypted);
      if (decrypted) {
        error.response.data = decrypted;
      }
    }
    return Promise.reject(error);
  }
);
