import React, { FunctionComponent, useState, useEffect, ReactElement } from "react";
import { IoMdAdd } from "react-icons/io";
import { Plus, Info } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../context/NotificationContext';
import { useUserProfile } from '../../hooks/useUserProfile';
import BranchFilter from '../../components/BranchFilter';
import { useTranslation } from 'react-i18next';
import { useLanguageChange } from '../../hooks/useLanguageChange';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { api, createExtrasGroup, getRestaurantExtrasGroups, editExtrasGroup, deleteExtrasGroup, getAllExtrasPerRestaurant, updateExtrasPrice } from '../../services/api';
import { 
  Paper, 
  List, 
  ListItem, 
  FormControlLabel, 
  Box, 
  Typography, 
  CircularProgress,
  Checkbox as MuiCheckbox,
  Modal
} from '@mui/material';
import axios from 'axios';
import ExtrasGroupMeta from '../../components/ExtrasGroupMeta';
import ConfirmationModal from '../../components/ConfirmationModal';

interface ExtrasProps {
  searchQuery?: string;
}

interface FoodItem {
  id: string;
  foodType: string;
  foodName: string;
  foodPrice: number;
  restaurantName: string;
  foodDescription?: string;
  foodImage: {
    url: string;
  };
}

// Interface for extras items
interface ExtrasItem {
  id: string;
  created_at: number;
  branchId: string;
  restaurantName: string;
  categoryId: string | null;
  foodType: string;
  foodName: string;
  foodPrice: number;
  updatedAt: string;
  foodDescription: string;
}

// Option type for dropdowns
type Option = { 
  label: string; 
  value: string;
  foodPrice: number;
};

interface ModifierItem {
  id: string;
  name: string;
  price: number;
  isSelected: boolean;
}

