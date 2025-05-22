import { useState } from 'react';
import { createCategory } from '../services/api';

interface AddCategoryParams {
  foodType: string;
  restaurantName: string;
  branchName: string;
  foodTypePhoto?: File | null;
  foodsPhoto?: File | null;
  foods: {
    name: string;
    price: string;
    description: string;
    quantity: string;
    available: boolean;
  };
  onSuccess?: () => void;
}

export const useAddCategory = () => {
  const [isLoading, setIsLoading] = useState(false);

  const addCategory = async ({
    foodType,
    restaurantName,
    branchName,
    foodTypePhoto,
    foodsPhoto,
    foods,
    onSuccess
  }: AddCategoryParams) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('foodType', foodType);
      formData.append('restaurantName', restaurantName);
      formData.append('branchName', branchName);
      
      // Append foods as JSON string
      formData.append('foods', JSON.stringify(foods));

      if (foodTypePhoto) {
        formData.append('foodTypePhoto', foodTypePhoto);
      }
      if (foodsPhoto) {
        formData.append('foodsPhoto', foodsPhoto);
      }

      const response = await createCategory(formData);

      if (response.status !== 200) {
        throw new Error('Failed to add category');
      }

      const data = response.data;
      onSuccess?.();
      return data;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { addCategory, isLoading };
}; 