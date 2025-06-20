import { FunctionComponent, useState, useRef, useCallback, useEffect } from "react";
import { Button, Menu, MenuItem } from "@mui/material";
import { FaChevronDown } from "react-icons/fa";
import { useMenuCategories } from '../../hooks/useMenuCategories';
import { useAddItemToCategory } from '../../hooks/useAddItemToCategory';
import { useAddCategory } from '../../hooks/useAddCategory';
import { IoIosCloseCircleOutline } from "react-icons/io";
import { useTranslation } from 'react-i18next';
import { useLanguageChange } from '../../hooks/useLanguageChange';
import { api, API_ENDPOINTS } from '../../services/api';
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
  extrasTitle: string;
  inventoryId: string;
  new?: boolean;
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

const AddInventory: FunctionComponent<AddInventoryProps> = ({ 
  onClose,
  onInventoryUpdated,
  branchId,
  preSelectedCategory
}) => {
  const { categories, isLoading } = useMenuCategories();
  const { userProfile } = useUserProfile();

  const [textfieldOpen, setTextfieldOpen] = useState(false);
  const [textfieldAnchorEl, setTextfieldAnchorEl] = useState<null | HTMLElement>(null);
  const [categoryAnchorEl, setCategoryAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCategory, setSelectedCategory] = useState(preSelectedCategory?.subCategory || "");
  const [selectedMainCategory, setSelectedMainCategory] = useState(preSelectedCategory?.mainCategory || "");
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState(preSelectedCategory?.mainCategoryId || "");
  const [mainCategories, setMainCategories] = useState<Array<{ id: string; categoryName: string }>>([]);
  const [mainCategoryAnchorEl, setMainCategoryAnchorEl] = useState<null | HTMLElement>(null);
  const [isLoadingMainCategories, setIsLoadingMainCategories] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newCategoryImage, setNewCategoryImage] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [available, setAvailable] = useState(true);
  const [shortDetails, setShortDetails] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [newCategoryFile, setNewCategoryFile] = useState<File | null>(null);
  const { addItem, isLoading: isAddingItem } = useAddItemToCategory();
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
          console.error('Missing restaurant ID in userProfile:', userProfile);
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
        console.error('Failed to fetch inventory items:', {
          error: error,
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        setInventoryItems([]);
      }
    };

    if (showExtrasForm) {
      console.log('Extras form opened, fetching inventory...');
      fetchInventoryItems();
    }
  }, [showExtrasForm, userProfile.restaurantId]);

  const handleTextfieldClick = (event: React.MouseEvent<HTMLElement>) => {
    setTextfieldAnchorEl(event.currentTarget);
    setTextfieldOpen(true);
  };

  const handleTextfieldClose = () => {
    setTextfieldAnchorEl(null);
    setTextfieldOpen(false);
  };

  const handleCategoryClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setCategoryAnchorEl(event.currentTarget);
  };

  const handleCategoryClose = (category?: string) => {
    if (category) {
      setSelectedCategory(category);
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
    if (showCategoryForm) {
      // New category: require newCategory, newCategoryImage, itemName, shortDetails, selectedImage, price
      return (
        newCategory.trim() !== '' &&
        newCategoryImage !== null &&
        itemName.trim() !== '' &&
        shortDetails.trim() !== '' &&
        selectedImage !== null &&
        price.trim() !== ''
      );
    } else if (preSelectedCategory) {
      // Pre-selected category: only require itemName, shortDetails, selectedImage, price
      return (
        itemName.trim() !== '' &&
        shortDetails.trim() !== '' &&
        selectedImage !== null &&
        price.trim() !== ''
      );
    } else {
      // Existing category: require selectedCategory, itemName, shortDetails, selectedImage, price, selectedMainCategory
      return (
        selectedCategory.trim() !== '' &&
        itemName.trim() !== '' &&
        shortDetails.trim() !== '' &&
        selectedImage !== null &&
        price.trim() !== '' &&
        selectedMainCategory.trim() !== ''
      );
    }
  };

  const handleExtrasAdd = (groups: ExtraGroup[]) => {
    // Store the full groups data for display
    setAddedExtrasGroups(groups);
    
    // Transform the groups into the format needed for the API
    const transformedExtras: ExtraItem[] = groups.flatMap(group =>
      group.extrasDetails.map(detail => ({
        extrasTitle: group.extrasTitle,
        inventoryId: detail.value || "",
        new: detail.isNew || false
      }))
    );

    setExtraGroups(transformedExtras);
    setExtrasModalOpen(false);
  };

  const onButtonAddItemClick = async () => {
    try {
      const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      


      // --- TRANSFORM EXTRAS TO ALWAYS INCLUDE 'new' PROPERTY ---
      const transformedExtras = extraGroups.map(extra => ({
        ...extra,
        new: typeof extra.new === 'boolean' ? extra.new : false
      }));

      if (!userProfile.restaurantId || !userProfile.branchId) {
        alert('Please log in again. Restaurant or branch information is missing.');
        return;
      }

      if (showCategoryForm) {

        await addCategory({
          foodType: newCategory,
          restaurantName: userProfile.restaurantId,
          branchName: userProfile.branchId,
          foodTypePhoto: newCategoryFile,
          foodsPhoto: photoFile,
          foods: [{
            name: itemName,
            price: price,
            description: shortDetails,
            quantity: "0",
            available: available,
            extras: transformedExtras
          }],
          mainCategory: selectedMainCategory,
          categoryId: selectedMainCategoryId,
          onSuccess: () => {
            onInventoryUpdated?.();
            onClose();
          }
        });
      } else {
        const selectedCategoryData = categories.find(cat => cat.name === selectedCategory);
        console.log('Selected Category Data:', selectedCategoryData);

        if (!selectedCategoryData) {
          alert('Selected category not found. Please try again.');
          return;
        }

        console.log('Adding item to category with extras:', {
          categoryId: selectedCategoryData.id,
          mainCategoryId: selectedMainCategoryId,
          name: itemName,
          restaurantId: userProfile.restaurantId,
          branchId: userProfile.branchId,
          extras: transformedExtras
        });
        // --- LOG FINAL PAYLOAD ---
        console.log('🚀 Final payload to API (addItem):', {
          categoryId: selectedCategoryData.id,
          name: itemName,
          price,
          description: shortDetails,
          available,
          foodPhoto: photoFile,
          mainCategoryId: selectedMainCategoryId,
          mainCategory: selectedMainCategory,
          extras: transformedExtras
        });
        await addItem({
          categoryId: selectedCategoryData.id,
          name: itemName,
          price,
          description: shortDetails,
          available,
          foodPhoto: photoFile,
          mainCategoryId: selectedMainCategoryId,
          mainCategory: selectedMainCategory,
          extras: transformedExtras,
          onSuccess: () => {
            onInventoryUpdated?.();
            onClose();
          }
        });
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
      setShowCategoryForm(false);
      setNewCategory('');
      setNewCategoryImage(null);
      setNewCategoryFile(null);
      setExtraGroups([]); // Reset extras
      
    } catch (error) {
      console.error('Failed to save item:', error);
      alert('Failed to save. Please try again.');
    }
  };

  const handleMainClose = () => {
    onInventoryUpdated?.();
    setShowCategoryForm(false);
    setNewCategory("");
    setNewCategoryImage(null);
    setNewCategoryFile(null);
    onClose?.();
  };

  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleMainCategoryClick = async (event: React.MouseEvent<HTMLDivElement>) => {
    setMainCategoryAnchorEl(event.currentTarget);
    
    // Only fetch if we haven't loaded categories yet
    if (mainCategories.length === 0) {
      await fetchMainCategories();
    }
  };

  const handleMainCategoryClose = (category?: { id: string; categoryName: string }) => {
    if (category) {
      setSelectedMainCategory(category.categoryName);
      setSelectedMainCategoryId(category.id);
    }
    setMainCategoryAnchorEl(null);
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      setSelectedCategory(newCategory.trim());
      setShowCategoryForm(false);
      setNewCategory('');
    }
  };

  const handleNewCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCategory(e.target.value);
  };

  const handleCategoryImageUpload = (file: File) => {
    setNewCategoryFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setNewCategoryImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCategoryCancel = () => {
    setShowCategoryForm(false);
  };

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
                    onClick={selectedMainCategory ? undefined : handleMainCategoryClick}
                    id="main-category-button"
                    className={`border-[#efefef] border-[1px] border-solid [outline:none] 
                             font-sans text-[13px] bg-[#fff] self-stretch rounded-[8px] 
                             flex flex-row items-center justify-between py-[14px] px-[20px] 
                             ${selectedMainCategory ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-[#e0e0e0]'}`}
                  >
                    <span>{selectedMainCategory || t('inventory.selectCategory')}</span>
                    <FaChevronDown className={`text-black text-[12px] ${selectedMainCategory ? 'opacity-50' : ''}`} />
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

                {/* Existing Subcategory Section */}
                <div className="self-stretch flex flex-col items-start justify-start gap-[1px]">
                  <b className="self-stretch relative leading-[20px] font-sans text-black">{t('inventory.subCategory')}</b>
                  {!showCategoryForm ? (
                    <div
                      ref={dropdownRef}
                      onClick={selectedCategory ? undefined : handleCategoryClick}
                      id="category-button"
                      className={`border-[#efefef] border-[1px] border-solid [outline:none] 
                               font-sans text-[13px] bg-[#fff] self-stretch rounded-[8px] 
                               flex flex-row items-center justify-between py-[14px] px-[20px] 
                               ${selectedCategory ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-[#e0e0e0]'}`}
                    >
                      <span>{selectedCategory || t('inventory.selectSubCategory')}</span>
                      <FaChevronDown className={`text-black text-[12px] ${selectedCategory ? 'opacity-50' : ''}`} />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="text"
                        value={newCategory}
                        onChange={handleNewCategoryChange}
                        placeholder={t('inventory.newCategoryName')}
                        className="flex-1 border-[#efefef] border-[1px] border-solid [outline:none] 
                                 font-sans text-[13px] bg-[#fff] rounded-[8px] 
                                 py-[14px] px-[20px]"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleCategoryCancel}
                          className="px-4 py-[14px] bg-gray-100 text-gray-600 rounded-[8px] 
                                   text-[13px] font-sans hover:bg-gray-200 
                                   transition-colors whitespace-nowrap"
                        >
                          {t('common.cancel')}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Add Category Image Section */}
                  {showCategoryForm && (
                    <div className="mt-4 w-full">
                      <div
                        className={`
                          relative w-full h-[120px] border-2 border-dashed rounded-lg
                          ${isDragging ? 'border-[#fd683e] bg-[#fff3f0]' : 'border-[#e0e0e0] bg-[#fafafa]'}
                          transition-colors duration-200 cursor-pointer
                        `}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragging(false);
                          const file = e.dataTransfer.files[0];
                          if (file && file.type.startsWith('image/')) {
                            handleCategoryImageUpload(file);
                          }
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          setIsDragging(false);
                        }}
                      >
                        {newCategoryImage ? (
                          <div className="relative w-full h-full group">
                            <img
                              src={newCategoryImage}
                              alt="Category Preview"
                              className="w-full h-full object-contain rounded-lg"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-lg flex items-center justify-center">
                              <button
                                onClick={() => {
                                  setNewCategoryImage(null);
                                  setNewCategoryFile(null);
                                }}
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
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleCategoryImageUpload(file);
                                }
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="text-gray-400 text-center text-sm font-sans">
                              <p>{t('inventory.dragAndDrop')}</p>
                              <p>{t('inventory.or')} {t('inventory.browseFiles')}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <Menu
                    anchorEl={categoryAnchorEl}
                    open={Boolean(categoryAnchorEl)}
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
                    {isLoading ? (
                      <MenuItem disabled>{t('common.loading')}</MenuItem>
                    ) : (
                      [
                        ...categories.map((category) => (
                          <MenuItem 
                            key={category.id} 
                            onClick={() => handleCategoryClose(category.name)}
                            sx={{
                              backgroundColor: selectedCategory === category.name ? '#f5f5f5' : 'transparent',
                            }}
                            role="option"
                            aria-selected={selectedCategory === category.name}
                          >
                            {category.name}
                          </MenuItem>
                        )),
                        <MenuItem
                          key="add-new"
                          sx={{
                            borderTop: '1px solid #efefef',
                            color: '#fd683e !important',
                          }}
                          onClick={() => {
                            setShowCategoryForm(true);
                            setCategoryAnchorEl(null);
                          }}
                          role="option"
                        >
                          + {t('inventory.addCategory')}
                        </MenuItem>
                      ]
                    )}
                  </Menu>
                </div>
              </>
            )}
            <div className="self-stretch flex flex-col items-start justify-start gap-[1px]">
              <b className="self-stretch relative leading-[20px] font-sans">{t('inventory.name')}</b>
              <input
                className="border-[#efefef] border-[1px] border-solid [outline:none] bg-[#fff] self-stretch rounded-[8px] flex flex-row items-center justify-start py-[14px] px-[20px] text-black font-sans"
                placeholder={t('inventory.name')}
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
            </div>
            <div className="self-stretch flex flex-row items-start justify-center flex-wrap content-start gap-[23px]">
              <div className="flex-1 flex flex-col items-start justify-start gap-[6px]">
                <div className="self-stretch relative leading-[22px] font-sans font-bold">
                  {t('inventory.description')}
                </div>
                <input
                  className="border-[#f6f6f6] border-[1px] border-solid [outline:none] font-sans text-[13px] bg-[#fff] self-stretch rounded-[3px] overflow-hidden flex flex-row items-center justify-start py-[12px] px-[20px] text-black"
                  placeholder={t('inventory.description')}
                  type="text"
                  value={shortDetails}
                  onChange={(e) => setShortDetails(e.target.value)}
                />
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
              <div className="self-stretch relative leading-[22px] font-sans font-bold">{t('inventory.price')}</div>
              <div className="self-stretch shadow-[0px_0px_2px_rgba(23,_26,_31,_0.12),_0px_0px_1px_rgba(23,_26,_31,_0.07)] rounded-[6px] bg-[#f6f6f6] border-[#fff] border-[1px] border-solid flex flex-row items-center justify-start py-[1px] px-[0px]">
                <div className="w-[64px] rounded-[6px] bg-[#f6f6f6] border-[#fff] border-[1px] border-solid box-border overflow-hidden shrink-0 flex flex-row items-center justify-center py-[16px] px-[18px]">
                  <div className="relative leading-[20px] font-sans text-black">GHS</div>
                </div>
                <input
                  className="border-[#fff] border-[1px] border-solid [outline:none] font-sans text-[13px] bg-[#fff] flex-1 rounded-[6px] flex flex-row items-center justify-start py-[15px] px-[20px] text-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="25.00"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
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
                         ${!isFormValid() ? 'opacity-50 cursor-not-allowed bg-gray-400' : 'hover:bg-[#e54d0e]'}
                         transition-all duration-200`}
              onClick={onButtonAddItemClick}
              disabled={!isFormValid()}
            >
              <div className="relative text-[10px] leading-[16px] text-[#fff] text-left font-sans">
                {isLoading ? t('settings.restaurant.saving') : t('common.save')}
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
      />
    </>
  );
};

export default AddInventory;