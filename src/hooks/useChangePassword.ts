import { useState } from 'react';

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
      const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/change/password`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

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