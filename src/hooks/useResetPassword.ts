import { useState } from "react";
import { resetPassword as resetPasswordApi } from '../services/api';

const useResetPassword = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetPassword = async (email: string) => {
    setLoading(true);
    setError(null);

    try {
      await resetPasswordApi(email);
      // Handle success (e.g., navigate to another page or show a success message)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { resetPassword, loading, error };
};

export default useResetPassword; 