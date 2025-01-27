import { useState } from 'react';

interface UpdateTeamMemberParams {
  userId: string;
  email: string;
  role: string;
  userName: string;
  restaurantId: string;
  branchId: string;
  fullName: string;
  phoneNumber: string;
  country: string;
  address: string;
  city: string;
  postalCode: string;
  photo?: File;
}

export const useUpdateTeamMember = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateTeamMember = async (data: FormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/delikaquickshipper_user_table/${data.get('userId')}`, {
        method: 'PATCH',
        body: data,
      });

      if (!response.ok) {
        throw new Error('Failed to update team member');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { updateTeamMember, isLoading, error };
}; 