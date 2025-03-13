import { useState } from 'react';
import { editOrder as editOrderApi, type EditOrderParams } from '../services/api';

export const useEditOrder = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editOrder = async (params: EditOrderParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await editOrderApi(params);
      return response.data;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { editOrder, isLoading, error };
}; 