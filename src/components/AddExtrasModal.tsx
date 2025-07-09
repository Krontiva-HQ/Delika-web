import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  SelectChangeEvent,
  TextField,
  IconButton,
  Box,
  Typography,
  CircularProgress,
  Chip,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  Paper,
} from '@mui/material';
import { X, Plus, Trash2, Edit3, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { api, getAllInventory, createExtrasItem } from '../services/api';
import { useUserProfile } from '../hooks/useUserProfile';

// Option type for dropdowns
type Option = {
  label: string;
  value: string;
  foodType: string;
  foodPrice: string;
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
  foodTypeImage: {
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
  categoryId: string;
  branchId: string;
  created_at: number;
  updatedAt: string;
};

export interface Extra {
  id: string;
  variant: string;
  new: boolean;
  title: string;
  inventoryId?: string;
  foodImage?: {
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
  } | null;
  foodDescription?: string;
  foodPrice?: string;
  foodType?: string;
  categoryId?: string;
  created_at?: number;
  updatedAt?: string;
}

export interface ExtraGroup {
  id: string;
  extrasTitle: string;
  delika_inventory_table_id?: string;
  extrasDetails: ExtraDetail[];
}

export interface ExtraDetail {
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
  value?: string;
  isNew?: boolean;
  branchId?: string;
  restaurantId?: string;
}

interface AddExtrasModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (groups: ExtraGroup[]) => void;
  initialExtras?: ExtraGroup[];
  mode?: 'select' | 'create'; // 'select' = only select, 'create' = only create, undefined = both
}

interface FoodItem {
  id: string;
  foodType: string;
  foodName: string;
  foodPrice: string;
  restaurantName: string;
  foodDescription?: string;
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
  foodTypeImage: {
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
  categoryId: string;
  branchId: string;
  created_at: number;
  updatedAt: string;
}

interface ApiPayload {
  value: string;
  new: boolean;
  extras: {
    extrasTitle: string;
    delika_inventory_table_id: string;
  }[];
  branchId: string;
  new_name: string;
  old_name: string;
  available: boolean;
  restaurantId: string;
  new_item_price: number;
  old_item_price: number;
  new_item_description: string;
  old_item_description: string;
}

const steps = [
  {
    id: 1,
    title: 'Enter extras title',
    description: 'Create a title for your extras group'
  },
  {
    id: 2,
    title: 'Add extras',
    description: 'Select and add variants to your group'
  },
  {
    id: 3,
    title: 'Review extras',
    description: 'Review and manage your extras groups'
  }
];

const AddExtrasModal: React.FC<AddExtrasModalProps> = ({
  open,
  onClose,
  onAdd,
  initialExtras = [],
  mode,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [groupTitle, setGroupTitle] = useState('');
  const [variant, setVariant] = useState('');
  const [extraGroups, setExtraGroups] = useState<ExtraGroup[]>([]);
  const [currentGroup, setCurrentGroup] = useState<ExtraGroup | null>(null);
  const [foodTypes, setFoodTypes] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [foodItemsData, setFoodItemsData] = useState<FoodItem[]>([]);
  
  // New state for variant creation
  const [newVariant, setNewVariant] = useState({
    name: '',
    price: '',
    description: ''
  });

  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);

  const { restaurantData, userProfile } = useUserProfile();

  // First useEffect to handle modal open/close
  useEffect(() => {
    if (open) {
      // If mode is 'create', open directly to step 1 (Add Variants)
      setActiveStep(mode === 'create' ? 1 : 0);
      setGroupTitle('');
      setCurrentGroup(null);
    }
  }, [open, mode]);

  // Separate useEffect to handle initial extras
  useEffect(() => {
    if (open && initialExtras?.length > 0 && foodTypes.length > 0) {
      // Group extras by their title and restore value properties
      const groupedExtras = initialExtras.reduce((acc, extra) => {
        const existingGroup = acc.find(g => g.extrasTitle === extra.extrasTitle);
        
        const processedDetails = extra.extrasDetails.map(detail => {
          const matchingFoodItem = foodTypes.find(foodItem => 
            foodItem.label === detail.foodName
          );
          
          return {
            ...detail,
            value: matchingFoodItem?.value || detail.value || ''
          };
        });
        
        if (existingGroup) {
          processedDetails.forEach(detail => {
            if (!existingGroup.extrasDetails.some(existing => existing.foodName === detail.foodName)) {
              existingGroup.extrasDetails.push(detail);
            }
          });
          return acc;
        }
        
        return [...acc, {
          id: `${Date.now()}-${Math.random().toString(36).substring(2)}`,
          extrasTitle: extra.extrasTitle,
          delika_inventory_table_id: extra.delika_inventory_table_id || '',
          extrasDetails: processedDetails
        }];
      }, [] as ExtraGroup[]);
      
      setExtraGroups(groupedExtras);
      setActiveStep(2);
    }
  }, [open, initialExtras, foodTypes.length]);

  // Separate useEffect for fetching food types
  useEffect(() => {
    const fetchFoodTypes = async () => {
      if (!open || !restaurantData.id) return;

      try {
        setLoading(true);
        const response = await getAllInventory();
        const foodTypes = response.data;
        const data = foodTypes as FoodItem[];
        
        const filteredData = data.filter(item => 
          item.restaurantName === restaurantData.id
        );
        
        const uniqueFoodTypes = filteredData.map(item => ({
          label: item.foodName,
          value: item.id,
          foodName: item.foodName,
          foodType: item.foodType,
          foodPrice: item.foodPrice,
          foodDescription: item.foodDescription || '',
          foodImage: item.foodImage,
          foodTypeImage: item.foodTypeImage,
          categoryId: item.categoryId,
          branchId: item.branchId,
          created_at: item.created_at,
          updatedAt: item.updatedAt
        }));
        
        setFoodTypes(uniqueFoodTypes);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchFoodTypes();
  }, [open, restaurantData.id]);

  useEffect(() => {
    if (open && mode === 'create') {
      setActiveStep(1);
      setGroupTitle('New Group');
      setCurrentGroup({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        extrasTitle: 'New Group',
        delika_inventory_table_id: '',
        extrasDetails: []
      });
    }
  }, [open, mode]);

  const handleNext = () => {
    if (activeStep === 0) {
      // Check if a group with this title already exists
      const existingGroup = extraGroups.find(g => 
        g.extrasTitle.toLowerCase() === groupTitle.toLowerCase()
      );
      
      if (existingGroup) {
        // If it exists, set it as current group and move to step 1
        setCurrentGroup({
          ...existingGroup,
          extrasDetails: [...existingGroup.extrasDetails] // Create a copy of the details
        });
        // Remove the existing group as we'll add an updated version later
        setExtraGroups(prevGroups => prevGroups.filter(g => g.id !== existingGroup.id));
      } else {
        // If it's a new title, create a new group
        setCurrentGroup({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          extrasTitle: groupTitle,
          delika_inventory_table_id: '',
          extrasDetails: []
        });
      }
      setActiveStep(1);
    } else if (activeStep === 1) {
      if (currentGroup) {
        // When adding/updating a group, check if one with the same title exists
        const existingGroupIndex = extraGroups.findIndex(g => 
          g.extrasTitle.toLowerCase() === currentGroup.extrasTitle.toLowerCase()
        );
        
        if (existingGroupIndex >= 0) {
          // If it exists, merge the details and ensure no duplicates
          const updatedGroups = [...extraGroups];
          const existingDetails = updatedGroups[existingGroupIndex].extrasDetails;
          
          // Add new details, avoiding duplicates and preserving isNew flag
          currentGroup.extrasDetails.forEach(detail => {
            if (!existingDetails.some(existing => existing.foodName === detail.foodName)) {
              existingDetails.push(detail);
            }
          });
          
          updatedGroups[existingGroupIndex] = {
            ...updatedGroups[existingGroupIndex],
            extrasDetails: existingDetails,
            delika_inventory_table_id: updatedGroups[existingGroupIndex].delika_inventory_table_id || currentGroup.delika_inventory_table_id
          };
          
          setExtraGroups(updatedGroups);
        } else {
          // If it's a new group, add it
          setExtraGroups([...extraGroups, currentGroup]);
        }
        
        setCurrentGroup(null);
        setGroupTitle('');
        setActiveStep(2);
      }
    }
  };

  const handleBack = () => {
    if (activeStep === 1) {
      setCurrentGroup(null);
    }
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleAddVariant = () => {
    if (currentGroup && variant) {
      const selectedOption = foodTypes.find(opt => opt.value === variant);
      
      if (selectedOption) {
        const existingVariantDetails: ExtraDetail = {
          foodName: selectedOption.label,
          foodPrice: Number(selectedOption.foodPrice),
          foodDescription: selectedOption.foodDescription || '',
          foodImage: selectedOption.foodImage,
          value: selectedOption.value,
          isNew: false  // Mark as existing variant
        };

        setCurrentGroup({
          ...currentGroup,
          delika_inventory_table_id: selectedOption.value,
          extrasDetails: [...(currentGroup.extrasDetails || []), existingVariantDetails]
        });
      }
      setVariant('');
    }
  };

  const handleRemoveVariant = (id: string) => {
    if (currentGroup) {
      setCurrentGroup({
        ...currentGroup,
        extrasDetails: currentGroup.extrasDetails.filter(extra => extra.foodName !== id)
      });
    }
  };

  const handleRemoveGroup = (id: string) => {
    if (!id) {
      return;
    }

    // Find the group to be removed
    const groupToRemove = extraGroups.find(group => group.id === id);
    if (!groupToRemove) {
      return;
    }

    // Remove this group and any other groups with the same title
    const updatedGroups = extraGroups.filter(group => 
      group.extrasTitle.toLowerCase() !== groupToRemove.extrasTitle.toLowerCase()
    );

    setExtraGroups(updatedGroups);
  };

  const handleEditGroup = (group: ExtraGroup) => {
    setCurrentGroup(group);
    setGroupTitle(group.extrasTitle);
    setExtraGroups(prevGroups => prevGroups.filter(g => g.id !== group.id));
    setActiveStep(1);
  };

  const handleAddAnotherGroup = () => {
    setGroupTitle('');
    setActiveStep(0);
  };

  const handleSave = () => {
    // Transform the groups to ensure each variant has the new flag
    const groupsWithFlags = extraGroups.map(group => ({
      ...group,
      extrasDetails: group.extrasDetails.map(detail => ({
        ...detail,
        isNew: detail.isNew || false // Ensure isNew is set
      }))
    }));
    
    // Pass the transformed groups to parent
    onAdd(groupsWithFlags);
    
    // Reset the state
    setExtraGroups([]);
    setActiveStep(0);
    onClose();
  };

  const handleCreateVariant = () => {
    if (!currentGroup || !newVariant.name || !newVariant.price) return;

    const newVariantDetails: ExtraDetail = {
      foodName: newVariant.name,
      foodPrice: Number(newVariant.price),
      foodDescription: newVariant.description,
      foodImage: {
        access: "public",
        path: "",
        name: "",
        type: "image",
        size: 0,
        mime: "image/jpeg",
        meta: {
          width: 0,
          height: 0
        },
        url: ""
      },
      value: `new-${Date.now()}`,
      isNew: true  // Mark as new variant
    };

    setCurrentGroup({
      ...currentGroup,
      extrasDetails: [...currentGroup.extrasDetails, newVariantDetails]
    });

    // Reset the form
    setNewVariant({
      name: '',
      price: '',
      description: ''
    });
  };

  const handleVariantSelect = (value: string) => {
    setSelectedVariants(prev => {
      if (prev.includes(value)) {
        return prev.filter(v => v !== value);
      }
      return [...prev, value];
    });
  };

  const handleAddSelectedVariants = () => {
    if (currentGroup && selectedVariants.length > 0) {
      const newVariants = selectedVariants.map(variantValue => {
        const selectedOption = foodTypes.find(opt => opt.value === variantValue);
        if (selectedOption) {
          return {
            foodName: selectedOption.label,
            foodPrice: Number(selectedOption.foodPrice),
            foodDescription: selectedOption.foodDescription || '',
            foodImage: selectedOption.foodImage,
            value: selectedOption.value,
            isNew: false
          };
        }
        return null;
      }).filter(Boolean) as ExtraDetail[];

      setCurrentGroup({
        ...currentGroup,
        extrasDetails: [...currentGroup.extrasDetails, ...newVariants]
      });
      setSelectedVariants([]);
    }
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                index <= activeStep 
                  ? 'bg-[#fd683e] text-white shadow-md' 
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {index < activeStep ? (
                <Check className="w-4 h-4" />
              ) : (
                step.id
              )}
            </div>
            <div className="mt-1 text-center max-w-[80px]">
              <div className={`text-xs font-medium ${index <= activeStep ? 'text-[#fd683e]' : 'text-gray-500'}`}>
                {step.title}
              </div>
            </div>
          </div>
          {index < steps.length - 1 && (
            <div 
              className={`w-12 h-0.5 mx-3 transition-all duration-300 ${
                index < activeStep ? 'bg-[#fd683e]' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStepContent = () => {
    // If mode is 'create', only show case 1 (Add Variants)
    if (mode === 'create') {
      return (
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <h3 className="text-lg font-semibold text-gray-900">Add Variants</h3>
            <p className="text-sm text-gray-600">Adding variants for: <span className="font-medium text-[#fd683e]">{currentGroup?.extrasTitle || 'New Group'}</span></p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex flex-col gap-2">
              {/* Only show create new variant, but remove the Create Variant button in create mode */}
              <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-3">
                <h4 className="text-sm font-medium text-gray-900">Create New Variant</h4>
                <div className="space-y-3">
                  <TextField
                    fullWidth
                    label="Variant Name"
                    size="small"
                    placeholder="Enter variant name"
                    value={newVariant.name}
                    onChange={(e) => setNewVariant(prev => ({ ...prev, name: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newVariant.name && newVariant.price) {
                        handleCreateVariant();
                      }
                    }}
                    sx={{
                      '& .MuiInputBase-root': {
                        fontFamily: 'var(--font-sans)',
                      },
                      '& .MuiInputLabel-root': {
                        fontFamily: 'var(--font-sans)',
                      },
                      '& label.Mui-focused': {
                        color: '#fd683e',
                      },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: '#fd683e',
                        },
                        '&:hover fieldset': {
                          borderColor: '#fd683e',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#fd683e',
                          borderWidth: 2,
                        },
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Price"
                    type="number"
                    size="small"
                    placeholder="Enter price"
                    value={newVariant.price}
                    onChange={(e) => setNewVariant(prev => ({ ...prev, price: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newVariant.name && newVariant.price) {
                        handleCreateVariant();
                      }
                    }}
                    sx={{
                      '& .MuiInputBase-root': {
                        fontFamily: 'var(--font-sans)',
                      },
                      '& .MuiInputLabel-root': {
                        fontFamily: 'var(--font-sans)',
                      },
                      '& label.Mui-focused': {
                        color: '#fd683e',
                      },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: '#fd683e',
                        },
                        '&:hover fieldset': {
                          borderColor: '#fd683e',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#fd683e',
                          borderWidth: 2,
                        },
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={2}
                    size="small"
                    placeholder="Enter description"
                    value={newVariant.description}
                    onChange={(e) => setNewVariant(prev => ({ ...prev, description: e.target.value }))}
                    onBlur={() => {
                      if (newVariant.name && newVariant.price) {
                        handleCreateVariant();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newVariant.name && newVariant.price) {
                        handleCreateVariant();
                      }
                    }}
                    sx={{
                      '& .MuiInputBase-root': {
                        fontFamily: 'var(--font-sans)',
                      },
                      '& .MuiInputLabel-root': {
                        fontFamily: 'var(--font-sans)',
                      },
                      '& label.Mui-focused': {
                        color: '#fd683e',
                      },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: '#fd683e',
                        },
                        '&:hover fieldset': {
                          borderColor: '#fd683e',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#fd683e',
                          borderWidth: 2,
                        },
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    fullWidth
                    size="small"
                    onClick={handleCreateVariant}
                    disabled={!newVariant.name || !newVariant.price}
                    sx={{
                      backgroundColor: '#fd683e',
                      textTransform: 'none',
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 600,
                      mt: 1,
                      '&:hover': {
                        backgroundColor: '#e54d0e',
                      },
                      '&:disabled': {
                        backgroundColor: '#ffd2b3',
                      },
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Variant
                  </Button>
                </div>
              </div>
            </div>
            {currentGroup && currentGroup.extrasDetails.length > 0 && (
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <h4 className="text-xs font-medium text-gray-700 mb-2">Added Variants ({currentGroup.extrasDetails.length})</h4>
                <div className="flex flex-wrap gap-1">
                  {currentGroup.extrasDetails.map((extra) => (
                    <Chip
                      key={extra.foodName}
                      label={extra.foodName}
                      onDelete={() => handleRemoveVariant(extra.foodName)}
                      deleteIcon={<X className="w-3 h-3" />}
                      size="small"
                      sx={{
                        fontFamily: 'var(--font-sans)',
                        backgroundColor: '#fff3ea',
                        color: '#fd683e',
                        fontWeight: 500,
                        fontSize: '11px',
                        height: '24px',
                        '& .MuiChip-deleteIcon': {
                          color: '#fd683e',
                          '&:hover': {
                            color: '#e54d0e',
                          },
                        },
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    switch (activeStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-semibold text-gray-900">Create Extras Group</h3>
              <p className="text-sm text-gray-600">Give your extras group a descriptive title</p>
            </div>
            
            {extraGroups.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Existing Groups ({extraGroups.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {extraGroups.map((group) => (
                    <Chip
                      key={group.id}
                      label={group.extrasTitle}
                      size="small"
                      sx={{
                        backgroundColor: '#fff3ea',
                        color: '#fd683e',
                        fontWeight: 500,
                        fontSize: '11px',
                        height: '24px',
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            
            <div className="bg-gray-50 rounded-lg p-4">
              <TextField
                fullWidth
                label="Extras Title"
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                placeholder="e.g., Toppings, Sauces, Sides"
                variant="outlined"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    '& fieldset': {
                      borderColor: '#e5e7eb',
                      borderWidth: '1px',
                    },
                    '&:hover fieldset': {
                      borderColor: '#fd683e',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#fd683e',
                      borderWidth: '2px',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#6b7280',
                    '&.Mui-focused': {
                      color: '#fd683e',
                    },
                  },
                }}
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-semibold text-gray-900">Add Variants</h3>
              <p className="text-sm text-gray-600">Adding variants for: <span className="font-medium text-[#fd683e]">{currentGroup?.extrasTitle || 'New Group'}</span></p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex flex-col gap-2">
                {mode === 'select' && (
                  <>
                    {loading ? (
                      <div className="flex justify-center items-center h-10 bg-white rounded-lg border border-gray-200">
                        <CircularProgress sx={{ color: '#fd683e' }} size={20} />
                      </div>
                    ) : (
                      <Paper 
                        variant="outlined" 
                        sx={{ 
                          maxHeight: '300px', 
                          overflow: 'auto',
                          backgroundColor: 'white',
                          borderColor: '#e5e7eb'
                        }}
                      >
                        <List sx={{ padding: 0 }}>
                          {foodTypes.map(opt => (
                            <ListItem 
                              key={opt.value}
                              sx={{
                                borderBottom: '1px solid #f3f4f6',
                                '&:last-child': {
                                  borderBottom: 'none'
                                }
                              }}
                            >
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={selectedVariants.includes(opt.value)}
                                    onChange={() => handleVariantSelect(opt.value)}
                                    sx={{
                                      color: '#fd683e',
                                      '&.Mui-checked': {
                                        color: '#fd683e',
                                      },
                                    }}
                                  />
                                }
                                label={
                                  <Box>
                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        fontWeight: 500,
                                        fontFamily: 'var(--font-sans)'
                                      }}
                                    >
                                      {opt.label}
                                    </Typography>
                                    <Typography 
                                      variant="caption" 
                                      sx={{ 
                                        color: 'text.secondary',
                                        fontFamily: 'var(--font-sans)'
                                      }}
                                    >
                                      Price: ${opt.foodPrice}
                                    </Typography>
                                  </Box>
                                }
                                sx={{
                                  margin: 0,
                                  width: '100%',
                                  fontFamily: 'var(--font-sans)'
                                }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                    )}
                    <Button
                      variant="contained"
                      onClick={handleAddSelectedVariants}
                      disabled={selectedVariants.length === 0}
                      size="small"
                      sx={{
                        backgroundColor: '#fd683e',
                        textTransform: 'none',
                        fontFamily: 'var(--font-sans)',
                        fontWeight: 600,
                        '&:hover': {
                          backgroundColor: '#e54d0e',
                        },
                        '&:disabled': {
                          backgroundColor: '#ffd2b3',
                        },
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Selected Variants ({selectedVariants.length})
                    </Button>
                  </>
                )}

                {/* Only show create new variant if mode is not 'select' */}
                {mode !== 'select' && (
                  <>
                    {mode !== 'create' && (
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-gray-50 px-2 text-gray-500 font-medium">or</span>
                        </div>
                      </div>
                    )}
                    <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-3">
                      <h4 className="text-sm font-medium text-gray-900">Create New Variant</h4>
                      <div className="space-y-3">
                        <TextField
                          fullWidth
                          label="Variant Name"
                          size="small"
                          placeholder="Enter variant name"
                          value={newVariant.name}
                          onChange={(e) => setNewVariant(prev => ({ ...prev, name: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newVariant.name && newVariant.price) {
                              handleCreateVariant();
                            }
                          }}
                          sx={{
                            '& .MuiInputBase-root': {
                              fontFamily: 'var(--font-sans)',
                            },
                            '& .MuiInputLabel-root': {
                              fontFamily: 'var(--font-sans)',
                            },
                            '& label.Mui-focused': {
                              color: '#fd683e',
                            },
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': {
                                borderColor: '#fd683e',
                              },
                              '&:hover fieldset': {
                                borderColor: '#fd683e',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#fd683e',
                                borderWidth: 2,
                              },
                            },
                          }}
                        />
                        <TextField
                          fullWidth
                          label="Price"
                          type="number"
                          size="small"
                          placeholder="Enter price"
                          value={newVariant.price}
                          onChange={(e) => setNewVariant(prev => ({ ...prev, price: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newVariant.name && newVariant.price) {
                              handleCreateVariant();
                            }
                          }}
                          sx={{
                            '& .MuiInputBase-root': {
                              fontFamily: 'var(--font-sans)',
                            },
                            '& .MuiInputLabel-root': {
                              fontFamily: 'var(--font-sans)',
                            },
                            '& label.Mui-focused': {
                              color: '#fd683e',
                            },
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': {
                                borderColor: '#fd683e',
                              },
                              '&:hover fieldset': {
                                borderColor: '#fd683e',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#fd683e',
                                borderWidth: 2,
                              },
                            },
                          }}
                        />
                        <TextField
                          fullWidth
                          label="Description"
                          multiline
                          rows={2}
                          size="small"
                          placeholder="Enter description"
                          value={newVariant.description}
                          onChange={(e) => setNewVariant(prev => ({ ...prev, description: e.target.value }))}
                          onBlur={() => {
                            if (newVariant.name && newVariant.price) {
                              handleCreateVariant();
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newVariant.name && newVariant.price) {
                              handleCreateVariant();
                            }
                          }}
                          sx={{
                            '& .MuiInputBase-root': {
                              fontFamily: 'var(--font-sans)',
                            },
                            '& .MuiInputLabel-root': {
                              fontFamily: 'var(--font-sans)',
                            },
                            '& label.Mui-focused': {
                              color: '#fd683e',
                            },
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': {
                                borderColor: '#fd683e',
                              },
                              '&:hover fieldset': {
                                borderColor: '#fd683e',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#fd683e',
                                borderWidth: 2,
                              },
                            },
                          }}
                        />
                        <Button
                          variant="contained"
                          fullWidth
                          size="small"
                          onClick={handleCreateVariant}
                          disabled={!newVariant.name || !newVariant.price}
                          sx={{
                            backgroundColor: '#fd683e',
                            textTransform: 'none',
                            fontFamily: 'var(--font-sans)',
                            fontWeight: 600,
                            mt: 1,
                            '&:hover': {
                              backgroundColor: '#e54d0e',
                            },
                            '&:disabled': {
                              backgroundColor: '#ffd2b3',
                            },
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Variant
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {currentGroup && currentGroup.extrasDetails.length > 0 && (
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Added Variants ({currentGroup.extrasDetails.length})</h4>
                  <div className="flex flex-wrap gap-1">
                    {currentGroup.extrasDetails.map((extra) => (
                      <Chip
                        key={extra.foodName}
                        label={extra.foodName}
                        onDelete={() => handleRemoveVariant(extra.foodName)}
                        deleteIcon={<X className="w-3 h-3" />}
                        size="small"
                        sx={{
                          fontFamily: 'var(--font-sans)',
                          backgroundColor: '#fff3ea',
                          color: '#fd683e',
                          fontWeight: 500,
                          fontSize: '11px',
                          height: '24px',
                          '& .MuiChip-deleteIcon': {
                            color: '#fd683e',
                            '&:hover': {
                              color: '#e54d0e',
                            },
                          },
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-semibold text-gray-900">Review Extras</h3>
              <p className="text-sm text-gray-600">Manage your extras groups before saving</p>
            </div>

            {extraGroups.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Plus className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 mb-3">No extras groups added yet</p>
                <Button
                  onClick={handleAddAnotherGroup}
                  variant="outlined"
                  size="small"
                  sx={{
                    borderColor: '#fd683e',
                    color: '#fd683e',
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: '#e54d0e',
                      backgroundColor: '#fff3ea',
                    },
                  }}
                >
                  Add Your First Group
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {extraGroups.map((group) => (
                  <div key={group.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="bg-[#201a18] text-white px-3 py-2 flex items-center justify-between">
                      <h4 className="font-semibold text-sm text-white">{group.extrasTitle}</h4>
                      <div className="flex gap-1">
                        <IconButton
                          onClick={() => handleEditGroup(group)}
                          size="small"
                          sx={{ 
                            color: 'white', 
                            '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
                            padding: '4px'
                          }}
                        >
                          <Edit3 className="w-3 h-3" />
                        </IconButton>
                        <IconButton
                          onClick={() => handleRemoveGroup(group.id)}
                          size="small"
                          sx={{ 
                            color: 'white', 
                            '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
                            padding: '4px'
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </IconButton>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-gray-600 mb-2">
                        {group.extrasDetails.length} variant{group.extrasDetails.length !== 1 ? 's' : ''} added
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {group.extrasDetails.map((extra) => (
                          <Chip
                            key={extra.foodName}
                            label={
                              <div className="flex items-center gap-1">
                                <span>{extra.foodName}</span>
                                {extra.isNew && (
                                  <span className="bg-[#fd683e] text-white text-[8px] px-1 rounded">NEW</span>
                                )}
                              </div>
                            }
                            size="small"
                            sx={{
                              backgroundColor: extra.isNew ? '#fff3ea' : '#f3f4f6',
                              color: extra.isNew ? '#fd683e' : '#6b7280',
                              fontWeight: 500,
                              fontSize: '10px',
                              height: '20px',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button
                  onClick={handleAddAnotherGroup}
                  variant="outlined"
                  fullWidth
                  size="small"
                  className="py-2"
                  sx={{
                    borderColor: '#fd683e',
                    color: '#fd683e',
                    textTransform: 'none',
                    fontWeight: 600,
                    borderStyle: 'dashed',
                    '&:hover': {
                      borderColor: '#e54d0e',
                      backgroundColor: '#fff3ea',
                      borderStyle: 'dashed',
                    },
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Group
                </Button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          maxHeight: '85vh',
          margin: '16px',
          maxWidth: '500px',
        }
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Add Extras</h2>
          {mode !== 'create' && <p className="text-sm text-gray-600 mt-0.5">{steps[activeStep].description}</p>}
        </div>
        <IconButton
          onClick={onClose}
          sx={{ 
            color: '#6b7280',
            '&:hover': { backgroundColor: '#f3f4f6' },
          }}
        >
          <X className="w-5 h-5" />
        </IconButton>
      </div>

      <DialogContent sx={{ p: 4 }}>
        {mode !== 'create' && <StepIndicator />}
        {renderStepContent()}
      </DialogContent>

      {/* Footer */}
      {mode === 'create' ? (
        <div className="flex items-center justify-end p-4 border-t border-gray-200 bg-gray-50">
          <Button
            onClick={async () => {
              if (currentGroup && currentGroup.extrasDetails.length > 0) {
                if (mode === 'create') {
                  try {
                    const payload = {
                      restaurantName: restaurantData.id || null,
                      branchName: userProfile.branchId || null,
                      extras: currentGroup.extrasDetails.map(detail => ({
                        variantName: detail.foodName,
                        variantPrice: detail.foodPrice,
                        variantDescription: detail.foodDescription
                      }))
                    };
                    await createExtrasItem(payload);
                  } catch (e) {
                    // Optionally handle error (show toast, etc)
                  }
                }
                onAdd([currentGroup]);
                setCurrentGroup(null);
                setGroupTitle('');
                onClose();
              }
            }}
            disabled={!currentGroup || currentGroup.extrasDetails.length === 0}
            variant="contained"
            size="small"
            sx={{
              backgroundColor: '#fd683e',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              py: 1,
              '&:hover': {
                backgroundColor: '#e54d0e',
              },
              '&:disabled': {
                backgroundColor: '#ffd2b3',
              },
            }}
          >
            <Check className="w-4 h-4 mr-1" />
            Create Extras
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-2">
            {activeStep > 0 && (
              <Button
                onClick={handleBack}
                variant="outlined"
                size="small"
                sx={{
                  borderColor: '#d1d5db',
                  color: '#6b7280',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: '#9ca3af',
                    backgroundColor: 'white',
                  },
                }}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {activeStep === 2 ? (
              <Button
                onClick={handleSave}
                disabled={extraGroups.length === 0}
                variant="contained"
                size="small"
                sx={{
                  backgroundColor: '#fd683e',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  '&:hover': {
                    backgroundColor: '#e54d0e',
                  },
                  '&:disabled': {
                    backgroundColor: '#ffd2b3',
                  },
                }}
              >
                <Check className="w-4 h-4 mr-1" />
                Save All Extras
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={
                  (activeStep === 0 && !groupTitle) ||
                  (activeStep === 1 && (!currentGroup || currentGroup.extrasDetails.length === 0))
                }
                variant="contained"
                size="small"
                sx={{
                  backgroundColor: '#fd683e',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  '&:hover': {
                    backgroundColor: '#e54d0e',
                  },
                  '&:disabled': {
                    backgroundColor: '#ffd2b3',
                  },
                }}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
};

export default AddExtrasModal; 