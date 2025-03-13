import { useState } from 'react';
import { verifyOTP, resetPassword } from '../services/api';

export const useTwoFAEmail = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendTwoFAEmail = async (email: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await resetPassword(email);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to send verification email');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyTwoFACode = async (otp: string, email: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await verifyOTP({
        OTP: parseInt(otp),
        type: true,
        contact: email
      });
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to verify code');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendTwoFAEmail,
    verifyTwoFACode,
    isLoading,
    error
  };
}; 