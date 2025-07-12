import { FunctionComponent, useState, useRef, useCallback, useEffect } from "react";
import { Button, Menu, MenuItem } from "@mui/material";
import { FaChevronDown } from "react-icons/fa";
import { useMenuCategories } from '../../hooks/useMenuCategories';
import { useAddItemToCategory } from '../../hooks/useAddItemToCategory';
import { useAddCategory } from '../../hooks/useAddCategory';
import { IoIosCloseCircleOutline } from "react-icons/io";
import { useTranslation } from 'react-i18next';
import { useLanguageChange } from '../../hooks/useLanguageChange';
import { api, API_ENDPOINTS, addItemToCategory } from '../../services/api';
import Switch from '@mui/material/Switch';
import { useUserProfile } from '../../hooks/useUserProfile';
import AddExtrasModal, { ExtraGroup } from '../../components/AddExtrasModal';

interface AddInventoryProps {
  onClose: () => void;
  onInventoryUpdated?: () => void;
  branchId: string | null;
  preSelectedCategory?: {
    mainCategory: string;
    mainCategoryId: string;
    subCategory: string;
  };
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
  extras?: ExtraItem[];
  foodImage: FoodImage;
}

interface CategoryTableItem {
  categoryImage: string | null;
  categoryName: string;
  created_at: number;
  id: string;
}

interface CategoryCard {
  id: string;
  image: string;
  name: string;
  itemCount: number;
  categoryTable: CategoryTableItem[];
  foods: FoodItem[];
}

interface MenuCategory {
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

interface InventoryItem {
  id: string;
  foodName: string;
  foodPrice: number;
}

interface ExtraItem {
  delika_extras_table_id: string;
}

interface AddItemParams {
  categoryId: string;
  name: string;
  price: string;
  description: string;
  available: boolean;
  foodPhoto: File | null;
  mainCategoryId: string;
  mainCategory: string;
  extras: ExtraItem[];
  onSuccess?: () => void;
}

interface AddCategoryParams {
  foodType: string;
  restaurantName: string;
  branchName: string;
  foodTypePhoto: File | null;
  foodsPhoto: File | null;
  foods: {
    name: string;
    price: string;
    description: string;
    quantity: string;
    available: boolean;
    extras: ExtraItem[];
  }[];
  mainCategory: string;
  categoryId: string;
  onSuccess?: () => void;
}

// Add interface for subcategory from API response
interface SubCategory {
  Name: string;
  taxonomyID: string;
}

// Update the main category interface to include subCat
interface MainCategory {
  id: string;
  categoryName: string;
  subCat: SubCategory[];
  categoryImage?: {
    url: string;
    [key: string]: any;
  };
}

const AddInventory: FunctionComponent<AddInventoryProps> = ({ 
  onClose,
  onInventoryUpdated,
  branchId,
  preSelectedCategory
}) => {
  const { categories, isLoading } = useMenuCategories();
  const { userProfile } = useUserProfile();
  const [isAddingItem, setIsAddingItem] = useState(false);

  const [categoryAnchorEl, setCategoryAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCategory, setSelectedCategory] = useState(preSelectedCategory?.subCategory || "");
  const [selectedMainCategory, setSelectedMainCategory] = useState(preSelectedCategory?.mainCategory || "");
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState(preSelectedCategory?.mainCategoryId || "");
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  // Add state for subcategories from selected main category
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [mainCategoryAnchorEl, setMainCategoryAnchorEl] = useState<null | HTMLElement>(null);
  const [isLoadingMainCategories, setIsLoadingMainCategories] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [available, setAvailable] = useState(true);
  const [shortDetails, setShortDetails] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const { addItem, isLoading: isAddingToCategory } = useAddItemToCategory();
  const { addCategory, isLoading: isAddingCategory } = useAddCategory();
  const { t } = useTranslation();
  useLanguageChange();

  // Add new state for extrasAvailable
  const [extrasAvailable, setExtrasAvailable] = useState(false);

  // Add new state for showExtrasForm
  const [showExtrasForm, setShowExtrasForm] = useState(false);

  // Add new state for extrasModalOpen
  const [extrasModalOpen, setExtrasModalOpen] = useState(false);

  // Add new state for inventory items
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [selectedExtra, setSelectedExtra] = useState('');
  const [selectedVariant, setSelectedVariant] = useState('');
  const [extraPrice, setExtraPrice] = useState('');
  const [extraGroups, setExtraGroups] = useState<ExtraItem[]>([]);

  // Add state to store and display extras groups
  const [addedExtrasGroups, setAddedExtrasGroups] = useState<ExtraGroup[]>([]);

  const fetchMainCategories = async () => {
    setIsLoadingMainCategories(true);
    try {
      const response = await api.get(API_ENDPOINTS.MENU.GET_ALL_CATEGORIES);
      const categories = response.data || [];
      setMainCategories(categories);
    } catch (error: any) {
      setMainCategories([]);
    } finally {
      setIsLoadingMainCategories(false);
    }
  };

  useEffect(() => {
    const fetchInventoryItems = async () => {
      try {
        if (!userProfile.restaurantId) {
          return;
        }

        const response = await api.get('/get/inventory/by/restaurant', {
          params: {
            restaurantId: userProfile.restaurantId
          }
        });

        if (!response.data) {
          setInventoryItems([]);
          return;
        }

        if (Array.isArray(response.data)) {
          if (response.data.length > 0) {
            setInventoryItems(response.data);
          } else {
            setInventoryItems([]);
          }
        } else {
          setInventoryItems([]);
        }
      } catch (error: any) {
        setInventoryItems([]);
      }
    };

    if (showExtrasForm) {
      fetchInventoryItems();
    }
  }, [showExtrasForm, userProfile.restaurantId]);

  // Handle preselected category - load main categories and set subcategories
  useEffect(() => {
    const handlePreSelectedCategory = async () => {
      if (preSelectedCategory) {
        // If main categories are not loaded yet, fetch them
        if (mainCategories.length === 0) {
          await fetchMainCategories();
        }
        
        // Once we have main categories, find the preselected one and set its subcategories
        const mainCat = mainCategories.find(cat => cat.id === preSelectedCategory.mainCategoryId);
        if (mainCat && mainCat.subCat) {
          setSubCategories(mainCat.subCat);
        }
      }
    };

    handlePreSelectedCategory();
  }, [preSelectedCategory, mainCategories]);

  // Removed unused textfield handlers

  const handleCategoryClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (preSelectedCategory) return; // Don't open menu if preselected
    setCategoryAnchorEl(event.currentTarget);
  };

