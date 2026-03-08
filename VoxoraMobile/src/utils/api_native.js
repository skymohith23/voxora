import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. CHANGE THIS to your laptop's IP (e.) for your physical phone
// Remove the space between http:// and the IP address
export const API_BASE = "http://192.168.1.4:8000";

const request = async (endpoint, options = {}) => {
  const token = await AsyncStorage.getItem('userToken');
  
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw { response: { data: errorData } }; 
  }

  return { data: await response.json() };
};

export const loginUser = (email, password) => 
    request("/login", { method: 'POST', body: JSON.stringify({ email, password }) });

export const registerUser = (userData) => 
    request("/register", { method: 'POST', body: JSON.stringify(userData) });

export const sendLiveLocation = (coords) => 
    request("/me/location", { method: 'POST', body: JSON.stringify(coords) });

export const getEmergencyDashboard = () => 
    request("/emergency/contacts", { method: 'GET' });

// Add these for your EmergencyText.js compatibility
const axiosInst = {
  get: (url) => request(url, { method: 'GET' }),
  post: (url, data) => request(url, { method: 'POST', body: JSON.stringify(data) }),
};

export default axiosInst;