import { useState } from 'react';
import { deleteUser as deleteUserApi } from '../services/api';

interface UseDeleteUserReturn {
  deleteUser: (userId: string) => Promise<boolean>;
  isLoading: boolean;
  error: Error | null;
}

export const useDeleteUser = (): UseDeleteUserReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteUser = async (userId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      await deleteUserApi(userId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete user'));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { deleteUser, isLoading, error };
}; 