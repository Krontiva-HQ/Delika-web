import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { useUserProfile } from './useUserProfile';
import { useMenuCategories } from './useMenuCategories';
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
  isLoading: boolean;
}

export const usePlaceOrderItems = (selectedBranchId?: string): PlaceOrderItemsHook => {
  const { userProfile, isAdmin } = useUserProfile();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [categoryItems, setCategoryItems] = useState<MenuItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  // Use the same hook as Inventory component
  const { categories: remoteCategories, isLoading: categoriesLoading } = useMenuCategories();

  // Determine which branchId to use
  const effectiveBranchId = isAdmin
    ? selectedBranchId
    : userProfile?.branchId;

  // Extract categories from remoteCategories (same as Inventory)
  const categories = useMemo(() => {
    return remoteCategories.map((category) => ({
      label: category.name,
      value: category.id
    }));
  }, [remoteCategories]);

  // Update items when category changes (same logic as Inventory)
  useEffect(() => {
    const loadCategoryItems = async () => {
      if (!selectedCategory) {
        setCategoryItems([]);
        return;
      }

      setIsLoadingItems(true);
      try {
        const activeCategory = remoteCategories.find(category => category.id === selectedCategory);
        if (!activeCategory?.foods) {
          setCategoryItems([]);
          return;
        }

        // Add a small delay to make the loading state visible
        await new Promise(resolve => setTimeout(resolve, 300));

        // Map only the foods from the active category (same as Inventory)
        const items = activeCategory.foods.map((food: any) => ({
          name: food.name,
          price: food.price,
          available: food.available ?? false,
          foodImage: {
            url: food.foodImage?.url || '',
            filename: food.name,
            type: 'image',
            size: 0
          },
          extras: food.extras || []
        }));

        setCategoryItems(items);
      } finally {
        setIsLoadingItems(false);
      }
    };

    loadCategoryItems();
  }, [selectedCategory, remoteCategories]);

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
    removeItem,
    isLoading: categoriesLoading || isLoadingItems
  };
};