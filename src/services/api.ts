/// <reference types="vite/client" />

import axios from 'axios';

const BASE_URL = `${import.meta.env.VITE_API_URL}`;

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to include auth token in requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers['X-Xano-Authorization'] = token;
    config.headers['X-Xano-Authorization-Only'] = 'true';
  }
  return config;
});

// Add the auth endpoint
export const AUTH_ENDPOINTS = { 
  ME: '/auth/me'
} as const;

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

// Add auth service function
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