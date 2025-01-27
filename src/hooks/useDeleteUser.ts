import { useState } from 'react';

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
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/delikaquickshipper_user_table/${userId}`,
        {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            delikaquickshipper_user_table_id: userId
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

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