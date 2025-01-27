import { useState } from 'react';

interface AddItemParams {
  categoryId: string;
  name: string;
  price: string;
  description: string;
  quantity: string;
  foodPhoto: File | null;
  onSuccess?: () => void;
}

export const useAddItemToCategory = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addItemToCategory = async ({
    categoryId,
    name,
    price,
    description,
    quantity,
    foodPhoto
  }: AddItemParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      
      const formData = new FormData();
      
      // Add categoryId
      formData.append('categoryId', categoryId);
      
      // Add foods object as JSON string
      const foods = {
        name,
        price,
        description,
        quantity
      };
      formData.append('foods', JSON.stringify(foods));
      
      // Add foodPhoto if exists
      if (foodPhoto) {
        formData.append('foodPhoto', foodPhoto);
      } else {
        throw new Error('Missing file resource.');
      }
      
      // Add restaurant and branch IDs from userProfile
      formData.append('restaurantName', userProfile.restaurantId || '');
      formData.append('branchName', userProfile.branchId || '');

      const response = await fetch(`${import.meta.env.VITE_API_URL}/add/item/to/category`, {
        method: 'PATCH',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to add item to category');
      }

      return await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { addItemToCategory, isLoading, error };
}; 