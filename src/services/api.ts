/// <reference types="vite/client" />

import axios from 'axios';

// Get environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.API_BASE_URL || 'https://api-server.krontiva.africa/api:uEBBwbSs';
const PROXY_URL = '/api'; // Simplified proxy URL
const IS_PRODUCTION = import.meta.env.PROD || import.meta.env.ENV === 'production';

// Remove hardcoded token and use environment variable
if (!import.meta.env.VITE_XANO_AUTH_TOKEN) {
  throw new Error('VITE_XANO_AUTH_TOKEN is not defined in environment variables');
}

// Create API instance with simplified configuration
const api = axios.create({
  baseURL: IS_PRODUCTION ? API_BASE_URL : PROXY_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `${import.meta.env.VITE_XANO_AUTH_TOKEN}`
  }
});

// Create a direct API instance that always uses the direct API URL
const directApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `${import.meta.env.VITE_XANO_AUTH_TOKEN}`
  }
});

export { api, directApi };

// Add this helper function at the top of the file
const safebtoa = (str: string) => {
  try {
    return btoa(str);
  } catch (e) {
    // For environments where btoa isn't available
    return Buffer.from(str).toString('base64');
  }
};

// Add token helper
const getAuthToken = () => {
  return `${import.meta.env.VITE_XANO_AUTH_TOKEN}`;
};

// Add request interceptor for auth
api.interceptors.request.use((config) => {
  if (config.url === API_ENDPOINTS.AUTH.LOGIN) {
    const apiKey = import.meta.env.API_KEY || 'api:uEBBwbSs';
    config.headers['Authorization'] = `Basic ${safebtoa(apiKey)}`;
  } else {
    config.headers['Authorization'] = `${import.meta.env.VITE_XANO_AUTH_TOKEN}`;
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
    LOGIN_PHONE: '/auth/login/restaurant/staff/phoneNumber',
    VERIFY_OTP: '/verify/otp/code',
    VERIFY_OTP_PHONE: '/verify/otp/code/phoneNumber',
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
    ACCEPT_DECLINE: '/accept/decline/orders',
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
    GET_ALL_CATEGORIES: '/get/menu/categories',
    UPDATE_INVENTORY: '/update/inventory/price/quantity',
    GET_ALL_INVENTORY: '/get/inventory/by/restaurant',
    UPDATE_INVENTORY_ITEM: '/update/inventory/item'
  },
  INVENTORY: {
    GET_ALL: '/delika_inventory_table',
    UPDATE_ITEM: '/update/inventory/item'
  },
  CREATE_EXTRAS_ITEM: '/create/extras/item',
  AUDIT: {
    GET_ALL: '/delikaquickshipper_audit_table'
  },
  BRANCHES: {
    GET_BY_RESTAURANT: (restaurantId: string) => `/delikaquickshipper_branches_table/${restaurantId}`,
    UPDATE_BRANCH: (branchId: string) => `/delikaquickshipper_branches_table/${branchId}`
  },
  USER: {
    DELETE: (userId: string) => `/delikaquickshipper_user_table/${userId}`,
    UPDATE: (userId: string) => `/delikaquickshipper_user_table/${userId}`
  },
  RESTAURANT: {
    UPDATE_PREFERENCES: '/set/restaurant/preference'
  },
  RIDERS: {
    DELETE: '/remove/courier/from/branch',
    GET_BY_BRANCH: '/get/rider/from/branch'
  }
} as const;

// Example of updated login function
export const login = async (credentials: { email: string; password: string }) => {
  try {
    const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
    await Promise.all([
      localStorage.removeItem('2faVerified'),
      localStorage.removeItem('userProfile'),
      localStorage.setItem('authToken', response.data.authToken),
      localStorage.setItem('loginMethod', 'email')
    ]);
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
    language: string;
    AutoAssign: boolean;
    AutoCalculatePrice: boolean;
  }>;
  password?: string;
}

export const getAuthenticatedUser = () => {
  const token = localStorage.getItem('authToken');
  const headers = {
    'Content-Type': 'application/json',
    'X-Xano-Authorization': token,
    'X-Xano-Authorization-Only': 'true'
  };
  return api.get<UserResponse>(API_ENDPOINTS.AUTH.ME, { headers });
};

export const deleteUser = async (userId: string) => {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `${import.meta.env.VITE_XANO_AUTH_TOKEN}`
  };
  return api.delete(API_ENDPOINTS.USER.DELETE(userId), {
    data: { delikaquickshipper_user_table_id: userId },
    headers
  });
};

