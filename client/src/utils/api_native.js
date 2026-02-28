// src/utils/api_native.js
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE = "http://192.168.1.4:8000";

const axiosInst = axios.create({
  baseURL: API_BASE,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
});

// Automatically add the JWT token to every request
axiosInst.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Authentication Calls
export const loginUser = (email, password) => 
    axiosInst.post("/login", { email, password });

export const registerUser = (userData) => 
    axiosInst.post("/register", userData);

// Emergency Features
export const sendLiveLocation = (coords) => 
    axiosInst.post("/me/location", coords);

export const getEmergencyDashboard = () => 
    axiosInst.get("/emergency/contacts");

export default axiosInst;