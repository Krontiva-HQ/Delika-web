import React, { FunctionComponent, useState, useCallback, useRef, TouchEvent, MouseEvent, useEffect, useMemo, ReactElement } from "react";
import { Button, Menu, MenuItem, Modal, IconButton } from "@mui/material";
import { IoMdNotificationsOutline, IoMdAdd, IoMdRemove } from "react-icons/io";
import { FaRegMoon, FaChevronDown, FaArrowAltCircleLeft, FaArrowAltCircleRight, FaTrash } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import AddInventory from './AddInventory';
import { useMenuCategories } from '../../hooks/useMenuCategories';
import { useAuth } from '../../hooks/useAuth';
import { useUpdateInventory } from '../../hooks/useUpdateInventory';
import { useNotifications } from '../../context/NotificationContext';
import { FiShoppingCart } from "react-icons/fi";
import { useBranches } from '../../hooks/useBranches';
import { useUserProfile } from '../../hooks/useUserProfile';
import BranchFilter from '../../components/BranchFilter';
import { api } from '../../services/api';
import { optimizeImage } from '../../utils/imageOptimizer';
import { OptimizedImage } from '../../components/OptimizedImage';
import { useTranslation } from 'react-i18next';
import { useLanguageChange } from '../../hooks/useLanguageChange';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Checkbox } from '../../components/ui/checkbox';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Switch } from '../../components/ui/switch';
import { Button as UIButton } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import EditInventoryModal from '../../components/EditInventoryModal';
import AddExtrasModal from '../../components/AddExtrasModal';
import { updateInventoryItem, updateInventoryItemWithImage, deleteMenuItem, deleteCategory } from '../../services/api';

interface MenuItem {
  name: string;
  price: number;
  description: string;
  quantity: number;
  available: boolean;
  foodImage: {
    access: string;
    path: string;
    name: string;
    type: string;
    size: number;
    mime: string;
    meta: {
      width: number;
      height: number;
    };
    url: string;
  };
  extras?: ExtraGroup[];
}



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

// Add interface for category food items
interface CategoryFood {
  name: string;
  price: string;
  foodImage: {
    url: string;
  };
  description?: string;
  quantity?: number;
  available?: boolean;
  extras?: ExtraGroup[];
}

interface Category {
  id: string;
  name: string;
  image: string;
  itemCount: number;
  foods: CategoryFood[];
}

// Update the existing CategoryCard interface
interface CategoryCard {
  id: string;
  image: string;
  name: string;
  itemCount: number;
  isActive: boolean;
  foods: CategoryFood[];
}

const optimizeImageUrl = (url: string) => {
  return optimizeImage(url, {
    quality: 80,
    format: 'auto'
  });
};

// Add InventoryProps interface
interface InventoryProps {
  searchQuery?: string;
}

// Add new interface for the action selection dialog
interface ActionSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectAction: (action: 'menu-item' | 'extras') => void;
}