  const handleCategoryClose = (categoryName?: string) => {
    if (preSelectedCategory) return; // Don't update if preselected
    if (categoryName) {
      setSelectedCategory(categoryName);
    }
    setCategoryAnchorEl(null);
  };

  const handleImageUpload = (file: File) => {
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const isFormValid = () => {
    if (preSelectedCategory) {
      // Pre-selected category: only require itemName, selectedImage, price
      return (
        itemName.trim() !== '' &&
        selectedImage !== null &&
        price.trim() !== ''
      );
    } else {
      // Regular case: require selectedCategory, itemName, selectedImage, price, selectedMainCategory
      return (
        selectedCategory.trim() !== '' &&
        itemName.trim() !== '' &&
        selectedImage !== null &&
        price.trim() !== '' &&
        selectedMainCategory.trim() !== ''
      );
    }
  };

  const handleExtrasAdd = (groups: ExtraGroup[]) => {
    // Store the full groups data for display
    setAddedExtrasGroups(groups);
    
    // Transform the groups to only include delika_extras_table_id - same as EditInventoryModal.tsx
    const transformedExtras: ExtraItem[] = groups.map(group => ({
      delika_extras_table_id: group.id
    }));

    setExtraGroups(transformedExtras);
    setExtrasModalOpen(false);
  };

  const onButtonAddItemClick = async () => {
    // Prevent multiple submissions
    if (isAddingItem || isAddingToCategory || isAddingCategory) {
      return;
    }

    try {
      const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      
      // Add loading state
      setIsAddingItem(true);

      if (!userProfile.restaurantId || !userProfile.branchId) {
        alert('Please log in again. Restaurant or branch information is missing.');
        return;
      }

      // If we're adding from the Inventory page (preSelectedCategory exists)
      if (preSelectedCategory) {
        // Create FormData with the new structure
        const formData = new FormData();
        
        // Group food data into foods object - always keep extras as empty array
        const foodsData = {
          name: itemName,
          price: price,
          extras: [], // Always empty array
          quantity: "1",
          available: available,
          description: shortDetails
        };
        formData.append('foods', JSON.stringify(foodsData));
        
        // Add extrasNew field only if extras are selected
        if (extraGroups.length > 0) {
          formData.append('extrasNew', JSON.stringify(extraGroups));
        }
        
        // Add the photo file
        if (photoFile) {
          formData.append('foodPhoto', photoFile);
        }
        
        // Add other required fields
        formData.append('branchName', userProfile.branchId);
        formData.append('categoryId', preSelectedCategory.mainCategoryId);
        formData.append('mainCategoryId', ''); // Empty as shown in your example
        formData.append('restaurantName', userProfile.restaurantId);

        // Use ADD_ITEM endpoint with the existing service function
        const response = await addItemToCategory(formData);
        
        onInventoryUpdated?.();
        onClose?.();
      } 
      // If we're adding a new item to a category
      else {
        // Find the selected main category to get its image
        const selectedMainCategoryData = mainCategories.find(cat => cat.id === selectedMainCategoryId);
        if (!selectedMainCategoryData) {
          alert('Main category not found. Please try again.');
          return;
        }

        // Fetch the category image as a file
        let categoryImageFile = null;
        if (selectedMainCategoryData.categoryImage?.url) {
          try {
            const imageResponse = await fetch(selectedMainCategoryData.categoryImage.url);
            const imageBlob = await imageResponse.blob();
            categoryImageFile = new File([imageBlob], 'category-image.jpg', { type: imageBlob.type });
          } catch (error) {
            // Silent error handling for image fetch
          }
        }

        // Create FormData for file uploads
        const formData = new FormData();
        formData.append('foodType', selectedCategory);
        formData.append('restaurantName', userProfile.restaurantId);
        formData.append('branchName', userProfile.branchId);
        formData.append('mainCategory', selectedMainCategory);
        formData.append('categoryId', selectedMainCategoryId);
        
        if (categoryImageFile) {
          formData.append('foodTypePhoto', categoryImageFile);
        }
        if (photoFile) {
          formData.append('foodsPhoto', photoFile);
        }
        
        // Add foods data as JSON string - always keep extras as empty array
        formData.append('foods', JSON.stringify([{
          name: itemName,
          price,
          description: shortDetails,
          quantity: "0",
          available,
          extras: [] // Always empty array
        }]));

        // Add extrasNew field only if extras are selected
        if (extraGroups.length > 0) {
          formData.append('extrasNew', JSON.stringify(extraGroups));
        }

        const response = await api.post('/create/new/category', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        onInventoryUpdated?.();
        onClose?.();
      }

      // Reset all states
      setItemName('');
      setPrice('');
      setAvailable(true);
      setShortDetails('');
      setSelectedImage(null);
      setSelectedCategory('');
      setSelectedMainCategory('');
      setSelectedMainCategoryId('');
      setExtraGroups([]);
      
    } catch (error) {
      alert('Failed to save. Please try again.');
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleMainClose = () => {
    onInventoryUpdated?.();
    onClose?.();
  };

  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleMainCategoryClick = async (event: React.MouseEvent<HTMLDivElement>) => {
    if (preSelectedCategory) return; // Don't open menu if preselected
    setMainCategoryAnchorEl(event.currentTarget);
    
    // Only fetch if we haven't loaded categories yet
    if (mainCategories.length === 0) {
      await fetchMainCategories();
    }
  };

  const handleMainCategoryClose = (category?: MainCategory) => {
    if (preSelectedCategory) return; // Don't update if preselected
    if (category) {
      setSelectedMainCategory(category.categoryName);
      setSelectedMainCategoryId(category.id);
      // Set subcategories from the selected main category
      setSubCategories(category.subCat || []);
      // Clear selected subcategory when main category changes
      setSelectedCategory('');
    }
    setMainCategoryAnchorEl(null);
  };

  // Removed category form handlers as they're no longer needed

  const renderAddedExtras = () => {
    if (!extrasAvailable || addedExtrasGroups.length === 0) return null;

    return (
      <div className="self-stretch flex flex-col items-start justify-start gap-[4px]">
        <div className="self-stretch relative leading-[20px] font-sans font-medium text-sm">Added Extras</div>
        <div className="w-full bg-gray-50 rounded-lg p-3">
          <div className="grid grid-cols-2 gap-2">
            {addedExtrasGroups.map((group) => (
              <div key={group.id} className="bg-white border border-gray-100 rounded-md overflow-hidden">
                <div className="bg-[#201a18] text-white px-2.5 py-1.5 text-xs font-medium">
                  {group.extrasTitle}
                </div>
                <div className="p-2">
                  <div className="flex flex-wrap gap-1">
                    {group.extrasDetails.map((extra) => (
                      <div
                        key={extra.foodName}
                        className="bg-[#fff3ea] text-[#fd683e] px-2 py-0.5 rounded text-[10px] font-medium"
                      >
                        {extra.foodName}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setExtrasModalOpen(true)}
            className="w-full mt-2 py-1.5 px-3 border border-[#fd683e] border-dashed text-[#fd683e] rounded-md text-xs font-medium hover:bg-[#fff3ea] transition-colors"
          >
            Edit Extras
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Backdrop with blur effect */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={handleMainClose}
      />

      {/* Modal Content */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div 
          className="bg-white rounded-lg p-6 max-w-[562px] w-full max-h-[90vh] overflow-y-auto relative
                     shadow-[0_0_15px_rgba(0,0,0,0.2)] animate-[fadeIn_0.3s_ease-out]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button 
            onClick={handleMainClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 
                       transition-colors duration-200 bg-transparent"
          >
            <IoIosCloseCircleOutline className="w-7 h-7" />
          </button>

          {/* Add Inventory Modal form content*/}
          <div className="flex flex-col items-start justify-start gap-[19px] text-[13px] text-[#686868] font-sans">
            <b className="relative text-[25px] text-[#201a18] font-sans">
              {selectedCategory ? `${t('inventory.addItemTo')} ${selectedCategory}` : t('inventory.addNewItem')}
            </b>
            
            {/* Only show category selection if no preSelectedCategory */}
            {!preSelectedCategory && (
              <>
                {/* Main Category Section */}
                <div className="self-stretch flex flex-col items-start justify-start gap-[1px]">
                  <b className="self-stretch relative leading-[20px] font-sans text-black">{t('inventory.category')}</b>
                  <div
                    ref={dropdownRef}
                    onClick={handleMainCategoryClick}
                    id="main-category-button"
                    className={`border-[#efefef] border-[1px] border-solid [outline:none] 
                             font-sans text-[13px] bg-[#fff] self-stretch rounded-[8px] 
                             flex flex-row items-center justify-between py-[14px] px-[20px] 
                             ${preSelectedCategory ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-[#e0e0e0]'}`}
                  >
                    <span>{selectedMainCategory || t('inventory.selectCategory')}</span>
                    <FaChevronDown className={`text-black text-[12px] ${preSelectedCategory ? 'opacity-50' : ''}`} />
                  </div>

                  <Menu
                    anchorEl={mainCategoryAnchorEl}
                    open={Boolean(mainCategoryAnchorEl)}
                    onClose={() => handleMainCategoryClose()}
                    PaperProps={{
                      sx: {
                        mt: 1,
                        width: dropdownRef.current?.offsetWidth,
                        maxWidth: 'unset',
                        maxHeight: '400px',
                        boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.1)',
                        borderRadius: '8px',
                        '& .MuiList-root': {
                          padding: '8px 0',
                          width: '100%',
                        },
                        '& .MuiMenuItem-root': {
                          fontFamily: 'Inter',
                          fontSize: '13px',
                          padding: '10px 20px',
                          color: '#686868',
                          width: '100%',
                          '&:hover': {
                            backgroundColor: '#f5f5f5',
                          },
                        },
                      },
                    }}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'left',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'left',
                    }}
                    keepMounted
                    disablePortal
                    MenuListProps={{
                      'aria-labelledby': 'main-category-button',
                      role: 'listbox',
                    }}
                  >
                    {isLoadingMainCategories ? (
                      <MenuItem disabled>{t('common.loading')}</MenuItem>
                    ) : (
                      mainCategories.map((category) => (
                        <MenuItem 
                          key={category.id} 
                          onClick={() => handleMainCategoryClose(category)}
                          sx={{
                            backgroundColor: selectedMainCategory === category.categoryName ? '#f5f5f5' : 'transparent',
                          }}
                          role="option"
                          aria-selected={selectedMainCategory === category.categoryName}
                        >
                          {category.categoryName}
                        </MenuItem>
                      ))
                    )}
                  </Menu>
                </div>

                {/* Updated Subcategory Section */}
                <div className="self-stretch flex flex-col items-start justify-start gap-[1px]">
                  <b className="self-stretch relative leading-[20px] font-sans text-black">{t('inventory.subCategory')}</b>
                  <div className="flex flex-col w-full">
                    <div
                      ref={dropdownRef}
                      onClick={handleCategoryClick}
                      id="category-button"
                      className={`border-[#efefef] border-[1px] border-solid [outline:none] 
                               font-sans text-[13px] bg-[#fff] self-stretch rounded-[8px] 
                               flex flex-row items-center justify-between py-[14px] px-[20px] 
                               ${preSelectedCategory || !selectedMainCategory ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-[#e0e0e0]'}`}
                    >
                      <span>
                        {selectedCategory || 
                         (!selectedMainCategory ? 'Please select a main category first' : t('inventory.selectSubCategory'))}
                      </span>
                      <FaChevronDown className={`text-black text-[12px] ${preSelectedCategory || !selectedMainCategory ? 'opacity-50' : ''}`} />
                    </div>
                    <span className="text-xs text-gray-500 mt-1 font-sans">
                      {selectedMainCategory 
                        ? `Available subcategories for ${selectedMainCategory}` 
                        : 'Select a main category to see available subcategories'}
                    </span>
                  </div>

                  <Menu
                    anchorEl={categoryAnchorEl}
                    open={Boolean(categoryAnchorEl) && !preSelectedCategory && selectedMainCategory.length > 0}
                    onClose={() => handleCategoryClose()}
                    PaperProps={{
                      sx: {
                        mt: 1,
                        width: dropdownRef.current?.offsetWidth,
                        maxWidth: 'unset',
                        boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.1)',
                        borderRadius: '8px',
                        '& .MuiList-root': {
                          padding: '8px 0',
                          width: '100%',
                        },
                        '& .MuiMenuItem-root': {
                          fontFamily: 'Inter',
                          fontSize: '13px',
                          padding: '10px 20px',
                          color: '#686868',
                          width: '100%',
                          '&:hover': {
                            backgroundColor: '#f5f5f5',
                          },
                        },
                      },
                    }}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'left',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'left',
                    }}
                    keepMounted
                    disablePortal
                    MenuListProps={{
                      'aria-labelledby': 'category-button',
                      role: 'listbox',
                    }}
                  >
                    {subCategories.length === 0 ? (
                      <MenuItem disabled>No subcategories available</MenuItem>
                    ) : (
                      subCategories.map((subCategory) => (
                        <MenuItem 
                          key={subCategory.taxonomyID || subCategory.Name} 
                          onClick={() => handleCategoryClose(subCategory.Name)}
                          sx={{
                            backgroundColor: selectedCategory === subCategory.Name ? '#f5f5f5' : 'transparent',
                          }}
                          role="option"
                          aria-selected={selectedCategory === subCategory.Name}
                        >
                          {subCategory.Name}
                        </MenuItem>
                      ))
                    )}
                  </Menu>
                </div>
              </>
            )}
            <div className="self-stretch flex flex-col items-start justify-start gap-[1px]">
              <b className="self-stretch relative leading-[20px] font-sans">
                {t('inventory.name')} <span className="text-red-500">*</span>
              </b>
              <input
                className="border-[#efefef] border-[1px] border-solid [outline:none] bg-[#fff] self-stretch rounded-[8px] flex flex-row items-center justify-start py-[14px] px-[20px] text-black font-sans"
                placeholder={t('inventory.placeholders.name')}
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
              />
              <span className="text-xs text-gray-500 mt-1 font-sans">Examples: Jollof Rice, White Rice, Fried Rice, Banku, Waakye</span>
            </div>
            <div className="self-stretch flex flex-row items-start justify-center flex-wrap content-start gap-[23px]">
              <div className="flex-1 flex flex-col items-start justify-start gap-[6px]">
                <div className="self-stretch relative leading-[22px] font-sans font-bold">
                  {t('inventory.description')}
                </div>
                <input
                  className="border-[#f6f6f6] border-[1px] border-solid [outline:none] font-sans text-[13px] bg-[#fff] self-stretch rounded-[3px] overflow-hidden flex flex-row items-center justify-start py-[12px] px-[20px] text-black"
                  placeholder={t('inventory.placeholders.description')}
                  type="text"
                  value={shortDetails}
                  onChange={(e) => setShortDetails(e.target.value)}
                />
                <span className="text-xs text-gray-500 mt-1 font-sans">Optional - Add any special notes or details about the item</span>
              </div>
              <div className="flex-1 flex flex-col items-start justify-start gap-[6px]">
                <div className="self-stretch relative leading-[22px] font-sans font-bold">
                  {t('inventory.uploadImage')}
                </div>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`
                    relative w-full h-[162px] border-2 border-dashed rounded-lg
                    ${isDragging ? 'border-[#fd683e] bg-[#fff3f0]' : 'border-[#e0e0e0] bg-[#fafafa]'}
                    transition-colors duration-200 cursor-pointer
                  `}
                >
                  {selectedImage ? (
                    <div className="relative w-full h-full group">
                      <img
                        src={selectedImage}
                        alt="Preview"
                        className="w-full h-full object-contain rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-lg flex items-center justify-center">
                        <button
                          onClick={() => setSelectedImage(null)}
                          className="opacity-0 group-hover:opacity-100 bg-white text-gray-700 px-3 py-1 rounded-md text-sm"
                        >
                          {t('common.delete')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileInput}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="text-gray-400 text-center font-sans">
                        <p>{t('inventory.dragAndDrop')}</p>
                        <p>{t('inventory.or')} {t('inventory.browseFiles')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="self-stretch flex flex-col items-start justify-start gap-[8px]">
              <div className="self-stretch relative leading-[22px] font-sans font-bold">
                {t('inventory.price')} <span className="text-red-500">*</span>
              </div>
              <div className="self-stretch shadow-[0px_0px_2px_rgba(23,_26,_31,_0.12),_0px_0px_1px_rgba(23,_26,_31,_0.07)] rounded-[6px] bg-[#f6f6f6] border-[#fff] border-[1px] border-solid flex flex-row items-center justify-start py-[1px] px-[0px]">
                <div className="w-[64px] rounded-[6px] bg-[#f6f6f6] border-[#fff] border-[1px] border-solid box-border overflow-hidden shrink-0 flex flex-row items-center justify-center py-[16px] px-[18px]">
                  <div className="relative leading-[20px] font-sans text-black">GHS</div>
                </div>
                <input
                  className="border-[#fff] border-[1px] border-solid [outline:none] font-sans text-[13px] bg-[#fff] flex-1 rounded-[6px] flex flex-row items-center justify-start py-[15px] px-[20px] text-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder={t('inventory.placeholders.price')}
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
              {price.trim() === '' && (
                <span className="text-xs text-red-500 mt-1">{t('')}</span>
              )}
            </div>
            <div className="self-stretch flex flex-col items-start justify-start gap-[8px]">
              <div className="flex flex-row items-center justify-between w-full mb-2">
                <span className="relative leading-[22px] font-sans">Available</span>
                <Switch
                  checked={available}
                  onChange={(e) => setAvailable(e.target.checked)}
                  color="primary"
                  inputProps={{ 'aria-label': 'Available switch' }}
                />
              </div>
              <div className="flex flex-row items-center justify-between w-full">
                <span className="relative leading-[22px] font-sans">Extras available</span>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={extrasAvailable}
                    onChange={(e) => setExtrasAvailable(e.target.checked)}
                    color="primary"
                    inputProps={{ 'aria-label': 'Extras available switch' }}
                  />
                  {extrasAvailable && addedExtrasGroups.length === 0 && (
                    <button
                      className="px-4 py-1 bg-[#fd4d4d] text-white rounded text-sm font-sans hover:bg-[#e54d0e] transition-colors"
                      onClick={() => setExtrasModalOpen(true)}
                    >
                      Add Extras
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Add the extras display section */}
            {renderAddedExtras()}

            <button
              className={`cursor-pointer border-[#f5fcf8] border-[1px] border-solid py-[9px] px-[90px] 
                         bg-[#fd683e] self-stretch rounded-[4px] overflow-hidden 
                         flex flex-row items-center justify-center mt-4
                         ${!isFormValid() || isAddingItem ? 'opacity-50 cursor-not-allowed bg-gray-400' : 'hover:bg-[#e54d0e]'}
                         transition-all duration-200`}
              onClick={onButtonAddItemClick}
              disabled={!isFormValid() || isAddingItem}
            >
              <div className="relative text-[10px] leading-[16px] text-[#fff] text-left font-sans flex items-center gap-2">
                {isAddingItem ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('settings.restaurant.saving')}
                  </>
                ) : (
                  t('common.save')
                )}
              </div>
            </button>
          </div>
        </div>
      </div>

      <AddExtrasModal
        open={extrasModalOpen}
        onClose={() => setExtrasModalOpen(false)}
        onAdd={handleExtrasAdd}
        initialExtras={addedExtrasGroups}
        mode="select"
      />
    </>
  );
};

export default AddInventory;