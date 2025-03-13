/// <reference types="vite/client" />

import axios from 'axios';

// Create API instance with environment-specific configuration
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging and headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers['X-Xano-Authorization'] = token;
    config.headers['X-Xano-Authorization-Only'] = 'true';
  }

  // Log request in development
  if (import.meta.env.VITE_ENV === 'development') {
    console.log('API Request:', {
      method: config.method,
      url: config.url,
      headers: config.headers
    });
  }

  return config;
});

// Add response interceptor for error handling and logging
api.interceptors.response.use(
  (response) => {
    // Log successful response in development
    if (import.meta.env.VITE_ENV === 'development') {
      console.log('API Response:', {
        status: response.status,
        url: response.config.url
      });
    }
    return response;
  },
  (error) => {
    // Create a sanitized error object
    const sanitizedError = {
      status: error.response?.status || 500,
      message: error.response?.data?.message || 'An error occurred',
      code: error.code || 'UNKNOWN_ERROR'
    };
    
    // Log error in development
    if (import.meta.env.VITE_ENV === 'development') {
      console.error('API Error:', sanitizedError.message);
    }
    
    // Remove sensitive information
    error.response = undefined;
    error.config = undefined;
    
    return Promise.reject(sanitizedError);
  }
);

// API endpoints configuration
export const AUTH_ENDPOINTS = { 
  ME: '/auth/me',
  LOGIN: '/auth/login',
  VERIFY_OTP: '/verify/otp/code'
} as const;

// Auth service functions
export const login = async (credentials: { email: string; password: string }) => {
  return api.post(AUTH_ENDPOINTS.LOGIN, credentials);
};

export const verifyOTP = async (otp: string, email: string) => {
  return api.post(AUTH_ENDPOINTS.VERIFY_OTP, {
    OTP: parseInt(otp),
    type: true,
    contact: email
  });
};

// Add type for the response (adjust according to your actual user data structure)
export interface UserResponse {
  id: string;
  OTP: number;
  role: string;
  email: string;
  image: {
    url: string;
    meta: {
      width: number;
      height: number;
    };
    mime: string;
    name: string;
    path: string;
    size: number;
    type: string;
    access: string;
  };
  city: string;
  address: string;
  country: string;
  userName: string;
  postalCode: string;
  dateOfBirth: number | null;
  branchId: string;
  fullName: string;
  created_at: number;
  phoneNumber: string;
  restaurantId: string;
  branchesTable: {
    id: string;
    branchName: string;
    branchLocation: string;
  };
  _restaurantTable: Array<{
    id: string;
    restaurantName: string;
  }>;
  password?: string;
}

export const getAuthenticatedUser = () => {
  return api.get<UserResponse>(AUTH_ENDPOINTS.ME);
};

export const deleteUser = async (userId: string) => {
  try {
    const response = await axios.delete(
      `${import.meta.env.VITE_API_URL}/delikaquickshipper_user_table/${userId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}; 