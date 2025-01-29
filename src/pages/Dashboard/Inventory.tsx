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

interface MenuItem {
  id: string;
  image: string;
  name: string;
  price: number;
  description?: string;
  quantity: number;
  remainingItems: number;
}

interface EditInventoryModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onSave: (id: string, newPrice: number, newQuantity: number) => void;
  isUpdating: boolean;
  updateError: string | null;
  branchId: string;
}

// Add interface for category food items
interface CategoryFood {
  name: string;
  price: string;
  foodImage: {
    url: string;
  };
  quantity?: number;
  description?: string;
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

  const onAddItemButtonClick = useCallback(() => {
    setShowAddInventory(true);
  }, []);

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

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
  };

  const handleUpdateItem = async (id: string, newPrice: number, newQuantity: number) => {
    if (!selectedItem) return;

    try {
      await updateInventory({
        menuId: activeId,
        newPrice: newPrice.toString(),
        name: selectedItem.name,
        description: selectedItem.description || '',
        newQuantity: newQuantity
      });

      // Add notification
      addNotification({
        type: 'inventory_update',
        message: `${selectedItem.name} has been updated (Price: ${newPrice}, Quantity: ${newQuantity})`
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
    const [quantity, setQuantity] = useState(item?.remainingItems || 0);
    const [price, setPrice] = useState(item?.price || 0);

    if (!item) return null;

    return (
      <Modal
        open={true}
        onClose={onClose}
        className="flex items-center justify-center"
      >
        <div className="bg-white dark:bg-[#2c2522] rounded-lg p-6 w-[90%] max-w-[400px] mx-auto">
          <div className="flex flex-col gap-4">
            <img
              src={optimizeImageUrl(item.image)}
              alt={item.name}
              className="w-full h-[250px] object-cover rounded-lg"
              loading="eager"
            />
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold font-sans">{item.name}</h2>
              <p className="text-sm text-black font-sans">{item.description}</p>
            </div>
          </div>
          <div className="flex gap-4">
            {/* Price Control */}
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-sm text-gray-600 font-sans">Price (GHS)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="border rounded p-2 font-sans"
              />
            </div>

            {/* Quantity Control */}
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-sm text-gray-600 font-sans">Quantity</label>
              <div className="flex items-center gap-2">
                <IconButton 
                  onClick={() => setQuantity(prev => Math.max(0, prev - 1))}
                  className="border rounded-full"
                >
                  <IoMdRemove />
                </IconButton>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="border rounded p-2 w-20 text-center font-sans [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <IconButton 
                  onClick={() => setQuantity(prev => prev + 1)}
                  className="border rounded-full"
                >
                  <IoMdAdd />
                </IconButton>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-end mt-4">
            <Button
              onClick={onClose}
              variant="outlined"
              className="font-sans"
              style={{
                backgroundColor: '#fd683e',
                borderColor: '#f5fcf8',
                color: 'white',
                padding: '9px 90px',
                fontSize: '10px',
                borderRadius: '4px',
                flex: 1,
                height: '42px',
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => onSave(item.id, price, quantity)}
              variant="contained"
              className="font-sans !font-sans"
              style={{
                backgroundColor: '#201a18',
                borderColor: '#f5fcf8',
                color: 'white',
                padding: '9px 90px',
                fontSize: '10px',
                borderRadius: '4px',
                flex: 1,
                height: '42px',
                whiteSpace: 'nowrap'
              }}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    );
  };

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeCategoryFoods, setActiveCategoryFoods] = useState<MenuItem[]>([]);
  const { updateInventory, isLoading: isUpdating, error: updateError } = useUpdateInventory();

  // Update handleBranchSelect
  const handleBranchSelect = async (branchId: string) => {
    localStorage.setItem('selectedBranchId', branchId);
    setSelectedBranchId(branchId);
  };

  // Function to handle closing the AddInventory modal
  const handleAddInventoryClose = () => {
    setShowAddInventory(false);
    refreshInventory();
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
            quantity: food.quantity || 0,
            remainingItems: food.quantity || 0
          }))
        );
      }
    }
  }, [activeId, remoteCategories]);

  // Filter items across all categories
  const filteredItems = useMemo(() => {
    if (!searchQuery) {
      // When no search query, return the active category's foods
      return activeCategoryFoods;
    }

    const lowerQuery = searchQuery.toLowerCase();
    
    // Get all items from all categories when searching
    const allItems = remoteCategories.flatMap(category => 
      category.foods.map((food: CategoryFood) => ({
        id: food.name,
        image: food.foodImage.url,
        name: food.name,
        price: Number(food.price),
        description: food.description || '',
        quantity: food.quantity || 0,
        remainingItems: food.quantity || 0
      }))
    );

    // Filter items by name
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

      const response = await api.post(`/get/menu/items?${params.toString()}`);
      setCategories(response.data);
    } catch (error) {
    }
  };

  const [categories, setCategories] = useState<Category[]>([]);

  return (
    <div className="h-full w-full bg-white dark:bg-[#201a18] m-0 p-0">
      <div className="p-[20px] ml-[30px] mr-[30px]">
        {/* Title and Add Item Section */}
        <div className="flex justify-between items-center mb-[25px]">
          <b className="text-[20px] font-sans">
            Items
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
              className="flex items-center gap-2 px-3 py-1 rounded-[4px] bg-[#313131] border-[#737373] border-[1px] border-solid 
                    cursor-pointer text-[12px] font-sans"
              onClick={onAddItemButtonClick}
            >
              <IoMdAdd className="w-[18px] h-[18px] text-[#cbcbcb]" />
              <div className="leading-[18px] font-sans text-white">Add item</div>
            </div>
          </div>
        </div>
        {/* Total Items */}
        <div className="relative leading-[22px] font-sans mb-4">
          Total item - {remoteCategories.reduce((total, category) => total + (category.foods?.length || 0), 0)}
        </div>

        {/* Categories Section */}
        <section className="mb-[15px] overflow-hidden relative">
          <div className="flex items-center">
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
          </div>
        </section>

        {/* Menu Items Grid - Using filteredItems */}
        <div className="grid grid-cols-1 min-[433px]:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
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
                    ${(item.quantity ?? 0) > 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'}`}>
                    {(item.quantity ?? 0) > 0 ? 'In Stock' : 'Out of Stock'}
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
                    {item.quantity || 0}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-4 text-gray-500 font-sans">
              No items found matching "{searchQuery}"
            </div>
          )}
        </div>
      </div>

      {/* Add the modal */}
      {showAddInventory && (
        <AddInventory 
          onClose={handleAddInventoryClose}
          onInventoryUpdated={() => {
            refreshInventory();
            setShowAddInventory(false);
          }}
          branchId={selectedBranchId || userProfile.branchId}
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