import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: '/api',
  headers: { 
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add authentication token if available
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      message: error.message,
      status: error?.response?.status,
      data: error?.response?.data
    });
    return Promise.reject(error);
  }
);

export default axiosInstance;
