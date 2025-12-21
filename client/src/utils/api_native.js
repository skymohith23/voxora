// src/utils/api_native.js
import axios from "axios";

export const API_BASE = "http://192.168.1.4:8000"; // update to your server IP/port reachable by mobile device

const axiosInst = axios.create({
  baseURL: API_BASE,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
  timeout: 10000,
});

export const apiRecognizeBase64 = (dataUrl) =>
  axiosInst.post("/recognize-frame", { image_base64: dataUrl });

export default axiosInst;
