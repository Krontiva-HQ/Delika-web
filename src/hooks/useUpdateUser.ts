import { useState } from 'react';
import { api } from '../services/api';

interface UpdateUserData {
  userId: string;
  email: string;
  role: string;
  image: string | null;
  userName: string;
  fullName: string;
  phoneNumber: string;
  country: string;
  address: string;
  city: string;
  postalCode: string;
  dateOfBirth: string | null;
}

export const useUpdateUser = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateUser = async (data: UpdateUserData | FormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.patch(
        `/delikaquickshipper_user_table/${data instanceof FormData ? data.get('userId') : data.userId}`, 
        data,
        {
          headers: data instanceof FormData ? {
            'Content-Type': 'multipart/form-data'
          } : undefined
        }
      );
      return response.data;
    } catch (err) {
      setError('Failed to update user details');
    } finally {
      setIsLoading(false);
    }
  };

  return { updateUser, isLoading, error };
};

export default useUpdateUser; 