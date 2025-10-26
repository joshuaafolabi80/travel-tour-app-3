// src/services/api.js - COMPLETE FIXED VERSION
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000,
});

// Enhanced request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    console.log('🔐 API Request:', config.method?.toUpperCase(), config.url);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('🚨 Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with better error handling
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    const errorDetails = {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    };
    
    console.error('🚨 API Error:', errorDetails);
    
    if (error.response?.status === 401) {
      console.log('🔒 Unauthorized - clearing tokens');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      // Optional: redirect to login page
      // window.location.href = '/login';
    }
    
    if (error.response?.status === 403) {
      console.log('🚫 Forbidden - insufficient permissions');
    }
    
    if (error.response?.status === 404) {
      console.log('🔍 Resource not found');
    }
    
    if (error.response?.status === 500) {
      console.log('💥 Server error - check server logs');
    }
    
    return Promise.reject(error);
  }
);

export default api;