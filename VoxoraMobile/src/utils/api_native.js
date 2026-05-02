import AsyncStorage from '@react-native-async-storage/async-storage';

// Ensure this matches your laptop's IPv4 address
export const API_BASE = "http://192.168.1.4:8000";

// CRITICAL: Used by EmergencyCall.js for signaling and media relay
export const WS_BASE = "ws://192.168.1.4:8000";

const request = async (endpoint, options = {}) => {
  const token = await AsyncStorage.getItem('userToken'); 
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}), 
    ...options.headers,
  };

  // Log the exact URL for easier terminal debugging
  console.log(`🌐 API CALL: ${API_BASE}${endpoint}`);

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw { response: { data: errorData }, status: response.status }; 
  }

  const result = await response.json();
  return { data: result };
};

// --- AUTH EXPORTS ---

export const loginUser = (email, password) => 
  request('/login', { 
    method: 'POST', 
    body: JSON.stringify({ email, password }) 
  }); 

// Required for initial user creation during your terminal tests
export const registerUser = (userData) => 
  request('/register', { 
    method: 'POST', 
    body: JSON.stringify(userData) 
  }); 

const axiosInst = {
  get: (url) => request(url, { method: 'GET' }),
  post: (url, data) => request(url, { method: 'POST', body: JSON.stringify(data) }),
};

export default axiosInst;