import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { useUserProfile } from './useUserProfile';
import { SelectedItem } from '../types/order';

interface MenuItem {
  name: string;
  price: string | number;
  available: boolean;
  image?: string;
  foodImage?: {
    url: string;
    filename: string;
    type: string;
    size: number;
  };
  extras?: Array<{
    delika_extras_table_id: string;
    extrasDetails: {
      id: string;
      extrasTitle: string;
      extrasType: string;
      required: boolean;
      extrasDetails: Array<{
        delika_inventory_table_id: string;
        minSelection?: number;
        maxSelection?: number;
        inventoryDetails: Array<{
          id: string;
          foodName: string;
          foodPrice: number;
          foodDescription: string;
        }>;
      }>;
    };
  }>;
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
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [categories, setCategories] = useState<{ label: string; value: string; }[]>([]);
  const [fullMenuData, setFullMenuData] = useState<any[]>([]);

  // Determine which branchId to use
  const effectiveBranchId = isAdmin 
    ? selectedBranchId  // Use selected branch for Admin
    : userProfile?.branchId; // Use profile branch for non-Admin

  // Fetch all menu data once and cache it
  useEffect(() => {
    const fetchMenuData = async () => {
      if (!userProfile?.restaurantId || !effectiveBranchId) return;

      try {
        const response = await api.post('/get/all/menu', {
          restaurantId: userProfile.restaurantId,
          branchId: effectiveBranchId
        });
        
        // Cache the full menu data
        setFullMenuData(response.data);
        
        // Extract categories
        const formattedCategories = response.data.map((cat: Category) => ({
          label: cat.foodType || 'Unnamed Category',
          value: cat.id || cat._id || ''
        }));
        
        const uniqueCategories = Array.from(new Map(
          formattedCategories.map((item: { label: string; value: string }) => [item.label, item])
        ).values()) as { label: string; value: string }[];
        
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Error fetching menu data:', error);
      }
    };

    fetchMenuData();
  }, [userProfile?.restaurantId, effectiveBranchId]);

  // Fast local filtering using useMemo - no API calls needed!
  const categoryItems = useMemo(() => {
    if (!selectedCategory || !fullMenuData.length) return [];
    
    const category = categories.find(cat => cat.label === selectedCategory);
    if (!category) return [];
    
    const categoryData = fullMenuData.find((cat: any) => 
      (cat.id === category.value || cat._id === category.value)
    );
    
    return categoryData?.foods || [];
  }, [selectedCategory, categories, fullMenuData]);

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
    console.log('🍔 Adding item to order:', item);
    try {
      const imageFile = await convertUrlToFile(item.foodImage?.url || '');
      
      setSelectedItems(prev => {
        const existingItem = prev.find(i => i.name === item.name);
        if (existingItem) {
          console.log('📈 Updating quantity for existing item:', item.name, 'new quantity:', existingItem.quantity + 1);
          return prev.map(i => 
            i.name === item.name 
              ? { ...i, quantity: i.quantity + 1 }
              : i
          );
        }
        console.log('➕ Adding new item to cart:', item.name);
        return [...prev, { 
          name: item.name, 
          quantity: 1, 
          price: parseFloat(item.price as string),
          image: item.foodImage?.url || '',
          imageFile,
          extras: []
        }];
      });
    } catch (error) {
      console.error('❌ Error adding item:', error);
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