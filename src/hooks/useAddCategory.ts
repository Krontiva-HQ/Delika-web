import { useState } from 'react';
import { createCategory } from '../services/api';

interface AddCategoryParams {
  foodType: string;
  restaurantName: string;
  branchName: string;
  foodTypePhoto?: File | null;
  foodsPhoto?: File | null;
  mainCategory: string;
  categoryId: string;
  foods: Array<{
    name: string;
    price: string;
    description: string;
    quantity: string;
    available: boolean;
  }>;
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
    mainCategory,
    categoryId,
    foods,
    onSuccess
  }: AddCategoryParams) => {
    console.log('🔥 useAddCategory hook called - DIRECT API APPROACH 🔥', {
      foodType,
      restaurantName,
      branchName,
      hasFoodTypePhoto: !!foodTypePhoto,
      hasFoodsPhoto: !!foodsPhoto,
      foodsCount: foods.length,
      categoryId
    });
    
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('foodType', foodType);
      formData.append('restaurantName', restaurantName);
      formData.append('branchName', branchName);
      formData.append('mainCategory', mainCategory);
      formData.append('categoryId', categoryId);
      
      foods.forEach((food, index) => {
        formData.append(`foods[${index}][name]`, food.name);
        formData.append(`foods[${index}][price]`, food.price);
        formData.append(`foods[${index}][description]`, food.description);
        formData.append(`foods[${index}][quantity]`, food.quantity);
        formData.append(`foods[${index}][available]`, String(food.available));
      });

      if (foodTypePhoto) {
        formData.append('foodTypePhoto', foodTypePhoto);
      }
      if (foodsPhoto) {
        formData.append('foodsPhoto', foodsPhoto);
      }

      console.log('🔥 Calling API directly - CreateCategory 🔥');
      const response = await createCategory(formData);
      console.log('✅ API Response:', { status: response.status });

      if (response.status !== 200) {
        throw new Error('Failed to add category');
      }

      const data = response.data;
      onSuccess?.();
      return data;
    } catch (error) {
      console.error('❌ API Error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { addCategory, isLoading };
}; 