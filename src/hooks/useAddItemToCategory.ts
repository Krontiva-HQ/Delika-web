import { useState } from 'react';
import { addItemToCategory } from '../services/api';

interface AddItemParams {
  categoryId: string;
  name: string;
  price: string;
  description: string;
  available: boolean;
  foodPhoto: File | null;
  mainCategoryId: string;
  mainCategory: string;
  extras?: Array<{
    extrasTitle: string;
    inventoryId: string;
  }>;
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
    mainCategoryId,
    mainCategory,
    extras,
    onSuccess
  }: AddItemParams): Promise<AddItemResponse> => {
    // Prevent multiple submissions
    if (isLoading) {
      return Promise.reject(new Error('A submission is already in progress'));
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      
      const formData = new FormData();
      formData.append('categoryId', categoryId);
      formData.append('mainCategoryId', mainCategoryId);
      
      // Create foods object
      const foods = {
        name,
        price,
        description,
        quantity: "1",
        available,
        extras: (extras || []).map(extra => ({
          extrasTitle: extra.extrasTitle,
          inventoryId: extra.inventoryId
        }))
      };

      // Append foods as a JSON object
      formData.append('foods', new Blob([JSON.stringify(foods)], { type: 'application/json' }));
      
      // Append extras as indexed fields
      if (extras && extras.length > 0) {
        extras.forEach((extra, idx) => {
          formData.append(`extras[${idx}][extrasTitle]`, extra.extrasTitle);
          formData.append(`extras[${idx}][inventoryId]`, extra.inventoryId);
        });
      }

      formData.append('restaurantName', userProfile.restaurantId || '');
      formData.append('branchName', userProfile.branchId || '');
      
      if (foodPhoto) {
        formData.append('foodPhoto', foodPhoto);
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