export const updateUser = async (data: FormData | Record<string, any>) => {
  const userId = data instanceof FormData ? data.get('userId') : data.userId;
  const headers = {
    'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json',
    'Authorization': `${import.meta.env.VITE_XANO_AUTH_TOKEN}`
  };
  return api.patch(API_ENDPOINTS.USER.UPDATE(userId as string), data, { headers });
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
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `${import.meta.env.VITE_XANO_AUTH_TOKEN}`
  };
  return api.get<OrderDetails>(API_ENDPOINTS.ORDERS.GET_DETAILS(orderNumber), { headers });
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
  const headers = {
    'Content-Type': 'multipart/form-data',
    'Authorization': `${import.meta.env.VITE_XANO_AUTH_TOKEN}`
  };

  return directApi.patch<{data: any; status: number}>(
    API_ENDPOINTS.CATEGORY.ADD_ITEM, 
    formData, 
    { headers }
  );
};

export const createCategory = (formData: FormData) => {
  const headers = {
    'Content-Type': 'multipart/form-data',
    'Authorization': `${import.meta.env.VITE_XANO_AUTH_TOKEN}`
  };

  return directApi.post(
    API_ENDPOINTS.CATEGORY.CREATE, 
    formData, 
    { headers }
  );
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
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `${import.meta.env.VITE_XANO_AUTH_TOKEN}`
  };
  return api.post(API_ENDPOINTS.TEAM.ADD_MEMBER, params, { headers });
};

export const getTeamMembers = async (data: { restaurantId: string; branchId: string }) => {
  const requestParams = data;
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': token
  };

  return api.post(API_ENDPOINTS.TEAM.GET_MEMBERS, JSON.stringify(requestParams), {
    headers
  });
};

export const getTeamMembersAdmin = (data: { restaurantId: string }) => {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `${import.meta.env.VITE_XANO_AUTH_TOKEN}`
  };
  return api.post(API_ENDPOINTS.TEAM.GET_MEMBERS_ADMIN, data, { headers });
};

export const updateTeamMember = async (data: FormData) => {
  const userId = data.get('userId');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `${import.meta.env.VITE_XANO_AUTH_TOKEN}`
  };
  return api.patch(API_ENDPOINTS.TEAM.UPDATE_MEMBER(userId as string), data, { headers });
};

// Background refresh operations
export const filterOrdersByDate = async (params: { restaurantId: string; branchId: string; date: string }) => {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `${import.meta.env.VITE_XANO_AUTH_TOKEN}`
  };

  return api.get(API_ENDPOINTS.ORDERS.FILTER_BY_DATE, {
    params: params,
    headers
  });
};

export const getAllOrdersPerBranch = (params: { restaurantId: string; branchId: string }) => {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `${import.meta.env.VITE_XANO_AUTH_TOKEN}`
  };
  return api.get(API_ENDPOINTS.ORDERS.GET_ALL_PER_BRANCH, { 
    params,
    headers
  });
};

export const getAuditLogs = (params: { restaurantId: string; branchId: string }) => {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `${import.meta.env.VITE_XANO_AUTH_TOKEN}`
  };
  return api.get(API_ENDPOINTS.AUDIT.GET_ALL, { 
    params,
    headers
  });
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
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `${import.meta.env.VITE_XANO_AUTH_TOKEN}`
  };
  return api.get<Branch[]>(API_ENDPOINTS.BRANCHES.GET_BY_RESTAURANT(restaurantId), { headers });
};

export const updateBranch = async (branchId: string, branchData: any) => {
  const token = localStorage.getItem('authToken');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `${import.meta.env.VITE_XANO_AUTH_TOKEN}`
  };
  
  return api.patch(API_ENDPOINTS.BRANCHES.UPDATE_BRANCH(branchId), branchData, { headers });
};

export interface EditOrderParams {
  dropOff?: {
    toAddress: string;
    toLatitude: string;
    toLongitude: string;
  }[];
  orderNumber: number;
  customerName: string;
  deliveryDistance?: string;
  trackingUrl?: string;
  orderStatus: string;
  deliveryPrice?: string;
  totalPrice: string;
  paymentStatus: string;
  dropOffCity?: string;
  orderComment?: string;
  payNow?: boolean;
  payLater?: boolean;
  payVisaCard?: boolean;
}

export const editOrder = async (params: EditOrderParams) => {
  const requestParams = params;
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': token
  };

  return api.patch(API_ENDPOINTS.ORDERS.EDIT, JSON.stringify(requestParams), {
    headers
  });
};

