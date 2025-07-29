import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { useAuth } from './useAuth';
import axios from 'axios';

// Add interfaces for extras
interface InventoryDetail {
  id: string;
  foodName: string;
  foodPrice: number;
  foodDescription: string;
}

interface ExtraDetail {
  delika_inventory_table_id: string;
  minSelection?: number;
  maxSelection?: number;
  inventoryDetails: InventoryDetail[];
}

interface ExtraGroup {
  delika_extras_table_id: string;
  extrasDetails: {
    id: string;
    extrasTitle: string;
    extrasType: string;
    required: boolean;
    extrasDetails: ExtraDetail[];
  };
}

export interface CategoryCard {
  id: string;
  image: string;
  name: string;
  itemCount: number;
  isActive?: boolean;
  categoryTable: CategoryTableItem[];
  foods: {
    name: string;
    price: string;
    foodImage: {
      url: string;
    };
    description?: string;
    available: boolean;
    extras?: ExtraGroup[];
  }[];
}

interface FoodImage {
  access: string;
  path: string;
  name: string;
  type: string;
  size: number;
  url: string;
  meta?: {
    width: number;
    height: number;
  };
  mime?: string;
}

interface FoodItem {
  name: string;
  price: string;
  description: string;
  quantity: number;
  available: boolean;
  extras: ExtraGroup[];
  foodImage: FoodImage;
}

interface CategoryTableItem {
  categoryImage: string | null;
  categoryName: string;
  created_at: number;
  id: string;
}

interface APICategory {
  id: string;
  created_at: number;
  foodType: string;
  restaurantName: string;
  branchName: string;
  categoryId: string | null;
  categoryTable: CategoryTableItem[];
  foodTypeImage: FoodImage;
  foods: FoodItem[];
}

export interface CategoryDetails {
  id: string;
  name: string;
  image: string;
  foods: {
    name: string;
    price: string;
    foodImage: {
      url: string;
    };
    description?: string;
    available: boolean;
  }[];
}

interface CategoryFood {
  name: string;
  price: string;
  foodImage: {
    url: string;
  };
  description?: string;
  available: boolean;
}

export const useMenuCategories = () => {
  const [categories, setCategories] = useState<CategoryCard[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Get the selected branch from localStorage
  const selectedBranchId = localStorage.getItem('selectedBranchId');

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      
        
        const response = await api.post<APICategory[]>('/get/all/menu', {
          restaurantId: userProfile.restaurantId || '',
          branchId: userProfile?.role === 'Admin' ? selectedBranchId : userProfile?.branchId || '',
        });
        
        
        const transformedCategories = response.data
          .map(category => ({
            id: category.id,
            image: category.foodTypeImage?.url || '',
            name: category.foodType,
            itemCount: category.foods?.length || 0,
            categoryTable: category.categoryTable || [],
            foods: (category.foods || []).map(food => ({
              name: food.name,
              price: food.price,
              foodImage: {
                url: food.foodImage?.url || '',
              },
              description: food.description,
              available: food.available ?? false,
              quantity: food.quantity || 0,
              extras: food.extras || []
            }))
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        
        
        setCategories(transformedCategories);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch categories');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [selectedBranchId]);

  useEffect(() => {
    // Prefetch the data
    const prefetchData = async () => {
      try {
        // Cache the response
        localStorage.setItem('menuCategoriesTimestamp', Date.now().toString());
      } catch (error) {
        // Handle error silently
      }
    };

    // Check if we have cached data
    const cachedData = localStorage.getItem('menuCategories');
    const timestamp = localStorage.getItem('menuCategoriesTimestamp');
    const isStale = timestamp && (Date.now() - parseInt(timestamp)) > 300000; // 5 minutes

    if (!cachedData || isStale) {
      prefetchData();
    }
  }, []);

  const handleCategorySelect = (categoryId: string) => {
    setActiveId(categoryId);
    const selected = categories.find(category => category.id === categoryId);
    if (selected) {
      setSelectedCategory({
        id: selected.id,
        name: selected.name,
        image: selected.image,
        foods: selected.foods
      });
    }
  };

  const categoriesWithActive = useMemo(() => 
    categories.map(category => ({
      ...category,
      isActive: category.id === activeId
    }))
  , [categories, activeId]);

  return { 
    categories: categoriesWithActive, 
    selectedCategory,
    handleCategorySelect,
    isLoading, 
    error 
  };
}; 