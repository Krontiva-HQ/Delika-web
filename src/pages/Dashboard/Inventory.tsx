import React, { FunctionComponent, useState, useCallback, useRef, TouchEvent, MouseEvent, useEffect, useMemo } from "react";
import { Button, Menu, MenuItem, Modal, IconButton } from "@mui/material";
import { IoMdNotificationsOutline, IoMdAdd, IoMdRemove } from "react-icons/io";
import { FaRegMoon, FaChevronDown, FaArrowAltCircleLeft, FaArrowAltCircleRight } from "react-icons/fa";
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
import AddExtrasModal from '../../components/AddExtrasModal';
import { updateInventoryItem, deleteMenuItem } from '../../services/api';

interface MenuItem {
  id: string;
  image: string;
  name: string;
  price: number;
  description?: string;
  available: boolean;
  extras?: ExtraGroup[];
  value?: string;
}

interface EditInventoryModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onSave: (id: string, newPrice: number, available: boolean, itemExtras: ExtraGroup[], name: string, description: string) => void;
  onDelete: (item: MenuItem) => void;
  isUpdating: boolean;
  updateError: string | null;
  branchId: string;
}

// Add interfaces for extras
interface ExtraDetail {
  foodName: string;
  foodPrice: number;
  foodDescription: string;
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
  value?: string;  // Add value property for variant ID
}

interface ExtraGroup {
  id: string;
  extrasTitle: string;
  delika_inventory_table_id?: string;
  extrasDetails: ExtraDetail[];
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Choose Action</DialogTitle>
          <DialogDescription>
            Select whether you want to add a menu item or add extras.
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
          </button>
          <button
            className="flex flex-col items-center justify-center p-6 bg-white dark:bg-[#2c2522] border border-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-[#201a18] transition-colors"
            onClick={() => onSelectAction('extras')}
          >
            <div className="w-12 h-12 bg-[#fd683e]/10 rounded-full flex items-center justify-center mb-3">
              <IoMdAdd className="w-6 h-6 text-[#fd683e]" />
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">Add Extras</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Inventory: FunctionComponent<InventoryProps> = ({ searchQuery = '' }) => {
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
  const [addExtrasModalMode, setAddExtrasModalMode] = useState<'create' | 'select'>('create');

  const handleActionSelect = (action: 'menu-item' | 'extras') => {
    setShowActionDialog(false);
    if (action === 'menu-item') {
      setAddInventoryCategory(null);
      setShowAddInventory(true);
    } else {
      setAddExtrasModalMode('create');
      setShowAddExtrasModal(true);
    }
  };

