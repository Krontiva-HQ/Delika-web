/// <reference types="vite/client" />

import axios from 'axios';

// Create API instance with environment-specific configuration
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a debug flag (you can control this via env variable)
const DEBUG_API = false;

// Add request interceptor for logging and headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers['X-Xano-Authorization'] = token;
    config.headers['X-Xano-Authorization-Only'] = 'true';
  }

  // Only log if debug is enabled
  if (DEBUG_API && import.meta.env.DEV) {
    console.log('API Request:', {
      method: config.method,
      url: config.url,
    });
  }

  return config;
});

// Add response interceptor for error handling and logging
api.interceptors.response.use(
  (response) => {
    // Only log if debug is enabled
    if (DEBUG_API && import.meta.env.DEV) {
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
    
    // Only log errors (these are important)
    if (import.meta.env.DEV) {
      console.error('Error:', sanitizedError.message);
    }
    
    // Remove sensitive information
    error.response = undefined;
    error.config = undefined;
    
    return Promise.reject(sanitizedError);
  }
);

// Add all API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    ME: '/auth/me',
    LOGIN: '/auth/login',
    VERIFY_OTP: '/verify/otp/code',
    RESET_PASSWORD: '/reset/user/password/email'
  },
  DASHBOARD: {
    GET_DATA: '/get/dashboard/data'
  },
  ORDERS: {
    GET_DETAILS: (orderNumber: string) => `/get/order/id/${orderNumber}`,
  },
  CATEGORY: {
    CREATE: '/create/new/category',
    ADD_ITEM: '/add/item/to/category'
  }
} as const;

// Auth service functions
export const login = async (credentials: { email: string; password: string }) => {
  return api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
};

export const verifyOTP = async (data: { 
  OTP: number, 
  type: boolean, 
  contact: string 
}) => {
  return api.post(API_ENDPOINTS.AUTH.VERIFY_OTP, data);
};

export const resetPassword = async (email: string) => {
  return api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, { email });
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
  return api.get<UserResponse>(API_ENDPOINTS.AUTH.ME);
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

// Add dashboard service function
export const getDashboardData = async (data: { 
  restaurantId: string; 
  branchId: string 
}) => {
  return api.post(API_ENDPOINTS.DASHBOARD.GET_DATA, data);
};

// Add order service function
export const getOrderDetails = (orderNumber: string) => {
  return api.get<OrderDetails>(API_ENDPOINTS.ORDERS.GET_DETAILS(orderNumber));
};

// Add the OrderDetails interface
export interface OrderDetails {
  id: string;
  payNow: boolean;
  pickup: Array<{
    fromAddress: string;
    fromLatitude: number;
    fromLongitude: number;
    pickupName: string;
  }>;
  dropOff: Array<{
    toAddress: string;
    toLatitude: number;
    toLongitude: number;
  }>;
  branchId: string;
  payLater: boolean;
  products: Array<{
    name: string;
    image: {
      url: string;
      meta: any;
      mime: string;
      name: string;
      path: string;
      size: number;
      type: string;
      access: string;
    };
    price: number;
    quantity: number;
  }>;
  orderDate: string;
  created_at: number;
  orderPrice: number;
  pickupName: string;
  totalPrice: number;
  courierName: string;
  dropoffName: string;
  orderNumber: number;
  orderStatus: string;
  trackingUrl: string;
  customerName: string;
  restaurantId: string;
  deliveryPrice: number;
  paymentStatus: string;
  onlyDeliveryFee: boolean;
  deliveryDistance: number;
  courierPhoneNumber: string;
  foodAndDeliveryFee: boolean;
  customerPhoneNumber: string;
  branch: {
    branchName: string;
  };
}

// Add the service functions
export const addItemToCategory = (formData: FormData) => {
  return api.patch<{data: any; status: number}>(API_ENDPOINTS.CATEGORY.ADD_ITEM, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const createCategory = (formData: FormData) => {
  return api.post(API_ENDPOINTS.CATEGORY.CREATE, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}; 