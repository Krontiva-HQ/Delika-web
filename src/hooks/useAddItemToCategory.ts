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
    console.log('🔥 useAddItemToCategory hook called - DIRECT API APPROACH 🔥', {
      categoryId,
      name,
      price,
      description,
      mainCategoryId,
      extras,
      foodPhoto: foodPhoto ? {
        name: foodPhoto.name,
        type: foodPhoto.type,
        size: foodPhoto.size
      } : null
    });
    
    setIsLoading(true);
    setError(null);

    try {
      const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      
      const formData = new FormData();
      formData.append('path', '/add/item/to/category');
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
        console.log('📸 Adding foodPhoto to FormData:', {
          name: foodPhoto.name,
          type: foodPhoto.type,
          size: foodPhoto.size
        });
        formData.append('foodPhoto', foodPhoto);
      } else {
        console.warn('⚠️ No foodPhoto provided');
      }

      // Log the full FormData payload before posting
      console.log('🚀 Posting to /add/item/to/category with FormData:');
      Array.from(formData.entries()).forEach(pair => {
        if (pair[1] instanceof Blob && pair[0] === 'foods') {
          (pair[1] as Blob).text().then(text => {
            console.log(pair[0] + ':', text);
          });
        } else {
          console.log(pair[0] + ':', pair[1]);
        }
      });

      console.log('🔥 Calling API directly - AddItemToCategory 🔥');
      const response = await addItemToCategory(formData);
      console.log('✅ API Response:', { status: response.status, data: response.data });
      onSuccess?.();
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      console.error('❌ API Error:', err);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { addItem, isLoading, error };
}; 