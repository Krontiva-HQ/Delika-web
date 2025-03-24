/// <reference types="vite/client" />

import axios from 'axios';

// Create API instance with simplified configuration
const api = axios.create({
  baseURL: import.meta.env.PROXY_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

export { api };


// Add a debug flag (you can control this via env variable)
const DEBUG_API = false;

// Add this helper function at the top of the file
const safebtoa = (str: string) => {
  try {
    return btoa(str);
  } catch (e) {
    // For environments where btoa isn't available
    return Buffer.from(str).toString('base64');
  }
};

// Add request interceptor for auth
api.interceptors.request.use((config) => {
  if (config.url === API_ENDPOINTS.AUTH.LOGIN) {
    const apiKey = import.meta.env.API_KEY || 'api:uEBBwbSs';
    config.headers['Authorization'] = `Basic ${safebtoa(apiKey)}`;
  } else {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['X-Xano-Authorization'] = token;
      config.headers['X-Xano-Authorization-Only'] = 'true';
    }
  }
  return config;
});

// Simplified error handling without logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const sanitizedError = {
      status: error.response?.status || 500,
      message: 'An error occurred',
      code: 'ERROR'
    };
    return Promise.reject(sanitizedError);
  }
);

// Add all API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    ME: '/auth/me',
    LOGIN: '/auth/login',
    VERIFY_OTP: '/verify/otp/code',
    RESET_PASSWORD: '/reset/user/password/email',
    CHANGE_PASSWORD: '/change/password'
  },
  DASHBOARD: {
    GET_DATA: '/get/dashboard/data'
  },
  ORDERS: {
    GET_DETAILS: (orderNumber: string) => `/get/order/id/${orderNumber}`,
    FILTER_BY_DATE: '/filter/orders/by/date',
    GET_ALL_PER_BRANCH: '/get/all/orders/per/branch',
    EDIT: '/edit/order',
    PLACE_ORDER: '/delikaquickshipper_orders_table'
  },
  CATEGORY: {
    CREATE: '/create/new/category',
    ADD_ITEM: '/add/item/to/category'
  },
  TEAM: {
    ADD_MEMBER: '/add/member/to/restaurant',
    GET_MEMBERS: '/get/team/members',
    GET_MEMBERS_ADMIN: '/get/team/members/admin',
    UPDATE_MEMBER: (userId: string) => `/delikaquickshipper_user_table/${userId}`
  },
  MENU: {
    GET_ALL: '/get/all/menu',
    UPDATE_INVENTORY: '/update/inventory/price/quantity'
  },
  AUDIT: {
    GET_ALL: '/delikaquickshipper_audit_table'
  },
  BRANCHES: {
    GET_BY_RESTAURANT: (restaurantId: string) => `/delikaquickshipper_branches_table/${restaurantId}`
  },
  USER: {
    DELETE: (userId: string) => `/delikaquickshipper_user_table/${userId}`,
    UPDATE: (userId: string) => `/delikaquickshipper_user_table/${userId}`
  }
} as const;

// Example of updated login function
export const login = async (credentials: { email: string; password: string }) => {
  try {
    const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
    return response;
  } catch (error) {
    throw error;
  }
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

export const changePassword = async (email: string, password: string) => {
  return api.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, { email, password });
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
  return api.delete(API_ENDPOINTS.USER.DELETE(userId), {
    data: { delikaquickshipper_user_table_id: userId }
  });
};

export const updateUser = async (data: FormData | Record<string, any>) => {
  const userId = data instanceof FormData ? data.get('userId') : data.userId;
  return api.patch(API_ENDPOINTS.USER.UPDATE(userId as string), data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
  });
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

// Team service functions
export interface AddMemberParams {
  restaurantId: string | null;
  branchId: string | null;
  email: string;
  role: string;
  fullName: string;
  phoneNumber: string;
  Status: boolean;
}

export const addMember = (params: AddMemberParams) => {
  return api.post(API_ENDPOINTS.TEAM.ADD_MEMBER, params);
};

export const getTeamMembers = (data: { restaurantId: string; branchId: string }) => {
  return api.post(API_ENDPOINTS.TEAM.GET_MEMBERS, data);
};

export const getTeamMembersAdmin = (data: { restaurantId: string }) => {
  return api.post(API_ENDPOINTS.TEAM.GET_MEMBERS_ADMIN, data);
};

export const updateTeamMember = async (data: FormData) => {
  const userId = data.get('userId');
  return api.patch(API_ENDPOINTS.TEAM.UPDATE_MEMBER(userId as string), data);
};

