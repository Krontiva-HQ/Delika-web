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
      categoryId,
      foodTypePhoto: foodTypePhoto ? {
        name: foodTypePhoto.name,
        type: foodTypePhoto.type,
        size: foodTypePhoto.size
      } : 'NO FOOD TYPE PHOTO PROVIDED',
      foodsPhoto: foodsPhoto ? {
        name: foodsPhoto.name,
        type: foodsPhoto.type,
        size: foodsPhoto.size
      } : 'NO FOODS PHOTO PROVIDED'
    });
    
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('path', '/create/new/category');
      formData.append('foodType', foodType);
      formData.append('restaurantName', restaurantName);
      formData.append('branchName', branchName);
      formData.append('mainCategory', mainCategory);
      formData.append('categoryId', categoryId);
      
      // Process the first food item (assuming single food item like useAddItemToCategory)
      const firstFood = foods[0];
      if (firstFood) {
        // Create foods object (single object, not array)
        const foodsObject = {
          name: firstFood.name,
          price: firstFood.price,
          description: firstFood.description,
          quantity: firstFood.quantity,
          available: firstFood.available,
          extras: (firstFood.extras || []).map(extra => ({
            extrasTitle: extra.extrasTitle,
            inventoryId: extra.inventoryId
          }))
        };

        // Append foods as a JSON object (same as useAddItemToCategory)
        formData.append('foods', new Blob([JSON.stringify(foodsObject)], { type: 'application/json' }));
        
        // Append extras as indexed fields (same as useAddItemToCategory)
        if (firstFood.extras && firstFood.extras.length > 0) {
          firstFood.extras.forEach((extra, idx) => {
            formData.append(`extras[${idx}][extrasTitle]`, extra.extrasTitle);
            formData.append(`extras[${idx}][inventoryId]`, extra.inventoryId);
          });
        }
      }

      if (foodTypePhoto) {
        console.log('📸 Adding foodTypePhoto:', {
          name: foodTypePhoto.name,
          type: foodTypePhoto.type,
          size: foodTypePhoto.size
        });
        formData.append('foodTypePhoto', foodTypePhoto);
        console.log('✅ foodTypePhoto successfully added to FormData');
      } else {
        console.warn('⚠️ No foodTypePhoto provided or foodTypePhoto is null/undefined');
      }
      if (foodsPhoto) {
        console.log('📸 Adding foodsPhoto:', {
          name: foodsPhoto.name,
          type: foodsPhoto.type,
          size: foodsPhoto.size
        });
        formData.append('foodsPhoto', foodsPhoto);
        console.log('✅ foodsPhoto successfully added to FormData');
      } else {
        console.warn('⚠️ No foodsPhoto provided or foodsPhoto is null/undefined');
      }

      // Log the full FormData payload before posting
      console.log('🚀 Posting to /add/category with FormData:');
      Array.from(formData.entries()).forEach(pair => {
        if (pair[1] instanceof Blob && pair[0] === 'foods') {
          (pair[1] as Blob).text().then(text => {
            console.log(pair[0] + ':', text);
          });
        } else if (pair[1] instanceof File) {
          console.log(pair[0] + ':', {
            name: pair[1].name,
            type: pair[1].type,
            size: pair[1].size
          });
        } else {
          console.log(pair[0] + ':', pair[1]);
        }
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