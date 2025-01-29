import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useUserProfile } from './useUserProfile';

interface MenuItem {
  name: string;
  price: string;
  quantity: number;
  foodImage: {
    url: string;
  };
}

interface SelectedItem {
  name: string;
  quantity: number;
  price: number;
  image: string;
  imageFile?: File;
}

interface Category {
  foodType: string;
  id: string;
  _id?: string;
}

interface PlaceOrderItemsHook {
  categories: { label: string; value: string; }[];
  categoryItems: MenuItem[];
  selectedItems: SelectedItem[];
  setSelectedItems: React.Dispatch<React.SetStateAction<SelectedItem[]>>;
  selectedCategory: string;
  setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
  addItem: (item: MenuItem) => void;
  updateQuantity: (itemName: string, newQuantity: number) => void;
  removeItem: (itemName: string) => void;
}

export const usePlaceOrderItems = (selectedBranchId?: string): PlaceOrderItemsHook => {
  const { userProfile, isAdmin } = useUserProfile();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categoryItems, setCategoryItems] = useState<MenuItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [categories, setCategories] = useState<{ label: string; value: string; }[]>([]);

  // Determine which branchId to use
  const effectiveBranchId = isAdmin 
    ? selectedBranchId  // Use selected branch for Admin
    : userProfile?.branchId; // Use profile branch for non-Admin

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      if (!userProfile?.restaurantId || !effectiveBranchId) return;

      try {
        const response = await api.post('/get/all/menu', {
          restaurantId: userProfile.restaurantId,
          branchId: effectiveBranchId
        });
        
        
        const formattedCategories = response.data.map((cat: Category) => ({
          label: cat.foodType || 'Unnamed Category',
          value: cat.id || cat._id || ''
        }));
        
        const uniqueCategories = Array.from(new Map(
          formattedCategories.map((item: { label: string; value: string }) => [item.label, item])
        ).values()) as { label: string; value: string }[];
        
        setCategories(uniqueCategories);
      } catch (error) {
      }
    };

    fetchCategories();
  }, [userProfile?.restaurantId, effectiveBranchId]); // Re-fetch when branch changes

  // Fetch items for selected category
  const fetchCategoryItems = useCallback(async (categoryId: string) => {
    if (!userProfile?.restaurantId || !effectiveBranchId) return;

    try {
      const response = await api.post('/get/all/menu', {
        restaurantId: userProfile.restaurantId,
        branchId: effectiveBranchId
      });

      // Find the category and get its foods array
      const category = response.data.find((cat: any) => cat.id === categoryId || cat._id === categoryId);
      if (category && category.foods) {
        setCategoryItems(category.foods);
      }
    } catch (error) {
    }
  }, [userProfile?.restaurantId, effectiveBranchId]);

  useEffect(() => {
    if (selectedCategory) {
      const category = categories.find(cat => cat.label === selectedCategory);
      if (category) {
        fetchCategoryItems(category.value);
      }
    }
  }, [selectedCategory, categories, fetchCategoryItems]);

  const convertUrlToFile = async (url: string): Promise<File> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const filename = url.split('/').pop() || 'image.jpg';
      return new File([blob], filename, { type: blob.type });
    } catch (error) {
      throw error;
    }
  };

  const addItem = async (item: MenuItem) => {
    try {
      const imageFile = await convertUrlToFile(item.foodImage.url);
      
      setSelectedItems(prev => {
        const existingItem = prev.find(i => i.name === item.name);
        if (existingItem) {
          return prev.map(i => 
            i.name === item.name 
              ? { ...i, quantity: i.quantity + 1 }
              : i
          );
        }
        return [...prev, { 
          name: item.name, 
          quantity: 1, 
          price: parseFloat(item.price),
          image: item.foodImage.url,
          imageFile
        }];
      });
    } catch (error) {
    }
  };

  const updateQuantity = (itemName: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setSelectedItems(prev => 
      prev.map(item => 
        item.name === itemName 
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeItem = (itemName: string) => {
    setSelectedItems(prev => prev.filter(item => item.name !== itemName));
  };

  return {
    categories,
    categoryItems,
    selectedItems,
    setSelectedItems,
    selectedCategory,
    setSelectedCategory,
    addItem,
    updateQuantity,
    removeItem
  };
};