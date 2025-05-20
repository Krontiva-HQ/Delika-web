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
    console.log('🔥 useAddItemToCategory hook called - DIRECT API APPROACH 🔥', {
      categoryId,
      name,
      price,
      description,
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
      formData.append('categoryId', categoryId);
      formData.append('foods', JSON.stringify({ 
        name, 
        price, 
        description, 
        available 
      }));
      formData.append('restaurantName', userProfile.restaurantId || '');
      formData.append('branchName', userProfile.branchId || '');
      
      if (!foodPhoto) {
        throw new Error('Missing file resource.');
      }

      // Append the file directly to FormData
      formData.append('foodPhoto', foodPhoto);

      // Log the FormData contents for debugging
      console.log('📦 FormData contents:', {
        categoryId: formData.get('categoryId'),
        foods: formData.get('foods'),
        restaurantName: formData.get('restaurantName'),
        branchName: formData.get('branchName'),
        hasFoodPhoto: formData.has('foodPhoto'),
        foodPhotoType: formData.get('foodPhoto') instanceof File ? 'File' : 'Not a File'
      });

      console.log('🔥 Calling API directly - AddItemToCategory 🔥');
      const response = await addItemToCategory(formData);
      console.log('✅ API Response:', { status: response.status });
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