export interface UpdateInventoryParams {
  menuId: string | null;
  newPrice: string;
  name: string;
  description: string;
  available: boolean;
}

export const updateInventory = async (params: UpdateInventoryParams) => {
  const requestParams = params;
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': token
  };

  return api.patch(API_ENDPOINTS.MENU.UPDATE_INVENTORY, JSON.stringify(requestParams), {
    headers
  });
};

// Menu service functions
export const getAllMenu = async (data: { restaurantId: string; branchId: string }) => {
  const requestParams = data;
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': token
  };

  return api.post(API_ENDPOINTS.MENU.GET_ALL, JSON.stringify(requestParams), {
    headers
  });
};

// Update the placeOrder function
export const placeOrder = async (formData: FormData) => {
  const jsonData = Object.fromEntries(formData.entries());
  
  // Extract products from form data
  const products = [];
  let index = 0;
  while (jsonData[`products[${index}][name]`]) {
    products.push({
      name: jsonData[`products[${index}][name]`],
      price: jsonData[`products[${index}][price]`],
      quantity: jsonData[`products[${index}][quantity]`],
      foodImage: jsonData[`products[${index}][foodImage][url]`] ? {
        url: jsonData[`products[${index}][foodImage][url]`],
        filename: '',
        type: '',
        size: 0
      } : undefined
    });
    index++;
  }

  // Handle price calculations based on what's available
  const deliveryPrice = jsonData.deliveryPrice ? parseFloat(jsonData.deliveryPrice as string) : 0;
  const orderPrice = jsonData.orderPrice ? parseFloat(jsonData.orderPrice as string) : 0;
  let totalPrice = 0;

  if (deliveryPrice > 0 && orderPrice > 0) {
    // Both prices exist - add them together
    totalPrice = deliveryPrice + orderPrice;
  } else if (deliveryPrice > 0 && !orderPrice) {
    // Only delivery price exists
    totalPrice = deliveryPrice;
  } else if (!deliveryPrice && orderPrice > 0) {
    // Only order price exists
    totalPrice = orderPrice;
  }

  const orderPayload = {
    branchId: jsonData.branchId,
    courierName: jsonData.courierName || '',
    customerName: jsonData.customerName,
    customerPhoneNumber: jsonData.customerPhoneNumber,
    deliveryDistance: jsonData.deliveryDistance,
    deliveryPrice: deliveryPrice > 0 ? deliveryPrice.toString() : '',
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
    orderPrice: orderPrice > 0 ? orderPrice.toString() : '',
    orderStatus: jsonData.orderStatus,
    payLater: jsonData.payLater === 'true',
    payNow: jsonData.payNow === 'true',
    courierId: jsonData.courierId,
    payVisaCard: jsonData.payVisaCard === 'true',
    pickup: [{
      fromAddress: jsonData['pickup[0][fromAddress]'],
      fromLatitude: jsonData['pickup[0][fromLatitude]'],
      fromLongitude: jsonData['pickup[0][fromLongitude]']
    }],
    pickupName: jsonData.pickupName,
    products: products,
    restaurantId: jsonData.restaurantId,
    distance: jsonData.deliveryDistance,
    trackingUrl: jsonData.trackingUrl || '',
    totalPrice: totalPrice.toString(),
    Walkin: jsonData.Walkin === 'true',
    batchID: jsonData.batchID || null,
    scheduledTime: jsonData['scheduleTime[scheduleDateTime]'] ? 
      jsonData['scheduleTime[scheduleDateTime]'] : undefined
  };

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `${import.meta.env.VITE_XANO_AUTH_TOKEN}`
  };

  return api.post(API_ENDPOINTS.ORDERS.PLACE_ORDER, orderPayload, { headers });
};

// Add restaurant settings interface and function
export interface RestaurantPreferences {
  restaurantId: string | null;
  AutoAssign: boolean;
  AutoCalculatePrice: boolean;
  language: string;
}

