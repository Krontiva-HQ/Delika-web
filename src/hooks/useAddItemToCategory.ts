import { useState } from 'react';
import { addItemToCategory } from '../services/api';

interface AddItemParams {
  categoryId: string;
  name: string;
  price: string;
  description: string;
  available: boolean;
  foodPhoto: File | null;
  onSuccess?: () => void;
}

interface AddItemResponse {
  data: any;
  status: number;
}

export const useAddItemToCategory = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addItem = async ({
    categoryId,
    name,
    price,
    description,
    available,
    foodPhoto,
    onSuccess
  }: AddItemParams): Promise<AddItemResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      
      const formData = new FormData();
      formData.append('categoryId', categoryId);
      formData.append('foods', JSON.stringify({ 
        name, 
        price, 
        description, 
        available 
      }));
      formData.append('restaurantName', userProfile.restaurantId || '');
      formData.append('branchName', userProfile.branchId || '');
      
      if (foodPhoto) {
        formData.append('foodPhoto', foodPhoto);
      } else {
        throw new Error('Missing file resource.');
      }

      const response = await addItemToCategory(formData);
      onSuccess?.();
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { addItem, isLoading, error };
}; 