const Extras: FunctionComponent<ExtrasProps> = ({ searchQuery = '' }): ReactElement => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const { t } = useTranslation();
  useLanguageChange();

  const { user } = useAuth();
  const { userProfile } = useUserProfile();
  
  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => {
    return localStorage.getItem('selectedBranchId') || '';
  });

  // Form states
  const [title, setTitle] = useState('');
  const [presentationType, setPresentationType] = useState('multiple');
  const [requireCustomerSelection, setRequireCustomerSelection] = useState(false);
  const [allowMultipleItems, setAllowMultipleItems] = useState(false);
  const [selectedByDefault, setSelectedByDefault] = useState(false);
  const [foodTypes, setFoodTypes] = useState<Option[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  


  // Min/Max selection controls
  const [minSelection, setMinSelection] = useState<string>('');
  const [maxSelection, setMaxSelection] = useState<string>('');

  // View mode state
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'all-extras'>('list');
  const [existingGroups, setExistingGroups] = useState<any[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<any>(null);

  // All extras state
  const [allExtras, setAllExtras] = useState<ExtrasItem[]>([]);
  const [allExtrasLoading, setAllExtrasLoading] = useState(false);
  const [editingExtrasId, setEditingExtrasId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>('');
  const [updatingPrice, setUpdatingPrice] = useState(false);
  // Add state for search
  const [extrasSearch, setExtrasSearch] = useState('');
  // Add state for editing name
  const [editingName, setEditingName] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);

  const { restaurantData } = useUserProfile();

  // Fetch available food items
  useEffect(() => {
    const fetchFoodTypes = async () => {
      if (!restaurantData.id) return;

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
        // console.error('Error fetching food types:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFoodTypes();
  }, [restaurantData.id]);

  // Fetch existing extras groups
  const fetchExistingGroups = async () => {
    if (!restaurantData.id) return;
    try {
      setGroupsLoading(true);
      const response = await getRestaurantExtrasGroups(restaurantData.id);
      setExistingGroups(response.data || []);
    } catch (error) {
      // console.error('Error fetching existing groups:', error);
      addNotification({
        type: 'inventory_alert',
        message: 'Failed to load existing extras groups'
      });
    } finally {
      setGroupsLoading(false);
    }
  };

  // Fetch all extras
  const fetchAllExtras = async () => {
    if (!restaurantData.id) return;
    try {
      setAllExtrasLoading(true);
      const response = await getAllExtrasPerRestaurant(restaurantData.id);
      setAllExtras(response.data || []);
    } catch (error) {
      // console.error('Error fetching all extras:', error);
      addNotification({
        type: 'inventory_alert',
        message: 'Failed to load all extras'
      });
    } finally {
      setAllExtrasLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'list') {
      fetchExistingGroups();
    } else if (viewMode === 'all-extras') {
      fetchAllExtras();
    }
  }, [restaurantData.id, viewMode]);

  const handleBranchSelect = async (branchId: string) => {
    localStorage.setItem('selectedBranchId', branchId);
    setSelectedBranchId(branchId);
  };

  const handleAddGroup = () => {
    setViewMode('create');
    setEditingGroup(null); // Clear any editing state
  };

  const handleEditGroup = (group: any) => {
    setEditingGroup(group);
    setViewMode('create');
    
    // Prefill the form with existing group data
    setTitle(group.extrasTitle);
    setPresentationType(group.extrasType);
    setRequireCustomerSelection(group.required);
    
    // Set min/max selection if they exist
    if (group.extrasDetails && group.extrasDetails.length > 0) {
      const firstDetail = group.extrasDetails[0];
      setMinSelection(firstDetail.minSelection || '');
      setMaxSelection(firstDetail.maxSelection || '');
    }
    
    // Set selected variants
    const variantIds = group.extrasDetails.map((detail: { delika_inventory_table_id: string }) => detail.delika_inventory_table_id);
    setSelectedVariants(variantIds);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setEditingGroup(null); // Clear editing state
    handleCancel(); // Reset form when going back
  };

  const handleVariantSelect = (value: string, variantName: string) => {
    if (selectedVariants.includes(value)) {
      // Remove variant
      setSelectedVariants(prev => prev.filter(v => v !== value));
    } else {
      // Add variant
      setSelectedVariants(prev => [...prev, value]);
    }
  };

  const handleCreate = async () => {
    if (!title || (selectedVariants.length === 0)) {
      addNotification({
        type: 'inventory_alert',
        message: 'Please fill in all required fields and select at least one variant'
      });
      return;
    }

    // Validate min/max selection if both are set
    if (minSelection && maxSelection && parseInt(minSelection) > parseInt(maxSelection)) {
      addNotification({
        type: 'inventory_alert',
        message: 'Minimum selection cannot be greater than maximum selection'
      });
      return;
    }

    try {
      setSaveLoading(true);
      
      const payload = {
        restaurantId: restaurantData.id || '',
        extras: "{}",
        branchId: selectedBranchId,
        required: requireCustomerSelection,
        extrasType: presentationType,
        extrasTitle: title,
        minSelection: minSelection || null,
        maxSelection: maxSelection || null,
        existingExtras: selectedVariants.map(variantId => ({
          delika_inventory_table_id: variantId,
          minSelection: minSelection || null,
          maxSelection: maxSelection || null
        }))
      };

      if (editingGroup) {
        await editExtrasGroup(editingGroup.id, payload);
        addNotification({
          type: 'inventory_alert',
          message: 'Extras group updated successfully'
        });
      } else {
        await createExtrasGroup(payload);
        addNotification({
          type: 'inventory_alert',
          message: 'Extras group created successfully'
        });
      }
      
      // Reset form and go back to list view
      setTitle('');
      setSelectedVariants([]);
      setPresentationType('multiple');
      setRequireCustomerSelection(false);
      setAllowMultipleItems(false);
      setSelectedByDefault(false);
      setMinSelection('');
      setMaxSelection('');
      setViewMode('list');
      setEditingGroup(null);
    } catch (error) {
      // console.error('Error creating extras group:', error);
      addNotification({
        type: 'inventory_alert',
        message: 'Failed to create extras group. Please try again.'
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form
    setTitle('');
    setSelectedVariants([]);
    setPresentationType('multiple');
    setRequireCustomerSelection(false);
    setAllowMultipleItems(false);
    setSelectedByDefault(false);
    

    
    // Reset min/max selection
    setMinSelection('');
    setMaxSelection('');
  };

  const handleDeleteClick = (group: any) => {
    setGroupToDelete(group);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!groupToDelete) return;
    try {
      await deleteExtrasGroup(groupToDelete.id);
      addNotification({
        type: 'inventory_alert',
        message: 'Extras group deleted successfully'
      });
      setDeleteModalOpen(false);
      setGroupToDelete(null);
      // Refresh list
      fetchExistingGroups();
    } catch (error) {
      addNotification({
        type: 'inventory_alert',
        message: 'Failed to delete extras group'
      });
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setGroupToDelete(null);
  };

  // Handle price editing for extras
  const handleEditPrice = (extras: ExtrasItem) => {
    setEditingExtrasId(extras.id);
    setEditingPrice(extras.foodPrice.toString());
    setEditingName(extras.foodName);
    setEditModalOpen(true);
  };

  const handleSavePrice = async () => {
    if (!editingExtrasId || !editingPrice || !editingName) return;
    
    try {
      setUpdatingPrice(true);
      await updateExtrasPrice(editingExtrasId, parseFloat(editingPrice), editingName);
      
      // Update the local state
      setAllExtras(prev => prev.map(item => 
        item.id === editingExtrasId 
          ? { ...item, foodPrice: parseFloat(editingPrice), foodName: editingName }
          : item
      ));
      
      addNotification({
        type: 'inventory_alert',
        message: 'Updated successfully'
      });
      
      setEditingExtrasId(null);
      setEditingPrice('');
      setEditingName('');
      setEditModalOpen(false);
    } catch (error) {
      // console.error('Error updating price:', error);
      addNotification({
        type: 'inventory_alert',
        message: 'Failed to update'
      });
    } finally {
      setUpdatingPrice(false);
    }
  };

  const handleCancelEditPrice = () => {
    setEditingExtrasId(null);
    setEditingPrice('');
    setEditingName('');
    setEditModalOpen(false);
  };


  return (
    <div className="h-full w-full bg-white dark:bg-[#201a18] m-0 p-0">
      <div className="p-3 ml-4 mr-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-[18px] font-sans font-semibold">
              {viewMode === 'list' ? 'Extras Groups' : 
               viewMode === 'all-extras' ? 'All Extras' :
               editingGroup ? 'Edit Extras Group' : 'New Extras group'}
            </h1>
          </div>
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
            {viewMode === 'list' && (
              <>
                <Button 
                  onClick={() => setViewMode('all-extras')}
                  variant="outline"
                  className="border-orange-500 text-orange-500 hover:bg-orange-50"
                >
                  All Extras
                </Button>
                <Button 
                  onClick={handleAddGroup}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Group
                </Button>
              </>
            )}
            {viewMode === 'create' && (
              <Button 
                variant="outline"
                onClick={handleBackToList}
                className="border-orange-500 text-orange-500 hover:bg-orange-50"
              >
                Back to List
              </Button>
            )}
            {viewMode === 'all-extras' && (
              <Button 
                variant="outline"
                onClick={() => setViewMode('list')}
                className="border-orange-500 text-orange-500 hover:bg-orange-50"
              >
                Back to Groups
              </Button>
            )}
          </div>
        </div>

        {viewMode === 'list' ? (
          // List View - Show existing extras groups
          <div className="space-y-4">
            {groupsLoading ? (
              <div className="flex justify-center items-center h-32">
                <CircularProgress sx={{ color: '#fd683e' }} size={40} />
              </div>
            ) : existingGroups.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No extras groups found</p>
                <Button 
                  onClick={handleAddGroup}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Group
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {existingGroups.map((group) => (
                  <Card key={group.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {group.extrasTitle}
                        </h3>
                        <ExtrasGroupMeta 
                          extrasType={group.extrasType}
                          required={group.required}
                          count={group.extrasDetails.length}
                        />
                        <div className="flex flex-wrap gap-2">
                          {group.extrasDetails.map((detail: { delika_inventory_table_id: string; extrasDetails?: Array<{ foodName: string }> }, index: number) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="bg-orange-100 text-orange-800"
                            >
                              {detail.extrasDetails?.[0]?.foodName || 'Unknown Item'}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditGroup(group)}>
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50" onClick={() => handleDeleteClick(group)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : viewMode === 'all-extras' ? (
          // All Extras View
          <div className="space-y-4">
            <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <h2 className="text-xl font-bold text-orange-700 bg-orange-50 px-4 py-2 rounded-md w-fit mb-2 md:mb-0">All Extras</h2>
              <Input
                type="text"
                placeholder="Search extras by name..."
                value={extrasSearch}
                onChange={e => setExtrasSearch(e.target.value)}
                className="w-full md:w-72 border-orange-200 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>
            {allExtrasLoading ? (
              <div className="flex justify-center items-center h-32">
                <CircularProgress sx={{ color: '#fd683e' }} size={40} />
              </div>
            ) : allExtras.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No extras found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allExtras
                  .filter(extras => extras.foodName.toLowerCase().includes(extrasSearch.toLowerCase()))
                  .map((extras) => (
                    <Card key={extras.id} className="p-3 rounded-md shadow-sm border mb-2" style={{ borderColor: '#d1d5db' }}>
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="font-semibold text-lg mb-1 text-black">{extras.foodName}</div>
                          <div className="text-sm text-black mb-1"><span className="font-medium">Price:</span> GH₵{extras.foodPrice}</div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleEditPrice(extras)}>
                          Edit
                        </Button>
                      </div>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        ) : (
          // Create View - Show the existing form
          <div className="space-y-6">
          {/* Title Section */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium flex items-center gap-1">
              Extras Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your extras a title? For example: 'Cheese levels' or 'Select toppings'"
              className="w-full focus:ring-orange-500 focus:border-orange-500"
              required
            />
          </div>



          {/* Variant Selection Section */}
          <div className="mt-8 space-y-4">
            <div>
              <Label className="text-sm font-medium">Select variants from existing items</Label>
              <p className="text-xs text-gray-500 mt-1">
                Choose from available menu items to include as variants
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
                                  Price: GH₵{opt.foodPrice}
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

            {/* Selected Variants Display */}
            {selectedVariants.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Selected Variants ({selectedVariants.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedVariants.map((variantId) => {
                    const variant = foodTypes.find(opt => opt.value === variantId);
                    return variant ? (
                      <Badge
                        key={variantId}
                        variant="secondary"
                        className="bg-orange-100 text-orange-800 hover:bg-orange-200 px-3 py-1.5 text-sm font-medium"
                      >
                        {variant.label}
                        <button
                          onClick={() => handleVariantSelect(variantId, variant.label)}
                          className="ml-2 hover:bg-orange-300 rounded-full p-0.5 transition-colors"
                        >
                          ×
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Selection Presentation */}
          <div className="mt-8 space-y-4">
            <div>
              <Label className="text-sm font-medium flex items-center gap-1">
                How should customers select these extras?
              </Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Single Choice */}
              <Card 
                className={`cursor-pointer transition-all ${
                  presentationType === 'single' 
                    ? 'ring-2 ring-orange-500 bg-orange-50' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setPresentationType('single')}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <RadioGroup value={presentationType} onValueChange={setPresentationType}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="single" id="single" />
                        </div>
                      </RadioGroup>
                    </div>
                    <div>
                      <Label htmlFor="single" className="text-base font-medium block mb-1">Single choice</Label>
                      <p className="text-sm text-gray-600 mb-2">
                        Customers must select exactly one option
                      </p>
                      <p className="text-xs text-gray-500">
                        Perfect for: Spice levels, sizes, cooking preferences
                      </p>
                      
                      {presentationType === 'single' && (
                        <div className="space-y-3 pt-2 border-t border-gray-200 mt-3">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="require-selection-single"
                              checked={requireCustomerSelection}
                              onCheckedChange={(checked) => setRequireCustomerSelection(checked === true)}
                            />
                            <Label htmlFor="require-selection-single" className="text-sm">
                              Require customer to make a selection
                            </Label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Multiple Choice */}
              <Card 
                className={`cursor-pointer transition-all ${
                  presentationType === 'multiple' 
                    ? 'ring-2 ring-orange-500 bg-orange-50' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setPresentationType('multiple')}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <RadioGroup value={presentationType} onValueChange={setPresentationType}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="multiple" id="multiple" />
                        </div>
                      </RadioGroup>
                    </div>
                    <div>
                      <Label htmlFor="multiple" className="text-base font-medium block mb-1">Multiple choices</Label>
                      <p className="text-sm text-gray-600 mb-2">
                        Customers can select multiple options
                      </p>
                      <p className="text-xs text-gray-500 mb-3">
                        Perfect for: Toppings, add-ons, extra ingredients
                      </p>
                      
                      {presentationType === 'multiple' && (
                        <div className="space-y-3 pt-2 border-t border-gray-200">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="require-selection"
                              checked={requireCustomerSelection}
                              onCheckedChange={(checked) => setRequireCustomerSelection(checked === true)}
                            />
                            <Label htmlFor="require-selection" className="text-sm">
                              Require at least one selection
                            </Label>
                          </div>
                          
                          
                          {/* Min/Max Selection Controls */}
                          <div className="grid grid-cols-2 gap-8 pt-2">
                            <div className="space-y-2 w-[180px]">
                              <Label htmlFor="min-selection" className="text-sm font-medium">
                                Minimum selections
                              </Label>
                              <Input
                                id="min-selection"
                                type="number"
                                value={minSelection}
                                onChange={(e) => setMinSelection(e.target.value)}
                                placeholder="0"
                                min="0"
                                className="w-full"
                              />
                              <p className="text-xs text-gray-500">
                                Leave empty for no minimum
                              </p>
                            </div>
                            <div className="space-y-2 w-[180px]">
                              <Label htmlFor="max-selection" className="text-sm font-medium">
                                Maximum selections
                              </Label>
                              <Input
                                id="max-selection"
                                type="number"
                                value={maxSelection}
                                onChange={(e) => setMaxSelection(e.target.value)}
                                placeholder="No limit"
                                min="1"
                                className="w-full"
                              />
                              <p className="text-xs text-gray-500">
                                Leave empty for no limit
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 pb-6">
            <Button 
              variant="outline"
              onClick={handleCancel}
              className="px-6 py-2 border-orange-500 text-orange-500 hover:bg-orange-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={!title || (!selectedVariants.length) || !presentationType}
              className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white"
            >
              {saveLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {editingGroup ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingGroup ? 'Update' : 'Create'
              )}
            </Button>
          </div>
        </div>
        )}
      </div>
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Confirm Delete"
        message={`Are you sure you want to delete the extras group "${groupToDelete?.extrasTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
      {/* Edit Modal */}
      <Modal open={editModalOpen} onClose={handleCancelEditPrice}>
        <Box className="bg-white rounded-lg shadow-lg p-6 w-[full] max-w-xs mx-auto mt-32 flex flex-col gap-4">
          <div className="font-semibold text-lg mb-2">Edit Extra</div>
          <Input
            type="text"
            value={editingName}
            onChange={e => setEditingName(e.target.value)}
            className="w-[300px] text-base"
            placeholder="Name"
          />
          <Input
            type="number"
            value={editingPrice}
            onChange={e => setEditingPrice(e.target.value)}
            className="w-[300px] text-base"
            placeholder="Price"
          />
          <div className="flex gap-2 justify-end mt-2">
            <Button onClick={handleCancelEditPrice} variant="outline">Cancel</Button>
            <Button onClick={handleSavePrice} disabled={updatingPrice} className="bg-orange-600 hover:bg-orange-700 text-white">
              {updatingPrice ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </Box>
      </Modal>
    </div>
  );
};

export default Extras; 