export const updateRestaurantPreferences = async (preferences: RestaurantPreferences) => {
  try {
    const response = await api.patch(API_ENDPOINTS.RESTAURANT.UPDATE_PREFERENCES, preferences, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${import.meta.env.VITE_XANO_AUTH_TOKEN}`
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update rider service functions
export const getRidersByBranch = async (branchId: string) => {
  const requestParams = {
    branchName: branchId
  };
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': token
  };

  return api.get(API_ENDPOINTS.RIDERS.GET_BY_BRANCH, {
    params: requestParams,
    headers
  });
};

export const deleteRider = async (params: { 
  delikaquickshipper_user_table_id: string;
  branchName: string;
}) => {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `${import.meta.env.VITE_XANO_AUTH_TOKEN}`
  };
  return api.delete(API_ENDPOINTS.RIDERS.DELETE, { 
    data: {
      delikaquickshipper_user_table_id: params.delikaquickshipper_user_table_id,
      branchName: params.branchName
    },
    headers
  });
};

// Add delivery price calculation endpoint
export const CALCULATE_DELIVERY_PRICE_URL =
  'https://api-server.krontiva.africa/api:uEBBwbSs/calculate/delivery/price';

export interface CalculateDeliveryPriceParams {
  pickup: { fromLongitude: string | number; fromLatitude: string | number };
  dropOff: { toLongitude: string | number; toLatitude: string | number };
  rider?: boolean;
  pedestrian?: boolean;
}

export interface CalculateDeliveryPriceResponse {
  riderFee: number;
  pedestrianFee: number;
  distance: number;
}

export const calculateDeliveryPriceAPI = async (
  params: CalculateDeliveryPriceParams
): Promise<CalculateDeliveryPriceResponse> => {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `${import.meta.env.VITE_XANO_AUTH_TOKEN}`
  };
  const response = await axios.post<CalculateDeliveryPriceResponse>(
    CALCULATE_DELIVERY_PRICE_URL,
    {
      pickup: params.pickup,
      dropOff: params.dropOff,
      rider: params.rider ?? false,
      pedestrian: params.pedestrian ?? false
    },
    { headers }
  );
  return response.data;
};

// Add new inventory service functions
export const getAllInventory = async () => {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `${import.meta.env.VITE_XANO_AUTH_TOKEN}`
  };
  return api.get(API_ENDPOINTS.INVENTORY.GET_ALL, { headers });
};

export interface UpdateInventoryItemRequest {
  old_name: string;
  old_item_description: string;
  old_item_price: number;
  new_name: string;
  new_item_description: string;
  new_item_price: number;
  available: boolean;
  extras: Array<{
    extrasTitle: string;
    delika_inventory_table_id: string;
  }>;
  restaurantId: string;
  branchId: string;
  value: string;
}

export const updateInventoryItem = async (data: UpdateInventoryItemRequest) => {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `${import.meta.env.VITE_XANO_AUTH_TOKEN}`
  };
  return api.patch(API_ENDPOINTS.INVENTORY.UPDATE_ITEM, data, { headers });
};

// Add phone login response interface
export interface PhoneLoginResponse extends UserResponse {
  onTrip: boolean;
  session: boolean;
  Location: {
    lat: number;
    long: number;
  };
  deviceId: string;
  tripCount: number;
  countryCode: string;
  // Default values for required UserResponse properties
  branchesTable: {
    id: string;
    branchName: string;
    branchLocation: string;
  };
  _restaurantTable: Array<{
    id: string;
    restaurantName: string;
    language: string;
    AutoAssign: boolean;
    AutoCalculatePrice: boolean;
  }>;
}

// Update phone login function to use UserResponse type
export const loginWithPhone = async (phoneNumber: string) => {
  try {
    const response = await api.post<string>(API_ENDPOINTS.AUTH.LOGIN_PHONE, { phoneNumber });
    localStorage.setItem('loginPhoneNumber', phoneNumber);
    await Promise.all([
      localStorage.removeItem('2faVerified'),
      localStorage.removeItem('userProfile'),
      localStorage.setItem('authToken', response.data),
      localStorage.setItem('loginMethod', 'phone')
    ]);
    return {
      data: {
        data: {
          authToken: response.data // The response.data is the JWT token
        }
      }
    };
  } catch (error) {
    throw error;
  }
};

export const verifyPhoneOTP = async (data: { 
  OTP: number,
  contact: string 
}) => {
  const response = await api.post(API_ENDPOINTS.AUTH.VERIFY_OTP_PHONE, data);
  return response;
};

const loginMethod = localStorage.getItem('loginMethod'); // 'email' or 'phone'

localStorage.removeItem('loginMethod');
localStorage.removeItem('loginPhoneNumber');

// Create extras item
export const createExtrasItem = async (payload: any) => {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `${import.meta.env.VITE_XANO_AUTH_TOKEN}`
  };
  return api.post(API_ENDPOINTS.CREATE_EXTRAS_ITEM, payload, { headers });
};