import { FunctionComponent, useState, useCallback, useRef, TouchEvent, MouseEvent, useEffect, useMemo } from "react";
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

interface MenuItem {
  id: string;
  image: string;
  name: string;
  price: number;
  description?: string;
  available: boolean;
  extras?: ExtraGroup[];
}

interface EditInventoryModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onSave: (id: string, newPrice: number, available: boolean) => void;
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
}

interface ExtraGroup {
  delika_inventory_table_id: string;
  extrasTitle: string;
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

  // Pass selectedBranchId to useMenuCategories
  const { categories: remoteCategories, isLoading: categoriesLoading, error: categoriesError } = useMenuCategories();

  const [activeId, setActiveId] = useState<string | null>(null);

  const onAddItemButtonClick = useCallback((category?: Category) => {
    if (category) {
      // If adding from within a category, only set the subcategory info
      setAddInventoryCategory({
        mainCategory: "",  // Don't pre-fill main category
        mainCategoryId: "", // Don't pre-fill main category ID
        subCategory: category.name // Only pre-fill subcategory
      });
    } else {
      // If adding from the top button, don't pre-fill any category
      setAddInventoryCategory(null);
    }
    setShowAddInventory(true);
  }, []);

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
  const [activeCategoryFoods, setActiveCategoryFoods] = useState<MenuItem[]>([]);
  const { updateInventory, isLoading: isUpdating, error: updateError } = useUpdateInventory();

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
  };

  const handleUpdateItem = async (id: string, newPrice: number, available: boolean) => {
    if (!selectedItem) return;

    try {
      await updateInventory({
        menuId: activeId,
        newPrice: newPrice.toString(),
        name: selectedItem.name,
        description: selectedItem.description || '',
        available: available
      });

      // Add notification
      addNotification({
        type: 'inventory_update',
        message: `${selectedItem.name} has been updated (Price: ${newPrice})`
      });

      // Close modal
      setSelectedItem(null);

      // Store the active view in localStorage
      localStorage.setItem('dashboardActiveView', 'inventory');
      
      // Force a complete page refresh
      window.location.href = '/dashboard?view=inventory';

    } catch (error) {
    }
  };

  const EditInventoryModal: FunctionComponent<EditInventoryModalProps> = ({ item, onClose, onSave, isUpdating, updateError, branchId }) => {
    if (!item) return null;
    
    const [price, setPrice] = useState(item.price);
    const [available, setAvailable] = useState(item.available);
    const { t } = useTranslation();

    return (
      <Modal
        open={true}
        onClose={onClose}
        className="flex items-center justify-center p-4"
      >
        <div className="bg-white dark:bg-[#2c2522] rounded-lg p-4 sm:p-6 w-full max-w-[95%] sm:max-w-[90%] md:max-w-[1000px] mx-auto max-h-[90vh] overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Left Column - Main Item Details */}
            <div className="flex flex-col gap-4">
              <img
                src={optimizeImageUrl(item.image)}
                alt={item.name}
                className="w-full h-[200px] sm:h-[250px] object-cover rounded-lg"
                loading="eager"
              />
              <div className="flex flex-col gap-1">
                <h2 className="text-lg sm:text-xl font-semibold font-sans">{item.name}</h2>
                <p className="text-sm text-black font-sans">{item.description}</p>
                <div className={`text-sm font-sans ${item.available ? 'text-green-600' : 'text-red-600'}`}>
                  {item.available ? t('inventory.available') : t('inventory.unavailable')}
                </div>
              </div>
            </div>

            {/* Right Column - Extras and Controls */}
            <div className="flex flex-col gap-4">
              {/* Extras Section */}
              {item.extras && item.extras.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold font-sans mb-2">Extras Available</h3>
                  <div className="space-y-3 max-h-[250px] sm:max-h-[300px] overflow-y-auto">
                    {(() => {
                      // Group extras by extrasTitle
                      const groupedExtras = item.extras.reduce((acc, extraGroup) => {
                        const title = extraGroup.extrasTitle;
                        if (!acc[title]) {
                          acc[title] = [];
                        }
                        // Add all extrasDetails from this group to the title
                        acc[title].push(...extraGroup.extrasDetails);
                        return acc;
                      }, {} as Record<string, ExtraDetail[]>);

                      // Render grouped extras
                      return Object.entries(groupedExtras).map(([title, details], groupIndex) => (
                        <div key={groupIndex} className="border border-gray-200 rounded-lg p-2 sm:p-3 bg-gray-50">
                          <h4 className="text-sm sm:text-md font-medium font-sans mb-2 text-[#333]">
                            {title}
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {details.map((extraDetail, detailIndex) => (
                              <div key={detailIndex} className="bg-white rounded-lg border border-gray-100 p-2 text-center">
                                <img
                                  src={optimizeImageUrl(extraDetail.foodImage.url)}
                                  alt={extraDetail.foodName}
                                  className="w-full h-12 sm:h-16 object-contain rounded mb-1"
                                  loading="lazy"
                                />
                                <div className="text-xs font-medium font-sans text-[#333] leading-tight mb-1">
                                  {extraDetail.foodName}
                                </div>
                                <div className="text-xs font-semibold font-sans text-[#fd683e]">
                                  GH₵{extraDetail.foodPrice}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* Price and Availability Controls */}
              <div className="flex flex-col gap-4 mt-auto">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Price Control */}
                  <div className="flex flex-col gap-2 flex-1">
                    <label className="text-sm text-gray-600 font-sans">{t('inventory.price')} (GHS)</label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="border rounded p-2 font-sans w-full"
                    />
                  </div>

                  {/* Availability Control */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-gray-600 font-sans">{t('inventory.availability')}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={available}
                        onChange={(e) => setAvailable(e.target.checked)}
                        className="w-5 h-5"
                      />
                      <span className="text-sm font-sans">
                        {available ? t('inventory.available') : t('inventory.unavailable')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-end">
                  <Button
                    onClick={onClose}
                    variant="outlined"
                    className="font-sans order-2 sm:order-1"
                    style={{
                      backgroundColor: '#fd683e',
                      borderColor: '#f5fcf8',
                      color: 'white',
                      padding: '9px 20px',
                      fontSize: '10px',
                      borderRadius: '4px',
                      flex: 1,
                      height: '42px',
                    }}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    onClick={() => onSave(item.id, price, available)}
                    variant="contained"
                    className="font-sans !font-sans order-1 sm:order-2"
                    style={{
                      backgroundColor: '#201a18',
                      borderColor: '#f5fcf8',
                      color: 'white',
                      padding: '9px 20px',
                      fontSize: '10px',
                      borderRadius: '4px',
                      flex: 1,
                      height: '42px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {t('inventory.saveChanges')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
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

  // Set first category as active on mount
  useEffect(() => {
    if (remoteCategories.length > 0) {
      setActiveId(remoteCategories[0].id);
    }
  }, [remoteCategories]);

  // Update activeCategoryFoods when activeId changes
  useEffect(() => {
    if (activeId && remoteCategories.length > 0) {
      const activeCategory = remoteCategories.find(category => category.id === activeId);

      if (activeCategory) {
        const activeFoods = Array.isArray(activeCategory.foods) ? activeCategory.foods : [];
        setActiveCategoryFoods(
          activeFoods.map((food: CategoryFood) => ({
            id: food.name,
            image: food.foodImage.url,
            name: food.name,
            price: Number(food.price),
            description: food.description,
            available: food.available ?? false,
            extras: food.extras || []
          }))
        );
      }
    }
  }, [activeId, remoteCategories]);

  // Filter items across all categories
  const filteredItems = useMemo(() => {
    if (!searchQuery) {
      return activeCategoryFoods;
    }

    const lowerQuery = searchQuery.toLowerCase();
    
    const allItems = remoteCategories.flatMap(category => 
      category.foods.map((food: CategoryFood) => ({
        id: food.name,
        image: food.foodImage.url,
        name: food.name,
        price: Number(food.price),
        description: food.description || '',
        available: food.available ?? false,
        extras: food.extras || []
      }))
    );

    return allItems.filter(item =>
      item.name.toLowerCase().includes(lowerQuery)
    );
  }, [remoteCategories, searchQuery, activeCategoryFoods]);

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
          (cat: { id: string; categoryName: string }) => cat.id === addInventoryCategory.mainCategoryId
        );
        if (mainCategory) {
          console.log('Setting initial main category:', mainCategory);
          setAddInventoryCategory({
            mainCategory: mainCategory.categoryName,
            mainCategoryId: mainCategory.id,
            subCategory: addInventoryCategory.subCategory
          });
        }
      }

      console.log('Initial State Values:', {
        selectedCategory: addInventoryCategory,
        selectedMainCategory: response.data.find((cat: { id: string; categoryName: string }) => cat.id === addInventoryCategory?.mainCategoryId),
        selectedMainCategoryId: addInventoryCategory?.mainCategoryId,
        mainCategories: response.data
      });
    } catch (error) {
      console.error('Failed to refresh inventory:', error);
    }
  };

  const [categories, setCategories] = useState<Category[]>([]);

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
                  remoteCategories.map((category) => (
                    <div 
                      key={category.id}
                      onClick={() => setActiveId(category.id)}
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
        <div className="grid grid-cols-1 min-[433px]:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
          {filteredItems.length > 0 ? (
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
                    <div className={`absolute top-2 right-2 text-[12px] px-2 py-1 rounded-full font-sans
                      ${item.available 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'}`}>
                      {item.available ? t('inventory.available') : t('inventory.unavailable')}
                    </div>
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
                    <div className="flex items-center text-[13px] text-[#a2a2a2] mt-1 font-sans">
                      <FiShoppingCart className="mr-1" />
                      {item.available ? t('inventory.available') : t('inventory.unavailable')}
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
      </div>

      {/* Add the modal */}
      {showAddInventory && (
        <AddInventory 
          onClose={handleAddInventoryClose}
          onInventoryUpdated={() => {
            setShowAddInventory(false);
          }}
          branchId={selectedBranchId || userProfile.branchId}
          preSelectedCategory={addInventoryCategory || undefined}
        />
      )}

      {/* Add the edit modal */}
      {selectedItem && (
        <EditInventoryModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onSave={handleUpdateItem}
          isUpdating={isUpdating}
          updateError={updateError}
          branchId={selectedBranchId || userProfile.branchId}
        />
      )}
    </div>
  );
};

export default Inventory;