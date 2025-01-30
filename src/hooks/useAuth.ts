import { useState, useCallback } from 'react';
import { api, getAuthenticatedUser, UserResponse } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useEmail } from '../context/EmailContext';
import axios from 'axios';

interface LoginResponse {
  success: boolean;
  authToken?: string;
  otpFound?: boolean;
  error?: string;
}

export const useAuth = () => {
  const navigate = useNavigate();
  const { email } = useEmail();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserResponse | null>(() => {
    // Initialize user from localStorage if available
    const savedUser = localStorage.getItem('userProfile');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check localStorage on initial load
    return localStorage.getItem('auth_token') ? true : null;
  });

  // Step 1: Login
  const login = async (email: string, password: string): Promise<LoginResponse> => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.authToken) {
        // Save auth token
        localStorage.setItem('authToken', response.data.authToken);
        // Remove any existing 2FA verification
        localStorage.removeItem('2faVerified');
        
        // Get initial user profile
        const userProfile = await getAuthenticatedUser();
        localStorage.setItem('userProfile', JSON.stringify(userProfile.data));
        setUser(userProfile.data);

        // Always redirect to 2FA after login
        navigate('/2fa-login');
        return { 
          success: true, 
          authToken: response.data.authToken
        };
      }
      
      throw new Error(response.data.error || 'Login failed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      return { success: false, error: 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify 2FA
  const verify2FA = async (otp: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/verify/otp/code`,        { 
          OTP: parseInt(otp),
          type: true,
          contact: email
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );
      
      if (response.data.otpValidate === 'otpFound') {
        localStorage.setItem('2faVerified', 'true');
        
        // Get user role from stored profile
        const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        
        // Redirect Store Clerks directly to Orders page
        if (userProfile.role === 'Store Clerk') {
          navigate('/dashboard/orders');
        } else {
          navigate('/dashboard');
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('2faVerified');
    setUser(null);
    navigate('/login');
  }, [navigate]);

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await getAuthenticatedUser();
      const userData = response.data;
      localStorage.setItem('userProfile', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (error) {
      throw error;
    }
  }, []);

  return {
    login,
    verify2FA,
    isLoading,
    error,
    user,
    logout,
    fetchUserProfile,
    // Only authenticated if we have user data AND 2FA is verified
    isAuthenticated: !!user && localStorage.getItem('2faVerified') === 'true',
  };
};

export default useAuth; 