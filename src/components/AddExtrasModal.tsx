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
} from '@mui/material';
import { X, Plus, Trash2, Edit3, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { api } from '@/services/api';
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
  extrasDetails: {
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
  }[];
}

interface AddExtrasModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (groups: ExtraGroup[]) => void;
  initialExtras?: ExtraGroup[];
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
  initialExtras = []
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [groupTitle, setGroupTitle] = useState('');
  const [variant, setVariant] = useState('');
  const [extraGroups, setExtraGroups] = useState<ExtraGroup[]>([]);
  const [currentGroup, setCurrentGroup] = useState<ExtraGroup | null>(null);
  const [foodTypes, setFoodTypes] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [foodItemsData, setFoodItemsData] = useState<FoodItem[]>([]);

  const { restaurantData } = useUserProfile();

  useEffect(() => {
    if (open) {
      // Reset state when modal opens
      setActiveStep(0);
      setGroupTitle('');
      setCurrentGroup(null);
      
      // If we have initial extras, set them in the extraGroups state
      if (initialExtras?.length > 0) {
        // Ensure each group has a unique ID and all required fields
        const extrasWithIds = initialExtras.map(group => ({
          ...group,
          id: group.id || `${Date.now()}-${Math.random().toString(36).substring(2)}`,
          extrasTitle: group.extrasTitle,
          delika_inventory_table_id: group.delika_inventory_table_id || '',
          extrasDetails: group.extrasDetails || []
        }));
        
        console.log('Setting initial extras with guaranteed IDs:', extrasWithIds);
        setExtraGroups(extrasWithIds);
        // Move to review step since we have existing extras
        setActiveStep(2);
      } else {
        // No initial extras, start fresh
        setExtraGroups([]);
      }
    }
  }, [open, initialExtras]);

  useEffect(() => {
    const fetchFoodTypes = async () => {
      try {
        setLoading(true);
        console.log('Fetching food types from endpoint:', 'https://api-server.krontiva.africa/api:uEBBwbSs/delika_inventory_table');
        const response = await axios.get('https://api-server.krontiva.africa/api:uEBBwbSs/delika_inventory_table');
        console.log('Full API Response:', response.data);
        
        const data = response.data as FoodItem[];
        
        // Filter for restaurant ID and get unique food types
        const filteredData = data.filter(item => 
          item.restaurantName === restaurantData.id
        );
        
        console.log('Filtered data for restaurant:', filteredData);
        
        // Get unique food types and create options while maintaining all data
        const uniqueFoodTypes = filteredData.map(item => ({
          label: item.foodName,
          value: item.id,
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
        
        console.log('Processed food types options with full data:', uniqueFoodTypes);
        setFoodTypes(uniqueFoodTypes);
      } catch (error) {
        console.error('Error fetching food types:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchFoodTypes();
    }
  }, [open, restaurantData.id]);

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
          const newDetails = currentGroup.extrasDetails;
          
          // Merge details, avoiding duplicates based on foodName
          const mergedDetails = [...existingDetails];
          newDetails.forEach(detail => {
            if (!mergedDetails.some(existing => existing.foodName === detail.foodName)) {
              mergedDetails.push(detail);
            }
          });
          
          updatedGroups[existingGroupIndex] = {
            ...updatedGroups[existingGroupIndex],
            extrasDetails: mergedDetails
          };
          setExtraGroups(updatedGroups);
        } else {
          // If it's a new group, check if there are any groups with same title
          const sameTitle = extraGroups.find(g => 
            g.extrasTitle.toLowerCase() === currentGroup.extrasTitle.toLowerCase()
          );
          
          if (sameTitle) {
            // Merge with existing group
            const updatedGroups = extraGroups.map(group => {
              if (group.extrasTitle.toLowerCase() === currentGroup.extrasTitle.toLowerCase()) {
                return {
                  ...group,
                  extrasDetails: [
                    ...group.extrasDetails,
                    ...currentGroup.extrasDetails.filter(detail => 
                      !group.extrasDetails.some(existing => existing.foodName === detail.foodName)
                    )
                  ]
                };
              }
              return group;
            });
            setExtraGroups(updatedGroups);
          } else {
            // Add as new group
            setExtraGroups([...extraGroups, currentGroup]);
          }
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
      console.log('Selected variant with full data:', selectedOption);
      
      if (selectedOption) {
        setCurrentGroup({
          ...currentGroup,
          delika_inventory_table_id: selectedOption.value,
          extrasDetails: [...(currentGroup.extrasDetails || []), {
            foodName: selectedOption.label,
            foodPrice: Number(selectedOption.foodPrice),
            foodDescription: selectedOption.foodDescription || '',
            foodImage: selectedOption.foodImage,
            value: selectedOption.value
          }]
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
      console.error('No ID provided for group removal');
      return;
    }

    console.log('Attempting to remove group with id:', id);
    console.log('Current groups:', extraGroups);

    // Find the group to be removed
    const groupToRemove = extraGroups.find(group => group.id === id);
    if (!groupToRemove) {
      console.warn('No group found with ID:', id);
      return;
    }

    // Remove this group and any other groups with the same title
    const updatedGroups = extraGroups.filter(group => 
      group.extrasTitle.toLowerCase() !== groupToRemove.extrasTitle.toLowerCase()
    );

    console.log('Groups after removal:', updatedGroups);
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
    console.log('Current groups state before saving:', extraGroups);
    
    // First, group the extras by their extrasTitle
    const groupedExtras = extraGroups.reduce((acc, group) => {
      const existingGroup = acc.find(g => g.extrasTitle === group.extrasTitle);
      
      if (existingGroup) {
        // If a group with this title exists, add the details to it
        existingGroup.extrasDetails = [
          ...existingGroup.extrasDetails,
          ...group.extrasDetails
        ];
        // Update the delika_inventory_table_id if it's not set
        if (!existingGroup.delika_inventory_table_id && group.delika_inventory_table_id) {
          existingGroup.delika_inventory_table_id = group.delika_inventory_table_id;
        }
      } else {
        // If no group exists with this title, create a new one
        acc.push({
          id: group.id,
          extrasTitle: group.extrasTitle,
          delika_inventory_table_id: group.delika_inventory_table_id || group.extrasDetails[0]?.value || '',
          extrasDetails: group.extrasDetails.map(detail => ({
            foodName: detail.foodName,
            foodPrice: detail.foodPrice,
            foodDescription: detail.foodDescription || '',
            foodImage: detail.foodImage,
            value: detail.value
          }))
        });
      }
      return acc;
    }, [] as ExtraGroup[]);

    console.log('Saving grouped extras:', groupedExtras);
    onAdd(groupedExtras);
    
    // Reset the state
    setExtraGroups([]);
    setActiveStep(0);
    onClose();
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
              <p className="text-sm text-gray-600">Adding variants for: <span className="font-medium text-[#fd683e]">{currentGroup?.extrasTitle}</span></p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex gap-2">
                <FormControl fullWidth size="small">
                  <InputLabel 
                    sx={{ 
                      color: '#6b7280',
                      '&.Mui-focused': {
                        color: '#fd683e',
                      },
                    }}
                  >
                    Select Variant
                  </InputLabel>
                  {loading ? (
                    <div className="flex justify-center items-center h-10 bg-white rounded-lg border border-gray-200">
                      <CircularProgress sx={{ color: '#fd683e' }} size={20} />
                    </div>
                  ) : (
                    <Select
                      value={variant}
                      onChange={(e: SelectChangeEvent) => setVariant(e.target.value as string)}
                      label="Select Variant"
                      sx={{ 
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#e5e7eb',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#fd683e',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#fd683e',
                          borderWidth: '2px',
                        },
                      }}
                    >
                      {foodTypes.map(opt => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                </FormControl>
                <Button
                  variant="contained"
                  onClick={handleAddVariant}
                  disabled={!variant}
                  className="h-10 px-4 shrink-0"
                  sx={{
                    backgroundColor: '#fd683e',
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 600,
                    minWidth: '80px',
                    '&:hover': {
                      backgroundColor: '#e54d0e',
                    },
                    '&:disabled': {
                      backgroundColor: '#ffd2b3',
                    },
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
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
                            label={extra.foodName}
                            size="small"
                            sx={{
                              backgroundColor: '#fff3ea',
                              color: '#fd683e',
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
          <p className="text-sm text-gray-600 mt-0.5">{steps[activeStep].description}</p>
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
        <StepIndicator />
        {renderStepContent()}
      </DialogContent>

      {/* Footer */}
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
    </Dialog>
  );
};

export default AddExtrasModal; 