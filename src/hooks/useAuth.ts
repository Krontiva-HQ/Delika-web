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
    setError(null); // Clear any previous errors
    
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.authToken) {
        // Clear any existing auth data first
        localStorage.removeItem('2faVerified');
        localStorage.removeItem('userProfile');
        
        // Save new auth token
        localStorage.setItem('authToken', response.data.authToken);
        
        // Get initial user profile
        const userProfile = await getAuthenticatedUser();
        localStorage.setItem('userProfile', JSON.stringify(userProfile.data));
        setUser(userProfile.data);

        // Use setTimeout to ensure state updates are complete before navigation
        setTimeout(() => {
          navigate('/2fa-login', { replace: true }); // Use replace to prevent back navigation
        }, 100);

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
    setError(null);
    
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/verify/otp/code`,
        { 
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
        
        // Use setTimeout to ensure state updates are complete
        setTimeout(() => {
          // Redirect based on role with replace to prevent back navigation
          if (userProfile.role === 'Store Clerk') {
            navigate('/dashboard/orders', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        }, 100);
        
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