// Background refresh operations
export const filterOrdersByDate = (params: { restaurantId: string; branchId: string; date: string }) => {
  return api.get(API_ENDPOINTS.ORDERS.FILTER_BY_DATE, { params });
};

export const getAllOrdersPerBranch = (params: { restaurantId: string; branchId: string }) => {
  return api.get(API_ENDPOINTS.ORDERS.GET_ALL_PER_BRANCH, { params });
};

export const getAuditLogs = (params: { restaurantId: string; branchId: string }) => {
  return api.get(API_ENDPOINTS.AUDIT.GET_ALL, { params });
};

// Branch interfaces and functions
export interface Branch {
  id: string;
  created_at: number;
  branchName: string;
  restaurantID: string;
  branchLocation: string;
  branchPhoneNumber: string;
  branchCity: string;
  branchLongitude: string;
  branchLatitude: string;
}

export const getBranchesByRestaurant = (restaurantId: string) => {
  return api.get<Branch[]>(API_ENDPOINTS.BRANCHES.GET_BY_RESTAURANT(restaurantId));
};

export interface EditOrderParams {
  dropOff: {
    toAddress: string;
    toLatitude: string;
    toLongitude: string;
  }[];
  orderNumber: number;
  deliveryDistance: string;
  trackingUrl: string;
  orderStatus: string;
  deliveryPrice: string;
  totalPrice: string;
  paymentStatus: string;
  dropOffCity: string;
}

export const editOrder = async (params: EditOrderParams) => {
  return api.patch(API_ENDPOINTS.ORDERS.EDIT, params);
};

export interface UpdateInventoryParams {
  menuId: string | null;
  newPrice: string;
  name: string;
  description: string;
  available: boolean;
}

export const updateInventory = async (params: UpdateInventoryParams) => {
  return api.patch(API_ENDPOINTS.MENU.UPDATE_INVENTORY, params);
};

// Menu service functions
export const getAllMenu = (data: { restaurantId: string; branchId: string }) => {
  return api.post(API_ENDPOINTS.MENU.GET_ALL, data);
};

// Update the placeOrder function
export const placeOrder = async (formData: FormData) => {
  // Convert FormData to JSON object
  const jsonData = Object.fromEntries(formData.entries());

  // Extract products from FormData
  const products = [];
  let index = 0;
  while (true) {
    const productName = jsonData[`products[${index}][name]`];
    if (!productName) break; // Exit loop if no more products

    const product = {
      name: productName,
      price: jsonData[`products[${index}][price]`],
      quantity: jsonData[`products[${index}][quantity]`]
    };
    products.push(product);
    index++;
  }

  // Format the data to match the expected structure
  const orderPayload = {
    branchId: jsonData.branchId,
    courierName: jsonData.courierName || '',
    customerName: jsonData.customerName,
    customerPhoneNumber: jsonData.customerPhoneNumber,
    deliveryDistance: jsonData.deliveryDistance,
    deliveryPrice: jsonData.deliveryPrice,
    dropOff: [{
      toAddress: jsonData['dropOff[0][toAddress]'],
      toLatitude: jsonData['dropOff[0][toLatitude]'],
      toLongitude: jsonData['dropOff[0][toLongitude]']
    }],
    dropoffName: jsonData.dropoffName,
    foodAndDeliveryFee: jsonData.foodAndDeliveryFee === 'true',
    onlyDeliveryFee: jsonData.onlyDeliveryFee === 'true',
    orderComment: jsonData.orderComment || '',
    orderDate: jsonData.orderDate,
    orderNumber: jsonData.orderNumber,
    orderPrice: jsonData.orderPrice,
    orderStatus: jsonData.orderStatus,
    payLater: jsonData.payLater === 'true',
    payNow: jsonData.payNow === 'true',
    pickup: [{
      fromAddress: jsonData['pickup[0][fromAddress]'],
      fromLatitude: jsonData['pickup[0][fromLatitude]'],
      fromLongitude: jsonData['pickup[0][fromLongitude]']
    }],
    pickupName: jsonData.pickupName,
    products: products, // Use the extracted products array
    restaurantId: jsonData.restaurantId,
    totalPrice: jsonData.totalPrice,
    trackingUrl: jsonData.trackingUrl || '',
    walkIn: jsonData.walkIn === 'true' || jsonData.Walkin === 'true' // Handle both cases
  };

  // Use the api instance directly with the correct endpoint
  return api.post('/delikaquickshipper_orders_table', orderPayload);
}; 