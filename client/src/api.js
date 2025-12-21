// src/api.js
import axios from "axios";

export const API_BASE = "http://192.168.1.4:8000"; // or your server IP:port

const axiosInst = axios.create({
  baseURL: API_BASE,
  headers: {
    "Accept": "application/json",
    "Content-Type": "application/json",
  },
});

export const apiRegister = (name, email, password) =>
  axiosInst.post("/register", { name, email, password });

export const apiLogin = (email, password) =>
  axiosInst.post("/login", { email, password });

export const apiMe = (user_id) => axiosInst.get(`/me/${user_id}`);

export const apiAddContact = (user_id, contact_email) =>
  axiosInst.post("/emergency-contact/add", { user_id, contact_email });

export const apiLoginCall = (from_email, to_email) =>
  axiosInst.post("/me/emergency-call", { from_email, to_email });

export const apiSendEmergencyText = (from_email, to_email, message) =>
  axiosInst.post("/me/emergency-text", { from_email, to_email, message });

export const apiRecognizeBase64 = (base64data) =>
  axiosInst.post("/recognize-frame", { image_base64: base64data });

export default axiosInst;
