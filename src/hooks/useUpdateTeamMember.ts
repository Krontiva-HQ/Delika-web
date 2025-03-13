import { useState } from 'react';
import { updateTeamMember as updateTeamMemberApi } from '../services/api';

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
      const response = await updateTeamMemberApi(data);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { updateTeamMember, isLoading, error };
}; 