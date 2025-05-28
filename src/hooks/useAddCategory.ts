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
    extras?: Array<{
      extrasTitle: string;
      inventoryId: string;
    }>;
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
        
        // Add extras if they exist
        if (food.extras && food.extras.length > 0) {
          formData.append(`foods[${index}][extras]`, JSON.stringify(food.extras));
        }
      });

      if (foodTypePhoto) {
        console.log('📸 Adding foodTypePhoto:', {
          name: foodTypePhoto.name,
          type: foodTypePhoto.type,
          size: foodTypePhoto.size
        });
        formData.append('foodTypePhoto', foodTypePhoto);
      }
      if (foodsPhoto) {
        console.log('📸 Adding foodsPhoto:', {
          name: foodsPhoto.name,
          type: foodsPhoto.type,
          size: foodsPhoto.size
        });
        formData.append('foodsPhoto', foodsPhoto);
      }

      // Log the full FormData payload before posting
      console.log('🚀 Posting to /add/category with FormData:');
      Array.from(formData.entries()).forEach(pair => {
        console.log(pair[0] + ':', pair[1]);
      });

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