import { useState } from 'react';
import { updateInventory as updateInventoryApi } from '../services/api';

interface UpdateInventoryParams {
  menuId: string | null;
  newPrice: string;
  name: string;
  description: string;
  available: boolean;
  onSuccess?: () => void;
}

export const useUpdateInventory = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateInventory = async (params: UpdateInventoryParams) => {
    const { onSuccess, ...requestParams } = params;
    setIsLoading(true);
    setError(null);

    try {
      const response = await updateInventoryApi(requestParams);
      onSuccess?.();
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { updateInventory, isLoading, error };
}; 