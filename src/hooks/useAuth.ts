import { useState, useCallback, useMemo, useEffect } from 'react';
import { api, getAuthenticatedUser, UserResponse, login as apiLogin, verifyOTP } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useEmail } from '../context/EmailContext';
import axios from 'axios';

interface LoginResponse {
  success: boolean;
  authToken?: string;
  otpFound?: boolean;
  error?: string;
}

const ALLOWED_ROLES = ['Admin', 'Manager', 'Store Clerk'];

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

  // Remove the separate isAuthenticated state since we'll compute it from user and 2faVerified
  const isAuthenticated = useMemo(() => {
    const has2FAVerified = localStorage.getItem('2faVerified') === 'true';
    const hasAuthToken = !!localStorage.getItem('authToken');
    return !!user && has2FAVerified && hasAuthToken;
  }, [user]);

  // Add initialization effect
  useEffect(() => {
    const initializeAuth = async () => {
      const authToken = localStorage.getItem('authToken');
      const has2FAVerified = localStorage.getItem('2faVerified') === 'true';
      
      if (authToken && !user) {
        try {
          await fetchUserProfile();
        } catch (error) {
          // If fetching user profile fails, clear all auth data
          logout();
        }
      } else if (!authToken && user) {
        // Clear user if no auth token exists
        setUser(null);
      }
    };

    initializeAuth();
  }, []);

  // Step 1: Login
  const login = async (email: string, password: string): Promise<LoginResponse> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiLogin({ email, password });
      
      if (response.data.authToken) {
        // Handle state updates before navigation
        await Promise.all([
          localStorage.removeItem('2faVerified'),
          localStorage.removeItem('userProfile'),
          localStorage.setItem('authToken', response.data.authToken)
        ]);
        
        // Get user profile and update state
        const userProfile = await getAuthenticatedUser();
        
        // Check if user has allowed role
        if (!ALLOWED_ROLES.includes(userProfile.data.role)) {
          throw new Error('You do not have access to this application');
        }

        await localStorage.setItem('userProfile', JSON.stringify(userProfile.data));
        setUser(userProfile.data);
        
        // Use React Router's navigate without setTimeout
        navigate('/2fa-login', { replace: true });

        return { 
          success: true, 
          authToken: response.data.authToken
        };
      }
      
      throw new Error(response.data.error || 'Login failed');
    } catch (err: any) {
      // Clear any auth data if login fails
      localStorage.removeItem('authToken');
      localStorage.removeItem('userProfile');
      
      // Use sanitized error message
      const errorMessage = err.message === 'Invalid Credentials.' 
        ? 'Invalid email or password. Please try again.'
        : 'Login failed. Please try again.';
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify 2FA
  const verify2FA = async (otp: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    if (!email) {
      setError('Email not found. Please try logging in again.');
      setIsLoading(false);
      return false;
    }
    
    try {
      const response = await verifyOTP({
        OTP: parseInt(otp),
        type: true,
        contact: email
      });
      
      if (response.data.otpValidate === 'otpFound') {
        await localStorage.setItem('2faVerified', 'true');
        
        const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        
        const redirectPath = userProfile.role === 'Store Clerk' 
          ? '/dashboard/orders' 
          : '/dashboard';
        
        navigate(redirectPath, { replace: true });
        return true;
      }
      
      return false;
    } catch (err: any) {
      setError(err.message || 'Verification failed');
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
    isAuthenticated, // Now computed from useMemo
  };
};

export default useAuth; 