import { useState } from 'react';

interface UpdateInventoryParams {
  menuId: string | null;
  newPrice: string;
  name: string;
  description: string;
  newQuantity: number;
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/update/inventory/price/quantity`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestParams)
      });

      if (!response.ok) {
        throw new Error('Failed to update inventory');
      }

      const data = await response.json();
      onSuccess?.();
      return data;
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