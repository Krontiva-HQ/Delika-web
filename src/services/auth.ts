import { api } from './api';  

const loginAPI = async (credentials: any) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const login = async (credentials: any) => {
  const response = await loginAPI(credentials);
  
  if (response.token) {
    localStorage.setItem('auth_token', response.token);
    return true;
  }
  return false;
};

export const checkAuthStatus = async (): Promise<boolean> => {
  const token = localStorage.getItem('authToken');
  const twoFAVerified = localStorage.getItem('2faVerified');
  
  // Only consider authenticated if both token exists and 2FA is verified
  return !!(token && twoFAVerified === 'true');
}; 