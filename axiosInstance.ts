import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: '/api', // This uses the Vite proxy
  headers: { 'Content-Type': 'application/json' },
});

export default axiosInstance;
