import { useState } from 'react';
import { changePassword as changePasswordApi } from '../services/api';

interface ChangePasswordResponse {
  success: boolean;
  message?: string;
  error?: string;
}

const useChangePassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changePassword = async (email: string, password: string): Promise<ChangePasswordResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      await changePasswordApi(email, password);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reset password'
      };
    } finally {
      setIsLoading(false);
    }
  };

  return { changePassword, isLoading, error };
};

export default useChangePassword; 