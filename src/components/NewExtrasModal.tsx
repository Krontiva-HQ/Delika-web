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
import { api } from '../services/api';
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

interface NewExtrasModalProps {
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

const steps = ['Enter extras title', 'Add extras', 'Review extras'];

const NewExtrasModal: React.FC<NewExtrasModalProps> = ({
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

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Extras Group</h3>
              <p className="text-sm text-gray-600">Give your extras group a descriptive title</p>
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
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Add variants for: <span className="text-orange-600">{currentGroup?.title}</span>
              </h3>
              <p className="text-sm text-gray-600">Select items from your inventory to add as extras</p>
            </div>
            
            <Card className="border-orange-100 bg-orange-50/30">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Label htmlFor="variant-select" className="text-sm font-medium mb-2 block">Select Variant</Label>
                    <Select value={variant} onValueChange={setVariant} disabled={loading}>
                      <SelectTrigger className="h-11 focus:ring-orange-500 focus:border-orange-500">
                        <SelectValue placeholder={loading ? "Loading options..." : "Choose a variant..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {foodTypes.map(opt => (
                          <SelectItem key={opt.value} value={opt.value} className="cursor-pointer">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleAddVariant}
                      disabled={!variant || loading}
                      className="h-11 bg-orange-500 hover:bg-orange-600 text-white font-medium px-6"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {currentGroup && currentGroup.extras.length > 0 && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Added Variants ({currentGroup.extras.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {currentGroup.extras.map((extra) => (
                      <Badge
                        key={extra.id}
                        variant="secondary"
                        className="bg-orange-100 text-orange-800 hover:bg-orange-200 px-3 py-1.5 text-sm font-medium"
                      >
                        {extra.variant}
                        <button
                          onClick={() => handleRemoveVariant(extra.id)}
                          className="ml-2 hover:bg-orange-300 rounded-full p-0.5 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Review Your Extras</h3>
              <p className="text-sm text-gray-600">Review and manage your extras groups before saving</p>
            </div>

            {extraGroups.length === 0 ? (
              <Card className="border-dashed border-2 border-gray-200">
                <CardContent className="pt-8 pb-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Plus className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium mb-2">No extras groups created yet</p>
                    <p className="text-sm text-gray-400">Click "Add Another Group" to get started!</p>
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

            <Button
              onClick={handleAddAnotherGroup}
              variant="outline"
              className="w-full border-orange-500 text-orange-600 hover:bg-orange-50 h-11 font-medium"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Group
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl font-semibold">Add Extras to Menu Item</DialogTitle>
        </DialogHeader>
        
        <div className="px-6 pb-2">
          <StepIndicator currentStep={activeStep} />
          <Separator className="mb-6" />
          {renderStepContent()}
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
          {activeStep === 2 ? (
            <Button
              onClick={handleSave}
              disabled={extraGroups.length === 0}
              className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-8"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              Save All Extras
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={
                (activeStep === 0 && !groupTitle.trim()) ||
                (activeStep === 1 && (!currentGroup || currentGroup.extras.length === 0))
              }
              className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-8"
            >
              Continue
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewExtrasModal; 