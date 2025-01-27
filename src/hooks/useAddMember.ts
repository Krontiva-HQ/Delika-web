import { useState } from 'react';
import axios from 'axios';

interface AddMemberParams {
  restaurantId: string | null;
  branchId: string | null;
  email: string;
  role: string;
  fullName: string;
  phoneNumber: string;
  Status: boolean;
}

export const useAddMember = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMember = async (params: AddMemberParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/add/member/to/restaurant`,
        params
      );

      if (response.status === 200 || response.status === 201) {
        return response.data;
      }
    } catch (err) {
      const errorMessage = axios.isAxiosError(err) 
        ? err.response?.data?.message || 'Failed to add member'
        : 'An error occurred';
      setError(errorMessage);
      console.error('Error adding member:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return { addMember, isLoading, error };
}; 