const ActionSelectionDialog: FunctionComponent<ActionSelectionDialogProps> = ({
  open,
  onClose,
  onSelectAction
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
          <DialogDescription>
            Choose what you want to add to your inventory.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <button
            className="flex flex-col items-center justify-center p-6 bg-white dark:bg-[#2c2522] border border-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-[#201a18] transition-colors"
            onClick={() => onSelectAction('menu-item')}
          >
            <div className="w-12 h-12 bg-[#fd683e]/10 rounded-full flex items-center justify-center mb-3">
              <IoMdAdd className="w-6 h-6 text-[#fd683e]" />
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">Add Menu Item</span>
            <span className="text-xs text-gray-500 mt-1">Create a new food item</span>
          </button>
          <button
            className="flex flex-col items-center justify-center p-6 bg-white dark:bg-[#2c2522] border border-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-[#201a18] transition-colors"
            onClick={() => onSelectAction('extras')}
          >
            <div className="w-12 h-12 bg-[#fd683e]/10 rounded-full flex items-center justify-center mb-3">
              <FiShoppingCart className="w-6 h-6 text-[#fd683e]" />
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">Add Extras</span>
            <span className="text-xs text-gray-500 mt-1">Create extras/add-ons</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};





const Inventory: FunctionComponent<InventoryProps> = ({ searchQuery = '' }): ReactElement => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const { t } = useTranslation();
  // Use the language change hook to ensure component updates on language change
  useLanguageChange();

  const [vuesaxlineararrowDownAnchorEl, setVuesaxlineararrowDownAnchorEl] =
    useState<HTMLElement | null>(null);
  const vuesaxlineararrowDownOpen = Boolean(vuesaxlineararrowDownAnchorEl);
  const handleVuesaxlineararrowDownClick = (
    event: React.MouseEvent<HTMLElement>
  ) => {
    setVuesaxlineararrowDownAnchorEl(event.currentTarget);
  };
  const handleVuesaxlineararrowDownClose = () => {
    setVuesaxlineararrowDownAnchorEl(null);
  };

  const onMyOrdersContainerClick = useCallback(() => {
    // Please sync "Orders" to the project
  }, []);

  const onMenuItemsContainerClick = useCallback(() => {
    const anchor = document.querySelector("[data-scroll-to='itemsText']");
    if (anchor) {
      anchor.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }, []);

  const onTransactionsContainerClick = useCallback(() => {
    // Please sync "Transactions - Active" to the project
  }, []);

  const onReportsContainerClick = useCallback(() => {
    // Please sync "Report" to the project
  }, []);

  const [showAddInventory, setShowAddInventory] = useState(false);
  const [addInventoryCategory, setAddInventoryCategory] = useState<{
    mainCategory: string;
    mainCategoryId: string;
    subCategory: string;
  } | null>(null);

  // Get user data from useAuth
  const { user } = useAuth();
  
  const { userProfile } = useUserProfile();
  
  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => {
    return localStorage.getItem('selectedBranchId') || '';
  });

  // Add useBranches hook before trying to use branches
  const { branches, isLoading: branchesLoading } = useBranches(userProfile?.restaurantId ?? null);
  
  // Set initial branch if none selected
  useEffect(() => {
    if (userProfile?.role === 'Admin' && branches.length > 0 && !selectedBranchId) {
      const firstBranchId = branches[0].id;
      if (firstBranchId) {
        localStorage.setItem('selectedBranchId', firstBranchId);
        setSelectedBranchId(firstBranchId);
      }
    }
  }, [userProfile?.role, branches, selectedBranchId]);

  // Use menuCategories hook for initial data
  const { categories: remoteCategories, isLoading: categoriesLoading, error: categoriesError } = useMenuCategories();



  const [activeId, setActiveId] = useState<string | null>(null);

  const [showActionDialog, setShowActionDialog] = useState(false);
  const [showAddExtrasModal, setShowAddExtrasModal] = useState(false);

  const handleActionSelect = (action: 'menu-item' | 'extras') => {
    setShowActionDialog(false);
    if (action === 'menu-item') {
      setAddInventoryCategory(null);
      setShowAddInventory(true);
    } else if (action === 'extras') {
      // Open AddExtrasModal in create mode
      setShowAddExtrasModal(true);
    }
  };

  const onAddItemButtonClick = useCallback((category?: CategoryCard) => {
    if (category) {
      // If adding from within a category, use the category's ID directly
      setAddInventoryCategory({
        mainCategory: category.name,
        mainCategoryId: category.id, // Use the category's ID directly
        subCategory: category.name
      });
      setShowAddInventory(true);
    } else {
      // If adding from the top button, show action selection dialog
      setShowActionDialog(true);
    }
  }, [remoteCategories]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    if (scrollContainerRef.current) {
      setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
      setScrollLeft(scrollContainerRef.current.scrollLeft);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    if (scrollContainerRef.current) {
      const x = e.pageX - scrollContainerRef.current.offsetLeft;
      const walk = (x - startX) * 2; // Scroll speed multiplier
      scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (scrollContainerRef.current) {
      setStartX(e.touches[0].pageX - scrollContainerRef.current.offsetLeft);
      setScrollLeft(scrollContainerRef.current.scrollLeft);
    }
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (scrollContainerRef.current) {
      const x = e.touches[0].pageX - scrollContainerRef.current.offsetLeft;
      const walk = (x - startX) * 2;
      scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const [selectedCardIndex, setSelectedCardIndex] = useState(0);

  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [categoryItems, setCategoryItems] = useState<MenuItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const { updateInventory, isLoading: isUpdating, error: updateError } = useUpdateInventory();
  const [isEditMode, setIsEditMode] = useState(false);
  const [showSelectExtrasModal, setShowSelectExtrasModal] = useState(false);
  const [selectedItemExtras, setSelectedItemExtras] = useState<ExtraGroup[]>([]);

  const handleSelectExtrasGroups = (selectedGroups: any[]) => {
    // Convert the selected groups to the format expected by the item
    const formattedExtras = selectedGroups.map(group => ({
      delika_extras_table_id: group.id,
      extrasDetails: {
        id: group.id,
        extrasTitle: group.extrasTitle,
        extrasType: group.extrasType || 'multiple',
        required: group.required || false,
        extrasDetails: group.extrasDetails || []
      }
    }));
    
    setSelectedItemExtras(formattedExtras);
    setShowSelectExtrasModal(false);
  };

  // Update items when category changes
  useEffect(() => {
    const loadCategoryItems = async () => {
      if (!activeId) {
        setCategoryItems([]);
        return;
      }

      setIsLoadingItems(true);
      try {
        const activeCategory = remoteCategories.find(category => category.id === activeId);
        if (!activeCategory?.foods) {
          setCategoryItems([]);
          return;
        }

        // Add a small delay to make the loading state visible
        await new Promise(resolve => setTimeout(resolve, 300));

        // Map only the foods from the active category
        const items = activeCategory.foods.map((food: any) => ({
          name: food.name,
          price: Number(food.price),
          description: food.description || '',
          quantity: food.quantity || 0,
          available: food.available ?? false,
          foodImage: {
            access: 'public',
            path: food.foodImage.url,
            name: food.name,
            type: 'image',
            size: 0,
            mime: 'image/jpeg',
            meta: { width: 0, height: 0 },
            url: food.foodImage.url
          },
          extras: food.extras || []
        }));

  

        setCategoryItems(items);
      } finally {
        setIsLoadingItems(false);
      }
    };

    loadCategoryItems();
  }, [activeId, remoteCategories]);

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      return categoryItems.filter(item =>
        item.name.toLowerCase().includes(lowerQuery)
      );
    }
    return categoryItems;
  }, [categoryItems, searchQuery]);

  const handleItemClick = (item: MenuItem) => {
    // Don't reset selection if already in edit mode
    if (selectedItem?.name === item.name && isEditMode) {
      return;
    }
    setSelectedItem(item);
    setIsEditMode(false);
  };

  // Update the category click handler to clear items first
  const handleCategoryClick = useCallback((categoryId: string) => {
    setCategoryItems([]); // Clear items first
    setActiveId(categoryId); // Then set new category
  }, []);

  // Update the handleUpdateItem function to use the new API function
  const handleUpdateItem = async (id: string, newPrice: number, available: boolean, itemExtras: ExtraGroup[], name: string, description: string, imageFile?: File) => {
    if (!selectedItem) return;

    try {
              // Format extras to use the correct key for the API
        const formattedExtras = itemExtras.map(group => ({
          delika_extras_table_id: group.delika_extras_table_id || ''
        })).filter(extra => extra.delika_extras_table_id !== '');

      if (imageFile) {
        
        // Use FormData for file upload with UPDATE_ITEM endpoint
        const formData = new FormData();
        formData.append('old_name', selectedItem.name);
        formData.append('old_item_description', selectedItem.description || '');
        formData.append('old_item_price', selectedItem.price.toString());
        formData.append('new_name', name);
        formData.append('new_item_description', description || '');
        formData.append('new_item_price', newPrice.toString());
        formData.append('available', available.toString());
        formData.append('restaurantId', userProfile.restaurantId || '');
        formData.append('branchId', userProfile.role === 'Admin' ? selectedBranchId : userProfile.branchId || '');
        formData.append('value', selectedItem.name);
        formData.append('extras', JSON.stringify(formattedExtras));
        formData.append('foodImage', imageFile);
        
        await updateInventoryItemWithImage(formData);
      } else {
        // Use regular JSON for updates without image
        await updateInventoryItem({
          old_name: selectedItem.name,
          old_item_description: selectedItem.description || '',
          old_item_price: selectedItem.price,
          new_name: name,
          new_item_description: description || '',
          new_item_price: Number(newPrice),
          available: available,
          extras: formattedExtras,
          restaurantId: userProfile.restaurantId,
          branchId: userProfile.role === 'Admin' ? selectedBranchId : userProfile.branchId,
          value: selectedItem.name
        });
      }

      addNotification({
        type: 'inventory_alert',
        message: `${selectedItem.name} has been updated successfully`
      });

      setSelectedItem(null);
      
      // Refresh the whole page after successful update
      window.location.reload();

    } catch (error) {
      addNotification({
        type: 'inventory_alert',
        message: 'Failed to update item. Please try again.'
      });
    }
  };

  const handleDeleteItem = async (item: MenuItem) => {
    if (!item) return;

    // Show confirmation dialog
    const confirmed = window.confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      // Create FormData similar to how items are added
      const formData = new FormData();
      formData.append('restaurantId', userProfile.restaurantId || '');
      formData.append('branchId', userProfile.role === 'Admin' ? selectedBranchId : userProfile.branchId || '');
      formData.append('categoryId', activeId || ''); // Add the category ID from the currently active category
      formData.append('itemName', item.name);
      formData.append('itemPrice', item.price.toString());
      formData.append('itemDescription', item.description || '');

      const response = await deleteMenuItem(formData);

      addNotification({
        type: 'inventory_alert',
        message: `${item.name} has been deleted successfully`
      });

      setSelectedItem(null);
      
      // Refresh the whole page after successful deletion
      window.location.reload();

    } catch (error) {
      addNotification({
        type: 'inventory_alert',
        message: 'Failed to delete item. Please try again.'
      });
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    // Show confirmation dialog
    const confirmed = window.confirm(`Are you sure you want to delete the category "${categoryName}"? This will also delete all items in this category. This action cannot be undone.`);
    if (!confirmed) return;

    try {
      await deleteCategory(categoryId);

      addNotification({
        type: 'inventory_alert',
        message: `Category "${categoryName}" has been deleted successfully`
      });

      // Refresh the whole page after successful deletion
      window.location.reload();

    } catch (error) {
      addNotification({
        type: 'inventory_alert',
        message: 'Failed to delete category. Please try again.'
      });
    }
  };

  // Update handleBranchSelect
  const handleBranchSelect = async (branchId: string) => {
    localStorage.setItem('selectedBranchId', branchId);
    setSelectedBranchId(branchId);
  };

  // Function to handle closing the AddInventory modal
  const handleAddInventoryClose = () => {
    setShowAddInventory(false);
    navigate('/dashboard', { state: { activeView: 'inventory' } });
  };

  // Update the inventory refresh handler
  const handleInventoryUpdated = useCallback(async () => {
    try {
      setShowAddInventory(false);
      
      // Show success notification
      addNotification({
        type: 'inventory_alert',
        message: 'Inventory updated successfully'
      });
      
      // Refresh the whole page after successful upload
      window.location.reload();
      
    } catch (error) {
      addNotification({
        type: 'inventory_alert',
        message: 'Item added but failed to refresh inventory. Please refresh the page.'
      });
    }
  }, [addNotification]);

  // Set first category as active on mount
  useEffect(() => {
    if (remoteCategories.length > 0) {
      setActiveId(remoteCategories[0].id);
    }
  }, [remoteCategories]);

  // Update refreshInventory to use selectedBranchId
  const refreshInventory = async () => {
    try {
      const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      
      // Determine endpoint and parameters based on user role
      let endpoint: string;
      let requestBody: any;
      
      if (userProfile?.role?.startsWith('Grocery-')) {
        // Use grocery endpoint for grocery users
        endpoint = '/get/all/menu/grocery';
        requestBody = {
          groceryBranchId: localStorage.getItem('groceryBranchId') || null,
          groceryShopId: localStorage.getItem('groceryShopId') || null,
        };
      } else {
        // Use restaurant endpoint for restaurant users
        endpoint = '/get/all/menu';
        
        const effectiveBranchId = userProfile.role === 'Admin' 
          ? (selectedBranchId || '') 
          : (userProfile.branchId || '');
          
        requestBody = {
          restaurantId: userProfile.restaurantId || '',
          branchId: effectiveBranchId,
        };
      }

      const response = await api.post(endpoint, requestBody);
      setCategories(response.data);

      if (addInventoryCategory?.mainCategoryId) {
        const mainCategory = response.data.find(
          (cat: { id: string; foodType: string }) => cat.id === addInventoryCategory.mainCategoryId
        );
        if (mainCategory) {
          setAddInventoryCategory({
            mainCategory: mainCategory.foodType,
            mainCategoryId: mainCategory.id,
            subCategory: addInventoryCategory.subCategory
          });
        }
      }
    } catch (error) {
    }
  };

  const [categories, setCategories] = useState<Category[]>([]);



  // Update the category click in the JSX
  const renderCategories = () => (
    remoteCategories.map((category) => (
      <div 
        key={category.id}
        className={`flex-none w-[180px] rounded-[8px] border-[1px] border-solid border-[#eaeaea]
                    flex flex-row items-center justify-start p-3 gap-[10px] 
                    text-center text-[#5e5c57] transition-all duration-300
                    hover:bg-[#FFFCF7] relative group
                    ${category.id === activeId ? 'bg-[#FFFCF7] dark:bg-[#2c2522]' : 'bg-[#F7F7F7] dark:bg-[#201a18]'}`}
      >
        <div 
          className="flex flex-row items-center justify-start gap-[10px] flex-1 cursor-pointer"
          onClick={() => handleCategoryClick(category.id)}
        >
          <img
            className="w-[40px] h-[40px] rounded-full object-cover"
            alt={`${category.name} category`}
            src={category.image ? optimizeImageUrl(category.image) : '/category.jpg'}
            loading="eager"
            draggable="false"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/category.jpg';
            }}
          />
          <div className="flex flex-col items-start justify-start">
            <div className="text-[16px] leading-[20px] font-medium text-[#333] font-sans truncate" style={{ maxWidth: '110px' }}>
              {category.name}
            </div>
            <div className="text-[13px] leading-[16px] text-[#999] text-left font-sans">
              {category.itemCount} items
            </div>
          </div>
        </div>
        
        {/* Delete Icon */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteCategory(category.id, category.name);
          }}
          className="absolute top-2 right-2 p-1 rounded-full bg-red-100 hover:bg-red-200 
                     text-red-600 hover:text-red-700 transition-colors opacity-0 group-hover:opacity-100
                     focus:outline-none focus:ring-2 focus:ring-red-300"
          title={`Delete ${category.name} category`}
        >
          <FaTrash className="w-3 h-3" />
        </button>
      </div>
    ))
  );

  // Update the menu items grid section to show loading state
  const renderMenuItemsGrid = () => (
    <div className="grid grid-cols-1 min-[433px]:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
      {isLoadingItems ? (
        // Loading skeleton
        Array(6).fill(0).map((_, index) => (
          <div 
            key={`skeleton-${index}`}
            className="w-full bg-white dark:bg-[#2c2522] rounded-[12px] border-[#eaeaeb] border-[1px] border-solid 
                      overflow-hidden flex flex-col animate-pulse"
          >
            <div className="relative w-full h-[180px] bg-gray-200 dark:bg-gray-700" />
            <div className="p-4 flex flex-col gap-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              <div className="flex items-center gap-2 mt-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
              </div>
            </div>
          </div>
        ))
      ) : filteredItems.length > 0 ? (
        <>
          {filteredItems.map((item) => (
            <div 
              key={item.name}
              className="w-full bg-white dark:bg-[#2c2522] rounded-[12px] border-[#eaeaeb] border-[1px] border-solid 
                        overflow-hidden flex flex-col hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleItemClick(item)}
            >
              <div className="relative w-full">
                <OptimizedImage
                  src={item.foodImage.url}
                  alt={item.name}
                  className="w-full h-[180px] object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              <div className="p-4 flex flex-col gap-1">
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium text-[#333] dark:text-white font-sans truncate overflow-hidden whitespace-nowrap">
                    {item.name}
                  </div>
                  <div className="text-[12px] font-medium text-[#606060] dark:text-[#a2a2a2] font-sans">
                    GH₵{item.price}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <FiShoppingCart className="text-[13px] text-[#a2a2a2]" />
                  <Badge 
                    className={item.available 
                      ? "text-[11px] h-5 bg-green-100 text-green-800 border-green-200 hover:bg-green-200" 
                      : "text-[11px] h-5 bg-red-100 text-red-800 border-red-200 hover:bg-red-200"}
                  >
                    {item.available ? t('inventory.available') : t('inventory.unavailable')}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
          {/* Add Item Card */}
          <div
            className="flex flex-col items-center justify-center bg-[#F7F7F7] dark:bg-[#201a18] rounded-[12px] border border-[#eaeaeb] min-h-[260px] cursor-pointer transition hover:shadow-md"
            onClick={() => {
              const activeCategory = remoteCategories.find(cat => cat.id === activeId);
              if (activeCategory) {
                onAddItemButtonClick(activeCategory);
              }
            }}
          >
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#fd4d4d]/10 mb-2">
              <span className="text-4xl text-[#fd4d4d]">+</span>
            </div>
            <span className="text-base font-sans text-[#222]">Add item</span>
          </div>
        </>
      ) : (
        <div className="col-span-full text-center py-4 text-gray-500 font-sans">
          {t('inventory.noItems')}
        </div>
      )}
    </div>
  );

 

  return (
    <div className="h-full w-full bg-white dark:bg-[#201a18] m-0 p-0">
      <div className="p-3 ml-4 mr-4">
        {/* Title and Add Item Section */}
        <div className="flex justify-between items-center mb-4">
          <b className="text-[18px] font-sans">
            {t('inventory.title')}
          </b>
          <div className="flex items-center gap-2">
            {userProfile?.role === 'Admin' && (
              <BranchFilter 
                restaurantId={userProfile.restaurantId || null}
                onBranchSelect={handleBranchSelect}
                selectedBranchId={selectedBranchId}
                hideAllBranches={true}
                className="appearance-none bg-white border border-[rgba(167,161,158,0.1)] rounded-md px-4 py-2 pr-8 text-[14px] font-sans text-[#666] cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-0 focus:border-[rgba(167,161,158,0.1)]"
              />
            )}
           

            <div
              className="flex items-center gap-2 px-3 py-1 rounded-[4px] bg-[#313131] border-[#737373] border-[1px] border-solid cursor-pointer text-[12px] font-sans"
              onClick={() => onAddItemButtonClick()}
            >
              <IoMdAdd className="w-[18px] h-[18px] text-[#cbcbcb]" />
              <div className="leading-[18px] font-sans text-white">{t('inventory.addNewItem')}</div>
            </div>
          </div>
        </div>
        {/* Total Items */}
        <div className="relative leading-[22px] font-sans mb-4">
          {t('inventory.allItems')} - {remoteCategories.reduce((total, category) => total + (category.foods?.length || 0), 0)}
        </div>

        {/* Categories Section */}
        <section className="mb-[15px] overflow-hidden relative">
          <div className="flex items-center">
            {/* Only show arrows if there are items */}
            {filteredItems.length > 0 && (
              <button 
                className="bg-white rounded-full shadow-md p-2 z-10 flex-shrink-0"
                onClick={() => {
                  if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
                  }
                }}
              >
                <FaArrowAltCircleLeft className="w-4 h-4" />
              </button>
            )}
            
            <div
              ref={scrollContainerRef}
              className="flex flex-row gap-3 overflow-x-auto scrollbar-hide touch-pan-x pb-[10px] mx-2 flex-grow"
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onMouseMove={handleMouseMove}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
              style={{ 
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: 'none'
              }}
            >
              <div className="flex flex-row gap-3">
                {categoriesLoading ? (
                  <div className="flex justify-center p-4">
                    <div className="animate-pulse flex space-x-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div 
                          key={i}
                          className="flex-none w-[180px] h-[64px] rounded-[8px] bg-gray-200"
                        />
                      ))}
                    </div>
                  </div>
                ) : categoriesError ? (
                  <div className="flex justify-center p-4 text-red-500 font-sans">{categoriesError}</div>
                ) : (
                  renderCategories()
                )}
              </div>
            </div>

            {/* Only show arrows if there are items */}
            {filteredItems.length > 0 && (
              <button 
                className="bg-white rounded-full shadow-md p-2 z-10 flex-shrink-0"
                onClick={() => {
                  if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
                  }
                }}
              >
                <FaArrowAltCircleRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </section>

        {/* Menu Items Grid - Using filteredItems */}
        {renderMenuItemsGrid()}
      </div>



      {/* Add Inventory Modal */}
      {showAddInventory && (
        <AddInventory 
          onClose={handleAddInventoryClose}
          onInventoryUpdated={handleInventoryUpdated}
          branchId={selectedBranchId || userProfile.branchId}
          preSelectedCategory={addInventoryCategory || undefined}
        />
      )}

      {/* Action Selection Dialog */}
      <ActionSelectionDialog
        open={showActionDialog}
        onClose={() => setShowActionDialog(false)}
        onSelectAction={handleActionSelect}
      />

      {/* Add Extras Modal */}
      <AddExtrasModal
        open={showAddExtrasModal}
        onClose={() => setShowAddExtrasModal(false)}
        onAdd={(groups) => {
          setShowAddExtrasModal(false);
          // Optionally refresh the page or show success notification
          addNotification({
            type: 'inventory_alert',
            message: 'Extras created successfully'
          });
        }}
        mode="create"
      />

      {/* Edit Inventory Modal */}
      {selectedItem && (
        <EditInventoryModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onSave={(id, newPrice, available, itemExtras, name, description, imageFile) => 
            handleUpdateItem(id, newPrice, available, itemExtras, name, description, imageFile)}
          onDelete={handleDeleteItem}
          isUpdating={isUpdating}
          updateError={updateError}
          branchId={selectedBranchId || userProfile.branchId}
          selectedItemExtras={selectedItemExtras}
          restaurantId={userProfile.restaurantId || userProfile._restaurantTable?.[0]?.id || userProfile.restaurantData?.id || ''}
        />
      )}

    </div>
  );
};

export default Inventory;
