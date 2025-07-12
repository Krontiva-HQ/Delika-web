import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Plus, Edit2, Trash2, ChevronLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { api, API_ENDPOINTS, getRestaurantExtras, createExtrasGroup } from '../services/api';
import { useUserProfile } from '../hooks/useUserProfile';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';
import { 
  Paper, 
  List, 
  ListItem, 
  FormControlLabel, 
  Box, 
  Typography, 
  CircularProgress,
  Checkbox as MuiCheckbox
} from '@mui/material';

// Option type for dropdowns
type Option = { 
  label: string; 
  value: string;
  foodPrice: number;
};

interface ExtraDetail {
  id: string;
  foodName: string;
  foodPrice: number;
  foodDescription: string;
}

interface ExtraItem {
  delika_inventory_table_id: string;
  extrasTitle: string;
  required: boolean;
  extrasDetails: ExtraDetail[];
}

interface ExtrasGroupResponse {
  id: string;
  created_at: number;
  restaurantId: string;
  extras: ExtraItem[];
}

export interface ExtrasGroupPayload {
  restaurantId: string;
  extras: Array<{
    extrasTitle: string;
    delika_inventory_table_id: string;
    required: boolean;
    extrasDetails: ExtraDetail[];
  }>;
}

export interface Extra {
  id: string;
  variant: string;
  title: string;
  inventoryId: string;
  price?: number;
  description?: string;
}

export interface ExtraGroup {
  id: string;
  title: string;
  extras: Extra[];
}

interface NewExtrasModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (groups: ExtraGroup[]) => void;
}

interface FoodItem {
  id: string;
  foodType: string;
  foodName: string;
  foodPrice: number;
  restaurantName: string;
}

// Update the steps order
const steps = ['Review extras', 'Enter extras title', 'Add extras'];

