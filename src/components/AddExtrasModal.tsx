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
type Option = { label: string; value: string };

export interface Extra {
  id: string;
  variant: string;
  title: string;
  inventoryId?: string;
}

export interface ExtraGroup {
  id: string;
  title: string;
  extras: Extra[];
}

interface AddExtrasModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (groups: ExtraGroup[]) => void;
}

interface FoodItem {
  id: string;
  foodType: string;
  foodName: string;
  foodPrice: string;
  restaurantName: string;
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
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [groupTitle, setGroupTitle] = useState('');
  const [variant, setVariant] = useState('');
  const [extraGroups, setExtraGroups] = useState<ExtraGroup[]>([]);
  const [currentGroup, setCurrentGroup] = useState<ExtraGroup | null>(null);
  const [foodTypes, setFoodTypes] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);

  const { restaurantData } = useUserProfile();

  useEffect(() => {
    const fetchFoodTypes = async () => {
      try {
        setLoading(true);
        const response = await axios.get('https://api-server.krontiva.africa/api:uEBBwbSs/delika_inventory_table');
        const data = response.data as FoodItem[];
        
        // Filter for restaurant ID and get unique food types
        const filteredData = data.filter(item => 
          item.restaurantName === restaurantData.id
        );
        
        // Get unique food types and create options
        const uniqueFoodTypes = filteredData.map(item => ({
          label: item.foodName,
          value: item.id
        }));
        
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
      setCurrentGroup({
        id: Date.now().toString(),
        title: groupTitle,
        extras: []
      });
      setActiveStep(1);
    } else if (activeStep === 1) {
      if (currentGroup) {
        setExtraGroups([...extraGroups, currentGroup]);
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
      setCurrentGroup({
        ...currentGroup,
        extras: [...currentGroup.extras, {
          id: Date.now().toString(),
          variant: selectedOption ? selectedOption.label : variant,
          inventoryId: selectedOption ? selectedOption.value : variant,
          title: currentGroup.title
        }]
      });
      setVariant('');
    }
  };

  const handleRemoveVariant = (id: string) => {
    if (currentGroup) {
      setCurrentGroup({
        ...currentGroup,
        extras: currentGroup.extras.filter(extra => extra.id !== id)
      });
    }
  };

  const handleRemoveGroup = (id: string) => {
    setExtraGroups(extraGroups.filter(group => group.id !== id));
  };

  const handleEditGroup = (group: ExtraGroup) => {
    setCurrentGroup(group);
    setGroupTitle(group.title);
    setExtraGroups(extraGroups.filter(g => g.id !== group.id));
    setActiveStep(1);
  };

  const handleAddAnotherGroup = () => {
    setGroupTitle('');
    setActiveStep(0);
  };

  const handleSave = () => {
    onAdd(extraGroups);
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
              <p className="text-sm text-gray-600">Adding variants for: <span className="font-medium text-[#fd683e]">{currentGroup?.title}</span></p>
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

              {currentGroup && currentGroup.extras.length > 0 && (
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Added Variants ({currentGroup.extras.length})</h4>
                  <div className="flex flex-wrap gap-1">
                    {currentGroup.extras.map((extra) => (
                      <Chip
                        key={extra.id}
                        label={extra.variant}
                        onDelete={() => handleRemoveVariant(extra.id)}
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
                      <h4 className="font-semibold text-sm">{group.title}</h4>
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
                        {group.extras.length} variant{group.extras.length !== 1 ? 's' : ''} added
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {group.extras.map((extra) => (
                          <Chip
                            key={extra.id}
                            label={extra.variant}
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
                (activeStep === 1 && (!currentGroup || currentGroup.extras.length === 0))
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