import { useState } from 'react';
import { addMember, AddMemberParams } from '../services/api';

export const useAddMember = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addTeamMember = async (params: AddMemberParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await addMember(params);
      if (response.status === 200 || response.status === 201) {
        return response.data;
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to add member';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { addMember: addTeamMember, isLoading, error };
}; 