const GroupExtrasModal: React.FC<NewExtrasModalProps> = ({
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
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setError] = useState<string | null>(null);
  const [existingGroups, setExistingGroups] = useState<ExtraGroup[]>([]);

  const { restaurantData } = useUserProfile();

  // Fetch existing extras groups
  useEffect(() => {
    const fetchExistingExtras = async () => {
      try {
        setLoading(true);
        const response = await getRestaurantExtras(restaurantData.id || null);
        const existingExtrasGroups = response.data;

        // First, collect all extras from all groups and flatten extrasDetails
        const allExtras = existingExtrasGroups.flatMap(group => 
          group.extras.flatMap(extra => 
            extra.extrasDetails.map((detail: any) => ({
              ...extra,
              extrasDetail: detail
            }))
          )
        );

        // Then group by extrasTitle
        const groupedExtras = allExtras.reduce<Record<string, Extra[]>>((acc, extra) => {
          if (!acc[extra.extrasTitle]) {
            acc[extra.extrasTitle] = [];
          }

          acc[extra.extrasTitle].push({
            id: extra.delika_inventory_table_id,
            variant: extra.extrasDetail.foodName, // Use foodName instead of extrasTitle
            title: extra.extrasTitle,
            inventoryId: extra.delika_inventory_table_id
          });

          return acc;
        }, {});

        // Convert grouped extras to ExtraGroup array
        const formattedGroups: ExtraGroup[] = Object.entries(groupedExtras).map(([title, extras]) => ({
          id: existingExtrasGroups[0]?.id + '-' + title || title, // Create a unique ID for each group
          title,
          extras
        }));

        setExistingGroups(formattedGroups);
        setExtraGroups(formattedGroups);
        setActiveStep(0);
      } catch (error) {
        console.error('Error fetching existing extras:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchExistingExtras();
    }
  }, [open, restaurantData.id]);

  useEffect(() => {
    const fetchFoodTypes = async () => {
      try {
        setLoading(true);
        const response = await axios.get('https://api-server.krontiva.africa/api:uEBBwbSs/delika_inventory_table');
        const data = response.data as FoodItem[];
        
        const filteredData = data.filter(item => 
          item.restaurantName === restaurantData.id
        );
        
        const uniqueFoodTypes = filteredData.map(item => ({
          label: item.foodName,
          value: item.id,
          foodPrice: item.foodPrice
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

  // Update the handleNext function
  const handleNext = () => {
    if (activeStep === 0) {
      // When clicking "Add Another Group", move to step 1 for creating new group
      setCurrentGroup(null);
      setGroupTitle('');
      setIsEditing(false);
      setSelectedVariants([]);
      setActiveStep(1);
    } else if (activeStep === 1) {
      // When moving from title to variant selection
      if (isEditing && currentGroup) {
        // Keep existing variants when editing
        setCurrentGroup({
          ...currentGroup,
          title: groupTitle,
        });
      } else {
        // Create new group when not editing
        setCurrentGroup({
          id: Date.now().toString(),
          title: groupTitle,
          extras: []
        });
      }
      setActiveStep(2);
    } else if (activeStep === 2) {
      if (currentGroup) {
        setExtraGroups([...extraGroups, currentGroup]);
        setCurrentGroup(null);
        setGroupTitle('');
        setIsEditing(false);
        setSelectedVariants([]);
        setActiveStep(0);
      }
    }
  };

  // Update the handleBack function
  const handleBack = () => {
    if (activeStep === 2) {
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
          title: currentGroup.title,
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

  // Update handleRemoveGroup to handle both existing and new groups
  const handleRemoveGroup = (id: string) => {
    setExtraGroups(prev => prev.filter(group => group.id !== id));
  };

  // Update handleEditGroup to set editing state
  const handleEditGroup = (group: ExtraGroup) => {
    setCurrentGroup({
      ...group,
      extras: group.extras.map(extra => ({
        ...extra,
      }))
    });
    setGroupTitle(group.title);
    setIsEditing(true);
    // Pre-select existing variants
    const existingVariantIds = group.extras.map(extra => extra.inventoryId).filter(Boolean) as string[];
    setSelectedVariants(existingVariantIds);
    setExtraGroups(extraGroups.filter(g => g.id !== group.id));
    setActiveStep(1);
  };

  // Update handleAddAnotherGroup to properly reset states
  const handleAddAnotherGroup = () => {
    setCurrentGroup(null);
    setGroupTitle('');
    setIsEditing(false);
    setSelectedVariants([]);
    setActiveStep(1);
  };

  const handleSave = async () => {
    try {
      setSaveLoading(true);
      setError(null);

      // Create payload for each group
      const payload = {
        restaurantId: restaurantData.id || '',
        extras: extraGroups.flatMap(group => 
          group.extras.map(extra => ({
            extrasTitle: group.title,
            delika_inventory_table_id: extra.inventoryId,
            required: false
          }))
        )
      };

      await createExtrasGroup(payload);
      onAdd(extraGroups);
      onClose();
    } catch (error) {
      console.error('Error saving extras groups:', error);
      setError('Failed to save extras groups. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleVariantSelect = (value: string, variantName: string) => {
    if (currentGroup) {
      if (selectedVariants.includes(value)) {
        // Remove variant
        setSelectedVariants(prev => prev.filter(v => v !== value));
        setCurrentGroup({
          ...currentGroup,
          extras: currentGroup.extras.filter(extra => extra.inventoryId !== value)
        });
      } else {
        // Add variant
        setSelectedVariants(prev => [...prev, value]);
        setCurrentGroup({
          ...currentGroup,
          extras: [...currentGroup.extras, {
            id: Date.now().toString(),
            variant: variantName,
            title: currentGroup.title,
            inventoryId: value,
          }]
        });
      }
    }
  };

  // Custom Stepper Component with Shadcn styling
  const StepIndicator = ({ currentStep }: { currentStep: number }) => (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <React.Fragment key={step}>
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-200 ${
                index <= currentStep
                  ? 'bg-orange-500 border-orange-500 text-white shadow-lg'
                  : 'bg-gray-100 border-gray-300 text-gray-400'
              }`}
            >
              {index < currentStep ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              ) : (
                index + 1
              )}
            </div>
            <p className={`text-xs mt-2 text-center max-w-20 font-medium ${
              index <= currentStep ? 'text-orange-600' : 'text-gray-400'
            }`}>
              {step}
            </p>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`h-0.5 w-16 mx-3 transition-all duration-200 ${
                index < currentStep ? 'bg-orange-500' : 'bg-gray-200'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  // Update renderStepContent for the new structure
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Extras Groups</h3>
              <p className="text-sm text-gray-600">Review and manage your existing extras groups</p>
            </div>

            {extraGroups.length === 0 ? (
              <Card className="border-dashed border-2 border-gray-200">
                <CardContent className="pt-8 pb-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Plus className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium mb-2">No extras groups created yet</p>
                    <p className="text-sm text-gray-400">Click "Create New Group" to get started!</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {extraGroups.map((group) => (
                  <Card key={group.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-stone-800 to-stone-700 text-white rounded-t-lg">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-white font-semibold">{group.title}</CardTitle>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditGroup(group)}
                            className="text-white hover:bg-white/20 h-8 w-8 p-0"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveGroup(group.id)}
                            className="text-white hover:bg-red-500/20 h-8 w-8 p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 font-medium">
                          {group.extras.length} variant{group.extras.length !== 1 ? 's' : ''} available
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {group.extras.slice(0, 6).map((extra) => (
                          <Badge
                            key={extra.id}
                            variant="outline"
                            className="bg-orange-50 text-orange-700 border-orange-200 text-xs px-2 py-1"
                          >
                            {extra.variant}
                          </Badge>
                        ))}
                        {group.extras.length > 6 && (
                          <Badge variant="outline" className="text-xs px-2 py-1 text-gray-500">
                            +{group.extras.length - 6} more
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="flex justify-center pt-4">
              <Button
                onClick={handleAddAnotherGroup}
                className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-8"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Group
              </Button>
            </div>

            
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {isEditing ? 'Edit Extras Group' : 'Create New Extras Group'}
              </h3>
              <p className="text-sm text-gray-600">
                {isEditing 
                  ? 'Edit your extras group title'
                  : 'Give your extras group a descriptive title'
                }
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="group-title" className="text-sm font-medium">Extras Title</Label>
              <Input
                id="group-title"
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                placeholder="e.g., Toppings, Sauces, Sides"
                className="h-11 text-base focus-visible:ring-orange-500 focus-visible:border-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">This will be displayed to customers when they select extras</p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-semibold text-gray-900">Add Variants</h3>
              <p className="text-sm text-gray-600">
                Adding variants for: <span className="font-medium text-[#fd683e]">{currentGroup?.title || 'New Group'}</span>
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex flex-col gap-2">
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
                              <MuiCheckbox
                                checked={selectedVariants.includes(opt.value)}
                                onChange={() => handleVariantSelect(opt.value, opt.label)}
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
              </div>
            </div>

            {currentGroup && currentGroup.extras.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Selected Variants ({currentGroup.extras.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {currentGroup.extras.map((extra) => (
                    <Badge
                      key={extra.id}
                      variant="secondary"
                      className="bg-orange-100 text-orange-800 hover:bg-orange-200 px-3 py-1.5 text-sm font-medium"
                    >
                      {extra.variant}
                      <button
                        onClick={() => handleVariantSelect(extra.inventoryId || '', extra.variant)}
                        className="ml-2 hover:bg-orange-300 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Update the dialog header and footer
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl font-semibold">
            {loading ? 'Loading Extras...' : (
              activeStep === 0 ? 'Manage Extras Groups' : (isEditing ? 'Edit Extras Group' : 'Create New Group')
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-2">
          <StepIndicator currentStep={activeStep} />
          <Separator className="mb-6" />
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : (
            <>
              {renderStepContent()}
              {saveError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{saveError}</p>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="px-6 pb-6 gap-3 border-t bg-gray-50/50 mt-6 pt-6">
          {activeStep > 0 && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          {activeStep === 0 ? (
            <Button
              onClick={handleSave}
              disabled={extraGroups.length === 0 || saveLoading}
              className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-8"
            >
              {saveLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Save All Changes
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={
                (activeStep === 1 && !groupTitle.trim()) ||
                (activeStep === 2 && (!currentGroup || currentGroup.extras.length === 0))
              }
              className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-8"
            >
              {activeStep === 2 ? 'Save Group' : 'Continue'}
              {activeStep !== 2 && (
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GroupExtrasModal; 