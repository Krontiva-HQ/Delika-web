import { useState, useCallback, useMemo, useEffect } from 'react';
import { getAuthenticatedUser, UserResponse, login as apiLogin, verifyOTP, loginWithPhone, verifyPhoneOTP } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useEmail } from '../context/EmailContext';
import axios, { AxiosResponse } from 'axios';
import { BusinessUser, getBusinessTypeFromRole } from '../types/user';

interface LoginResponse {
  success: boolean;
  authToken?: string;
  otpFound?: boolean;
  error?: string;
}

// Updated allowed roles to include grocery and pharmacy roles
const ALLOWED_ROLES = [
  'Admin', 
  'Manager', 
  'Store Clerk',
  'Grocery-Admin',
  'Grocery-Manager',
  'Pharmacy-Admin',
  'Pharmacy-Manager'
];

export const useAuth = () => {
  const navigate = useNavigate();
  const { email } = useEmail();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<BusinessUser | null>(() => {
    // Initialize user from localStorage if available
    const savedUser = localStorage.getItem('userProfile');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Add initialization effect
  useEffect(() => {
    const initializeAuth = async () => {
      const authToken = localStorage.getItem('authToken');
      const has2FAVerified = localStorage.getItem('2faVerified') === 'true';
      const userProfile = localStorage.getItem('userProfile');
      const isPhoneLogin = !!localStorage.getItem('loginPhoneNumber');
      
      if (isPhoneLogin && userProfile) {
        // For phone login, use the stored user profile
        const parsedUser = JSON.parse(userProfile);
        // Add business type if not present
        if (!parsedUser.businessType) {
          parsedUser.businessType = getBusinessTypeFromRole(parsedUser.role);
        }
        setUser(parsedUser as BusinessUser);
      } else if (authToken && !isPhoneLogin) {
        // For email login, fetch user profile from API
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

        // Add business type to user profile
        const userWithBusinessType = {
          ...userProfile.data,
          businessType: getBusinessTypeFromRole(userProfile.data.role)
        };

        await localStorage.setItem('userProfile', JSON.stringify(userWithBusinessType));
        setUser(userWithBusinessType as BusinessUser);
        
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
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify 2FA
  const verify2FA = async (otp: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await verifyOTP({ 
        OTP: parseInt(otp), 
        type: true, 
        contact: email 
      });

      const otpStatus = response?.data?.otpValidate;
      console.log('🔐 useAuth: verify2FA otpValidate =', otpStatus);
      
      if (otpStatus === 'otpFound') {
        localStorage.setItem('2faVerified', 'true');
        
        // Get user profile again to ensure we have the latest data
        const userProfile = await getAuthenticatedUser();
        
        // Add business type to user profile
        const userWithBusinessType = {
          ...userProfile.data,
          businessType: getBusinessTypeFromRole(userProfile.data.role)
        };

        // Save grocery IDs if user is grocery-related
        if (userProfile.data.role.startsWith('Grocery-')) {
          if (userProfile.data.groceryShopId) {
            localStorage.setItem('groceryShopId', userProfile.data.groceryShopId);
          }
          if (userProfile.data.groceryBranchId) {
            localStorage.setItem('groceryBranchId', userProfile.data.groceryBranchId);
          }
        }

        await localStorage.setItem('userProfile', JSON.stringify(userWithBusinessType));
        setUser(userWithBusinessType as BusinessUser);
        
        // Navigate to dashboard
        navigate('/dashboard', { replace: true });
        
        return true;
      }

      if (otpStatus === 'otpNotExist') {
        throw new Error('Incorrect OTP code');
      }
      
      throw new Error('2FA verification failed');
    } catch (err: any) {
      setError(err.message || '2FA verification failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Phone login
  const loginWithPhoneNumber = async (phoneNumber: string): Promise<LoginResponse> => {
    console.log('🔐 useAuth: loginWithPhoneNumber called with phoneNumber =', phoneNumber);
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔐 useAuth: Calling loginWithPhone API...');
      const response = await loginWithPhone(phoneNumber);
      console.log('🔐 useAuth: loginWithPhone API response =', response);
      
      // Handle the actual API response structure
      if (response.data && response.data.data && response.data.data.authToken) {
        console.log('🔐 useAuth: Valid response structure found, storing authToken');
        localStorage.setItem('loginPhoneNumber', phoneNumber);
        localStorage.setItem('authToken', response.data.data.authToken);
        
        const result = { 
          success: true, 
          authToken: response.data.data.authToken,
          otpFound: true
        };
        console.log('🔐 useAuth: Returning successful response =', result);
        return result;
      }
      
      console.log('🔐 useAuth: Invalid response structure, throwing error');
      throw new Error('Phone login failed');
    } catch (err: any) {
      console.log('🔐 useAuth: Phone login error =', err);
      setError(err.message || 'Phone login failed');
      return { 
        success: false, 
        error: err.message || 'Phone login failed' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Phone 2FA verification
  const verifyPhone2FA = async (otp: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const phoneNumber = localStorage.getItem('loginPhoneNumber');
      if (!phoneNumber) {
        throw new Error('Phone number not found');
      }
      
      const response = await verifyPhoneOTP({ 
        OTP: parseInt(otp), 
        contact: phoneNumber 
      });

      const otpStatus = response?.data?.otpValidate;
      console.log('🔐 useAuth: verifyPhone2FA otpValidate =', otpStatus);
      
      if (otpStatus === 'otpFound') {
        // Mark 2FA as verified
        localStorage.setItem('2faVerified', 'true');

        // Prefer fetching the latest user via auth/me after verification
        let profileResponse: AxiosResponse<UserResponse> | null = null;
        try {
          profileResponse = await getAuthenticatedUser();
        } catch (fetchErr) {
          // Fallback to response user if auth/me is unavailable
          console.warn('verifyPhone2FA: getAuthenticatedUser failed, falling back to response.user');
        }

        const baseUser = profileResponse?.data || response.data.user;

        // Check if user has allowed role
        if (!ALLOWED_ROLES.includes(baseUser.role)) {
          throw new Error('You do not have access to this application');
        }

        // Add business type to user profile
        const userWithBusinessType = {
          ...baseUser,
          businessType: getBusinessTypeFromRole(baseUser.role)
        };

        // Save grocery IDs if user is grocery-related
        if (baseUser.role.startsWith('Grocery-')) {
          if (baseUser.groceryShopId) {
            localStorage.setItem('groceryShopId', baseUser.groceryShopId);
          }
          if (baseUser.groceryBranchId) {
            localStorage.setItem('groceryBranchId', baseUser.groceryBranchId);
          }
        }

        await localStorage.setItem('userProfile', JSON.stringify(userWithBusinessType));
        setUser(userWithBusinessType as BusinessUser);
        
        // Clear phone number from storage
        localStorage.removeItem('loginPhoneNumber');
        
        // Navigate to dashboard
        navigate('/dashboard', { replace: true });
        
        return true;
      }

      if (otpStatus === 'otpNotExist') {
        throw new Error('Incorrect OTP code');
      }
      
      throw new Error('Phone 2FA verification failed');
    } catch (err: any) {
      setError(err.message || 'Phone 2FA verification failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const response = await getAuthenticatedUser();
      
      // Add business type to user profile
      const userWithBusinessType = {
        ...response.data,
        businessType: getBusinessTypeFromRole(response.data.role)
      };

      await localStorage.setItem('userProfile', JSON.stringify(userWithBusinessType));
      setUser(userWithBusinessType as BusinessUser);
      
      return userWithBusinessType;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  };

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('2faVerified');
    localStorage.removeItem('loginPhoneNumber');
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  // Check if user is authenticated
  const isAuthenticated = useMemo(() => {
    const authToken = localStorage.getItem('authToken');
    const userProfile = localStorage.getItem('userProfile');
    const loginPhoneNumber = localStorage.getItem('loginPhoneNumber');
    const is2FAVerified = localStorage.getItem('2faVerified');

    console.log('🔐 useAuth: isAuthenticated calculation =', {
      authToken: !!authToken,
      userProfile: !!userProfile,
      loginPhoneNumber: !!loginPhoneNumber,
      is2FAVerified: is2FAVerified
    });

    // For fully authenticated users (after 2FA), we need both authToken and userProfile
    if (authToken && userProfile && is2FAVerified === 'true') {
      console.log('🔐 useAuth: Fully authenticated user');
      return true;
    }

    // For phone login in progress, we need authToken and loginPhoneNumber
    if (authToken && loginPhoneNumber) {
      console.log('🔐 useAuth: Phone login in progress');
      return false; // Not fully authenticated yet, but has valid login state
    }

    // For email login in progress, we need authToken
    if (authToken && !userProfile) {
      console.log('🔐 useAuth: Email login in progress');
      return false; // Not fully authenticated yet, but has valid login state
    }

    console.log('🔐 useAuth: Not authenticated');
    return false;
  }, [user]);

  // Get user's business type
  const getUserBusinessType = useMemo(() => {
    if (!user) return null;
    return user.businessType;
  }, [user]);

  // Get user's role
  const getUserRole = useMemo(() => {
    if (!user) return null;
    return user.role;
  }, [user]);

  return {
    user,
    isLoading,
    error,
    login,
    verify2FA,
    loginWithPhoneNumber,
    verifyPhone2FA,
    logout,
    isAuthenticated,
    fetchUserProfile,
    getUserBusinessType,
    getUserRole
  };
}; 