  const onAddItemButtonClick = useCallback((category?: Category) => {
    if (category) {
      // If adding from within a category, use the category's ID directly
      console.log('Adding item to category:', category);
      setAddInventoryCategory({
        mainCategory: category.name,
        mainCategoryId: category.id, // Use the category's ID directly
        subCategory: category.name
      });
      setShowAddInventory(true);
    } else {
      // If adding from the top button, show the action selection dialog
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
        const items = activeCategory.foods.map((food: CategoryFood) => ({
          id: food.name,
          image: food.foodImage.url,
          name: food.name,
          price: Number(food.price),
          description: food.description || '',
          available: food.available ?? false,
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
    if (selectedItem?.id === item.id && isEditMode) {
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

  const handleUpdateItem = async (id: string, newPrice: number, available: boolean, itemExtras: ExtraGroup[], name: string, description: string) => {
    if (!selectedItem) return;

    try {
      const formattedExtras = itemExtras.flatMap(group =>
        group.extrasDetails.map(detail => ({
          extrasTitle: group.extrasTitle,
          delika_inventory_table_id: detail.value || group.delika_inventory_table_id || ''
        })).filter(extra => extra.delika_inventory_table_id !== '')
      );

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
        value: selectedItem.id
      });

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
      console.error('Failed to delete item:', error);
      addNotification({
        type: 'inventory_alert',
        message: 'Failed to delete item. Please try again.'
      });
    }
  };

  const EditInventoryModal: FunctionComponent<EditInventoryModalProps> = ({ item, onClose, onSave, onDelete, isUpdating, updateError, branchId }) => {
    if (!item) return null;
    
    const [price, setPrice] = useState(item.price);
    const [available, setAvailable] = useState(item.available);
    const [editForm, setEditForm] = useState({
      name: item.name,
      description: item.description || '',
      image: item.image
    });
    const [showAddExtrasModal, setShowAddExtrasModal] = useState(false);
    const [addExtrasModalMode, setAddExtrasModalMode] = useState<'create' | 'select'>('select');

    // Group the initial extras by extrasTitle
    const [itemExtras, setItemExtras] = useState<ExtraGroup[]>(() => {
      if (!item.extras) return [];
      
      return Object.values(item.extras.reduce((acc, extra) => {
        if (!acc[extra.extrasTitle]) {
          acc[extra.extrasTitle] = {
            id: `${Date.now()}-${Math.random().toString(36).substring(2)}`,
            extrasTitle: extra.extrasTitle,
            delika_inventory_table_id: extra.delika_inventory_table_id || '',
            extrasDetails: []
          };
        }
        // Add details if they don't already exist
        if (!acc[extra.extrasTitle].extrasDetails.some(
          detail => detail.foodName === extra.extrasDetails[0]?.foodName
        )) {
          acc[extra.extrasTitle].extrasDetails.push(...extra.extrasDetails);
        }
        return acc;
      }, {} as Record<string, ExtraGroup>));
    });

    const handleEditToggle = () => {
      setIsEditMode(!isEditMode);
    };

    const handleModalClose = () => {
      setIsEditMode(false);
      onClose();
    };

    const handleAddExtras = (newExtras: ExtraGroup[]) => {
      setItemExtras(newExtras);
      setShowAddExtrasModal(false);
    };

    const handleSave = () => {
      onSave(item.id, price, available, itemExtras, editForm.name, editForm.description);
    };

    return (
      <>
        <Modal
          open={true}
          onClose={handleModalClose}
          className="flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-[#2c2522] rounded-lg p-3 sm:p-4 w-full max-w-[95%] sm:max-w-[85%] md:max-w-[800px] mx-auto max-h-[85vh] overflow-y-auto relative shadow-xl border border-gray-100">
            {/* Edit Button at Top Right */}
            <Button
              onClick={handleEditToggle}
              variant="outlined"
              className="z-10"
              style={{
                position: 'absolute',
                top: '12px',
                right: '24px',
                backgroundColor: isEditMode ? '#fd683e' : '#201a18',
                borderColor: isEditMode ? '#fd683e' : '#201a18',
                color: 'white',
                padding: '4px 12px',
                fontSize: '10px',
                borderRadius: '4px',
                minWidth: '60px'
              }}
            >
              {isEditMode ? 'Cancel' : 'Edit'}
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mt-6">
              {/* Left Column - Main Item Details */}
              <div className="flex flex-col gap-3 bg-gray-50 dark:bg-[#201a18] rounded-lg p-4">
                {isEditMode ? (
                  <div className="space-y-6">
                    {/* Image Upload Section */}
                    <Card className="bg-white dark:bg-[#2c2522] border-gray-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                          <svg className="w-5 h-5 text-[#fd683e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                          Item Image
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="relative group">
                          <img
                            src={editForm.image}
                            alt={editForm.name}
                            className="w-full h-[200px] object-cover rounded-lg border-2 border-dashed border-gray-300 group-hover:border-[#fd683e] transition-colors"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                              </svg>
                            </div>
                          </div>
                        </div>
                        
                      </CardContent>
                    </Card>

                    {/* Item Details Section */}
                    <Card className="bg-white dark:bg-[#2c2522] border-gray-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                          <svg className="w-5 h-5 text-[#fd683e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                          </svg>
                          Item Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 w-[270px] ">
                        <div className="space-y-2">
                          <Label htmlFor="item-name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Item Name
                          </Label>
                          <Input
                            id="item-name"
                            value={editForm.name}
                            onChange={(e) => setEditForm(prev => ({
                              ...prev,
                              name: e.target.value
                            }))}
                            placeholder="Enter item name"
                            className="border-gray-300 focus:border-[#fd683e] focus:ring-[#fd683e]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="item-description" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Description
                          </Label>
                          <Textarea
                            id="item-description"
                            value={editForm.description}
                            onChange={(e) => setEditForm(prev => ({
                              ...prev,
                              description: e.target.value
                            }))}
                            placeholder="Enter item description"
                            rows={3}
                            className="border-gray-300 focus:border-[#fd683e] focus:ring-[#fd683e] resize-none"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-0.5">
                          <label className="text-xs text-gray-600 font-sans">Item Name</label>
                          <h2 className="text-md sm:text-lg font-semibold">{item.name}</h2>
                        </div>
                        <Badge 
                          className={item.available 
                            ? "w-fit bg-green-100 text-green-800 border-green-200 hover:bg-green-200" 
                            : "w-fit bg-red-100 text-red-800 border-red-200 hover:bg-red-200"}
                        >
                          {item.available ? t('inventory.available') : t('inventory.unavailable')}
                        </Badge>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-xs text-gray-600 font-sans">Item Description</label>
                        <p className="text-sm text-black">{item.description || 'No description available'}</p>
                      </div>
                    </div>
                    <img
                      src={optimizeImageUrl(item.image)}
                      alt={item.name}
                      className="w-full h-[200px] sm:h-[250px] object-cover rounded-lg"
                      loading="eager"
                    />
                  </>
                )}
              </div>

              {/* Right Column - Extras and Controls */}
              <div className="flex flex-col gap-3 bg-gray-50 dark:bg-[#201a18] rounded-lg p-4">
                {/* Extras Section */}
                <Card className="bg-white dark:bg-[#2c2522] border-gray-200">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <svg className="w-5 h-5 text-[#fd683e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        Extras Available
                      </CardTitle>
                      {isEditMode && (
                        <UIButton
                          onClick={() => { setAddExtrasModalMode('select'); setShowAddExtrasModal(true); }}
                          size="sm"
                          className="h-8 px-3 text-xs bg-[#fd683e] hover:bg-[#e54d0e] text-white"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                          </svg>
                          Add Extras
                        </UIButton>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {itemExtras && itemExtras.length > 0 ? (
                      <div className="space-y-3 max-h-[200px] overflow-y-auto">
                        {itemExtras.map((group, index) => (
                          <div key={group.id || index} className="border border-gray-200 rounded-lg p-3 bg-gray-50 dark:bg-[#201a18]">
                            <h4 className="text-sm font-medium text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                              <div className="w-2 h-2 bg-[#fd683e] rounded-full"></div>
                              {group.extrasTitle}
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {group.extrasDetails.map((detail, detailIndex) => (
                                <div key={`${detail.foodName}-${detailIndex}`} className="bg-white dark:bg-[#2c2522] rounded-lg border border-gray-200 p-2 text-center hover:shadow-sm transition-shadow">
                                  <div className="text-xs font-medium text-gray-800 dark:text-white leading-tight mb-1">
                                    {detail.foodName}
                                  </div>
                                  <div className="text-xs font-semibold text-[#fd683e]">
                                    GH₵{detail.foodPrice}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-[#201a18] rounded-full flex items-center justify-center mb-3">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 1L5 5l4 4"></path>
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-500 mb-1">No extras available</p>
                        <p className="text-xs text-gray-400">This menu item currently has no additional extras or add-ons</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Pricing & Availability Section */}
                <Card className="bg-white dark:bg-[#2c2522] border-gray-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#fd683e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                      </svg>
                      Pricing & Availability
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!isEditMode ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Price (GHS)</Label>
                          <div className="text-2xl font-bold text-[#fd683e]">GH₵{item.price}</div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Availability</Label>
                          <Badge 
                            className={item.available 
                              ? "w-fit bg-green-100 text-green-800 border-green-200 hover:bg-green-200" 
                              : "w-fit bg-red-100 text-red-800 border-red-200 hover:bg-red-200"}
                          >
                            {item.available ? t('inventory.available') : t('inventory.unavailable')}
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div>
                          <Label htmlFor="price-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Price (GHS)
                          </Label>
                          <div className="relative w-[240px] mb-6">
                            <div className="relative w-full max-w-xs">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">GH₵</span>
                              <Input
                                id="price-input"
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(Number(e.target.value))}
                                className="pl-14 border-gray-300 focus:border-[#fd683e] focus:ring-[#fd683e]"
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                          
                          <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Availability
                          </Label>
                          <div className="flex items-center space-x-3">
                            <Switch
                              checked={available}
                              onCheckedChange={(checked: boolean) => setAvailable(checked)}
                              className="data-[state=checked]:bg-[#fd683e]"
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {available ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4 mt-6">
                          {!isEditMode && (
                            <UIButton
                              onClick={onClose}
                              variant="outline"
                              className="flex-1"
                            >
                              Cancel
                            </UIButton>
                          )}
                          <UIButton
                            onClick={() => onDelete(item)}
                            variant="outline"
                            className="flex-1 border-red-500 text-red-500 hover:bg-red-50 hover:border-red-600"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                            Delete Item
                          </UIButton>
                          <UIButton
                            onClick={handleSave}
                            className="flex-1 bg-[#fd683e] hover:bg-[#e54d0e]"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            Save Changes
                          </UIButton>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </Modal>
        {/* Add Extras Modal for editing inventory */}
        {showAddExtrasModal && (
          <AddExtrasModal
            open={showAddExtrasModal}
            onClose={() => setShowAddExtrasModal(false)}
            onAdd={handleAddExtras}
            initialExtras={itemExtras}
            mode={addExtrasModalMode}
          />
        )}
      </>
    );
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
      console.error('Failed to refresh inventory:', error);
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
      const params = new URLSearchParams({
        restaurantId: userProfile.restaurantId || '',
        branchId: userProfile.role === 'Admin' 
          ? (selectedBranchId || '') 
          : (userProfile.branchId || ''),
      }); 

      const response = await api.post(`/get/all/menu`, params);
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
        onClick={() => handleCategoryClick(category.id)}
        className={`flex-none w-[180px] rounded-[8px] border-[1px] border-solid border-[#eaeaea]
                    flex flex-row items-center justify-start p-3 gap-[10px] 
                    text-center text-[#5e5c57] transition-all duration-300
                    hover:bg-[#FFFCF7] cursor-pointer
                    ${category.id === activeId ? 'bg-[#FFFCF7] dark:bg-[#2c2522]' : 'bg-[#F7F7F7] dark:bg-[#201a18]'}`}
      >
        <img
          className="w-[40px] h-[40px] rounded-full object-cover"
          alt={`${category.name} category`}
          src={optimizeImageUrl(category.image)}
          loading="eager"
          draggable="false"
        />
        <div className="flex flex-col items-start justify-start">
          <div className="text-[16px] leading-[20px] font-medium text-[#333] font-sans">
            {category.name}
          </div>
          <div className="text-[13px] leading-[16px] text-[#999] text-left font-sans">
            {category.itemCount} items
          </div>
        </div>
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
              key={item.id}
              className="w-full bg-white dark:bg-[#2c2522] rounded-[12px] border-[#eaeaeb] border-[1px] border-solid 
                        overflow-hidden flex flex-col hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleItemClick(item)}
            >
              <div className="relative w-full">
                <OptimizedImage
                  src={item.image}
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

      {/* Add the action selection dialog */}
      <ActionSelectionDialog
        open={showActionDialog}
        onClose={() => setShowActionDialog(false)}
        onSelectAction={handleActionSelect}
      />

      {/* Add Inventory Modal */}
      {showAddInventory && (
        <AddInventory 
          onClose={handleAddInventoryClose}
          onInventoryUpdated={handleInventoryUpdated}
          branchId={selectedBranchId || userProfile.branchId}
          preSelectedCategory={addInventoryCategory || undefined}
        />
      )}

      {/* Edit Inventory Modal */}
      {selectedItem && (
        <EditInventoryModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onSave={(id, newPrice, available, itemExtras, name, description) => handleUpdateItem(id, newPrice, available, itemExtras, name, description)}
          onDelete={handleDeleteItem}
          isUpdating={isUpdating}
          updateError={updateError}
          branchId={selectedBranchId || userProfile.branchId}
        />
      )}

      {/* Only render AddExtrasModal here if not in edit modal context */}
      {!selectedItem && showAddExtrasModal && (
        <AddExtrasModal
          open={showAddExtrasModal}
          onClose={() => setShowAddExtrasModal(false)}
          onAdd={(groups) => {
            setShowAddExtrasModal(false);
          }}
          initialExtras={[]}
          mode={addExtrasModalMode}
        />
      )}
    </div>
  );
};

export default Inventory;