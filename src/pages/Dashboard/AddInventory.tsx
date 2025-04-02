import { FunctionComponent, useState, useRef, useCallback } from "react";
import { Button, Menu, MenuItem } from "@mui/material";
import { FaChevronDown } from "react-icons/fa";
import { useMenuCategories } from '../../hooks/useMenuCategories';
import { useAddItemToCategory } from '../../hooks/useAddItemToCategory';
import { useAddCategory } from '../../hooks/useAddCategory';
import { IoIosCloseCircleOutline } from "react-icons/io";

interface AddInventoryProps {
  onClose: () => void;
  onInventoryUpdated?: () => void;
  branchId: string | null;
}

interface AddItemParams {
  name: string;
  price: string;
  description: string;
  available: boolean;
  // ... other properties ...
}

const AddInventory: FunctionComponent<AddInventoryProps> = ({ 
  onClose,
  onInventoryUpdated,
  branchId
}) => {
  const { categories, isLoading } = useMenuCategories();
  const [textfieldOpen, setTextfieldOpen] = useState(false);
  const [textfieldAnchorEl, setTextfieldAnchorEl] = useState<null | HTMLElement>(null);
  const [categoryAnchorEl, setCategoryAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCategory, setSelectedCategory] = useState("");
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
    const baseValidation = 
      itemName.trim() !== '' &&
      shortDetails.trim() !== '' &&
      selectedImage !== null &&
      price.trim() !== '' &&
      available !== null;

    if (showCategoryForm) {
      return baseValidation && 
             newCategory.trim() !== '' && 
             newCategoryImage !== null;
    }

    return baseValidation && selectedCategory.trim() !== '';
  };

  const onButtonAddItemClick = async () => {
    try {
      const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      
      if (!userProfile.restaurantId || !userProfile.branchId) {
        alert('Please log in again. Restaurant or branch information is missing.');
        return;
      }

      if (showCategoryForm) {
        console.log('Adding new category with item', {
          foodType: newCategory,
          restaurantId: userProfile.restaurantId,
          branchId: userProfile.branchId
        });
        
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
            available: available
          }],
          onSuccess: () => {
            onInventoryUpdated?.();
            onClose();
          }
        });
      } else {
        const selectedCategoryData = categories.find(cat => cat.name === selectedCategory);
        if (!selectedCategoryData) {
          alert('Selected category not found. Please try again.');
          return;
        }

        console.log('Adding item to category', {
          categoryId: selectedCategoryData.id,
          name: itemName,
          restaurantId: userProfile.restaurantId,
          branchId: userProfile.branchId
        });
        
        await addItem({
          categoryId: selectedCategoryData.id,
          name: itemName,
          price,
          description: shortDetails,
          available,
          foodPhoto: photoFile,
          onSuccess: () => {
            onInventoryUpdated?.();
            onClose();
          }
        });
      }

      setItemName('');
      setPrice('');
      setAvailable(true);
      setShortDetails('');
      setSelectedImage(null);
      setSelectedCategory('');
      setShowCategoryForm(false);
      setNewCategory('');
      setNewCategoryImage(null);
      
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
    onClose?.();
  };

  const dropdownRef = useRef<HTMLDivElement>(null);

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

          {/* Modal content */}
          <div className="flex flex-col items-start justify-start gap-[19px] text-[13px] text-[#686868] font-sans">
            <b className="relative text-[25px] text-[#201a18] font-sans">Add New Item</b>
            <div className="self-stretch flex flex-col items-start justify-start gap-[1px]">
              <b className="self-stretch relative leading-[20px] font-sans text-black">Category</b>
              {!showCategoryForm ? (
                <div
                  ref={dropdownRef}
                  onClick={handleCategoryClick}
                  className="border-[#efefef] border-[1px] border-solid [outline:none] 
                           font-sans text-[13px] bg-[#fff] self-stretch rounded-[8px] 
                           flex flex-row items-center justify-between py-[14px] px-[20px] 
                           text-black cursor-pointer hover:border-[#e0e0e0]"
                >
                  <span>{selectedCategory || "Select Category"}</span>
                  <FaChevronDown className="text-black text-[12px]" />
                </div>
              ) : (
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={handleNewCategoryChange}
                    placeholder="Enter new category"
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
                      Cancel
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
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          setNewCategoryImage(e.target?.result as string);
                        };
                        reader.readAsDataURL(file);
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
                            onClick={() => setNewCategoryImage(null)}
                            className="opacity-0 group-hover:opacity-100 bg-white text-gray-700 px-3 py-1 rounded-md text-sm"
                          >
                            Remove
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
                          <p>Drag and drop category image here</p>
                          <p>or click to select</p>
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
              >
                {isLoading ? (
                  <MenuItem disabled>Loading categories...</MenuItem>
                ) : (
                  [
                    ...categories.map((category) => (
                      <MenuItem 
                        key={category.id} 
                        onClick={() => handleCategoryClose(category.name)}
                        sx={{
                          backgroundColor: selectedCategory === category.name ? '#f5f5f5' : 'transparent',
                        }}
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
                    >
                      + Add New Category
                    </MenuItem>
                  ]
                )}
              </Menu>
            </div>
            <div className="self-stretch flex flex-col items-start justify-start gap-[1px]">
              <b className="self-stretch relative leading-[20px] font-sans">Name</b>
              <input
                className="border-[#efefef] border-[1px] border-solid [outline:none] bg-[#fff] self-stretch rounded-[8px] flex flex-row items-center justify-start py-[14px] px-[20px] text-black font-sans"
                placeholder="Enter Item Name"
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
            </div>
            <div className="self-stretch flex flex-row items-start justify-center flex-wrap content-start gap-[23px]">
              <div className="flex-1 flex flex-col items-start justify-start gap-[6px]">
                <div className="self-stretch relative leading-[22px] font-sans font-bold">
                  Short Details
                </div>
                <input
                  className="border-[#f6f6f6] border-[1px] border-solid [outline:none] font-sans text-[13px] bg-[#fff] self-stretch rounded-[3px] overflow-hidden flex flex-row items-center justify-start py-[12px] px-[20px] text-black"
                  placeholder="Charlene Reed"
                  type="text"
                  value={shortDetails}
                  onChange={(e) => setShortDetails(e.target.value)}
                />
              </div>
              <div className="flex-1 flex flex-col items-start justify-start gap-[6px]">
                <div className="self-stretch relative leading-[22px] font-sans font-bold">
                  Add Image
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
                          Remove
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
                        <p>Drag and drop an image here</p>
                        <p>or click to select</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="self-stretch flex flex-col items-start justify-start gap-[8px]">
              <div className="self-stretch relative leading-[22px] font-sans font-bold">Price</div>
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
              <div className="self-stretch relative leading-[22px] font-sans">Available</div>
              <input
                type="checkbox"
                checked={available}
                onChange={(e) => setAvailable(e.target.checked)}
              />
            </div>
            <button
              className={`cursor-pointer border-[#f5fcf8] border-[1px] border-solid py-[9px] px-[90px] 
                         bg-[#fd683e] self-stretch rounded-[4px] overflow-hidden 
                         flex flex-row items-center justify-center
                         ${!isFormValid() ? 'opacity-50 cursor-not-allowed bg-gray-400' : 'hover:bg-[#e54d0e]'}
                         transition-all duration-200`}
              onClick={onButtonAddItemClick}
              disabled={!isFormValid()}
            >
              <div className="relative text-[10px] leading-[16px] text-[#fff] text-left font-sans">
                {isLoading ? 'Saving...' : 'Save'}
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddInventory;