import React, { useState, useRef, useEffect, FunctionComponent } from 'react';
import { Button, Modal } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Button as UIButton } from './ui/button';
import { getRestaurantExtrasGroups } from '../services/api';

// Updated interfaces for the new menu structure
interface InventoryDetail {
  id: string;
  foodName: string;
  foodPrice: number;
  foodDescription: string;
}

interface ExtraDetail {
  delika_inventory_table_id: string;
  minSelection?: number;
  maxSelection?: number;
  inventoryDetails: InventoryDetail[];
}

interface ExtraGroup {
  delika_extras_table_id: string;
  extrasDetails: {
    id: string;
    extrasTitle: string;
    extrasType: string;
    required: boolean;
    extrasDetails: ExtraDetail[];
  };
}

interface MenuItem {
  name: string;
  price: number;
  description: string;
  quantity: number;
  available: boolean;
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
  extras?: ExtraGroup[];
}

interface EditInventoryModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onSave: (id: string, newPrice: number, available: boolean, itemExtras: ExtraGroup[], name: string, description: string, imageFile?: File) => void;
  onDelete: (item: MenuItem) => void;
  isUpdating: boolean;
  updateError: string | null;
  branchId: string;
  selectedItemExtras: ExtraGroup[];
}

const EditInventoryModal: FunctionComponent<EditInventoryModalProps & { restaurantId: string }> = ({ item, onClose, onSave, onDelete, isUpdating, updateError, branchId, selectedItemExtras, restaurantId }) => {
  if (!item) return null;
  const { t } = useTranslation();
  const [price, setPrice] = useState(item.price);
  const [available, setAvailable] = useState(item.available);
  const [editForm, setEditForm] = useState({
    name: item.name,
    description: item.description || '',
    image: item.foodImage.url
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(item.foodImage.url);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // For extras group selection
  const [allExtrasGroups, setAllExtrasGroups] = useState<any[]>([]);
  const [loadingExtrasGroups, setLoadingExtrasGroups] = useState(false);

  // Use the selectedItemExtras from props, or initialize from item.extras
  const [itemExtras, setItemExtras] = useState<ExtraGroup[]>(() => {
    if (selectedItemExtras.length > 0) {
      return selectedItemExtras;
    }
    if (!item.extras) return [];
    return item.extras;
  });

  // Fetch all extras groups when entering edit mode
  useEffect(() => {
    if (isEditMode) {
      setLoadingExtrasGroups(true);
      getRestaurantExtrasGroups(restaurantId)
        .then(res => setAllExtrasGroups(res.data || []))
        .finally(() => setLoadingExtrasGroups(false));
    }
  }, [isEditMode, restaurantId]);

  // Update itemExtras when selectedItemExtras changes
  useEffect(() => {
    if (selectedItemExtras.length > 0) {
      setItemExtras(selectedItemExtras);
    }
  }, [selectedItemExtras]);

  const handleEditToggle = () => {
    setIsEditMode(!isEditMode);
  };

  const handleModalClose = () => {
    setIsEditMode(false);
    onClose();
  };

  const handleImageClick = () => {
    if (isEditMode && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Create a preview URL for the selected image
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setEditForm(prev => ({
        ...prev,
        image: url
      }));
    }
  };

  // Handle checking/unchecking an extras group
  const handleExtrasGroupToggle = (group: any) => {
    const exists = itemExtras.some(g => g.delika_extras_table_id === group.id);
    if (exists) {
      setItemExtras(itemExtras.filter(g => g.delika_extras_table_id !== group.id));
    } else {
      // Convert group to ExtraGroup format
      setItemExtras([
        ...itemExtras,
        {
          delika_extras_table_id: group.id,
          extrasDetails: {
            id: group.id,
            extrasTitle: group.extrasTitle,
            extrasType: group.extrasType || 'multiple',
            required: group.required || false,
            extrasDetails: group.extrasDetails || []
          }
        }
      ]);
    }
  };

  const handleSave = () => {
    onSave(item.name, price, available, itemExtras, editForm.name, editForm.description, imageFile || undefined);
  };

  return (
    <Modal
      open={true}
      onClose={handleModalClose}
      className="flex items-center justify-center p-4"
      style={{ zIndex: 1500 }}
    >
      <div className="bg-white dark:bg-[#2c2522] rounded-lg p-3 sm:p-4 w-full max-w-[95%] sm:max-w-[85%] md:max-w-[800px] mx-auto max-h-[85vh] overflow-y-auto relative shadow-xl border border-gray-100">
        {/* Edit Button at Top Right */}
        <Button
          onClick={handleEditToggle}
          variant="outlined"
          className="z-10"
          style={{
            position: 'absolute',
            top: '12px',
            right: '24px',
            backgroundColor: isEditMode ? '#fd683e' : '#201a18',
            borderColor: isEditMode ? '#fd683e' : '#201a18',
            color: 'white',
            padding: '4px 12px',
            fontSize: '10px',
            borderRadius: '4px',
            minWidth: '60px'
          }}
        >
          {isEditMode ? 'Cancel' : 'Edit'}
        </Button>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mt-6">
          {/* Left Column - Main Item Details */}
          <div className="flex flex-col gap-3 bg-gray-50 dark:bg-[#201a18] rounded-lg p-4">
            {isEditMode ? (
              <div className="space-y-6">
                {/* Image Upload Section */}
                <Card className="bg-white dark:bg-[#2c2522] border-gray-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#fd683e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                      Item Image
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <img
                      src={previewUrl}
                      alt={editForm.name}
                      className="w-full h-[200px] object-cover rounded-lg border-2 border-dashed border-gray-300"
                    />
                  </CardContent>
                </Card>
                {/* Item Details Section */}
                <Card className="bg-white dark:bg-[#2c2522] border-gray-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#fd683e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                      Item Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 w-[270px] ">
                    <div className="space-y-2">
                      <Label htmlFor="item-name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Item Name
                      </Label>
                      <Input
                        id="item-name"
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({
                          ...prev,
                          name: e.target.value
                        }))}
                        placeholder="Enter item name"
                        className="border-gray-300 focus:border-[#fd683e] focus:ring-[#fd683e]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="item-description" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Description
                      </Label>
                      <Textarea
                        id="item-description"
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({
                          ...prev,
                          description: e.target.value
                        }))}
                        placeholder="Enter item description"
                        rows={3}
                        className="border-gray-300 focus:border-[#fd683e] focus:ring-[#fd683e] resize-none"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-0.5">
                      <label className="text-xs text-gray-600 font-sans">Item Name</label>
                      <h2 className="text-md sm:text-lg font-semibold">{item.name}</h2>
                    </div>
                    <Badge 
                      className={item.available 
                        ? "w-fit bg-green-100 text-green-800 border-green-200 hover:bg-green-200" 
                        : "w-fit bg-red-100 text-red-800 border-red-200 hover:bg-red-200"}
                    >
                      {item.available ? t('inventory.available') : t('inventory.unavailable')}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-xs text-gray-600 font-sans">Item Description</label>
                    <p className="text-sm text-black">{item.description || 'No description available'}</p>
                  </div>
                </div>
                <img
                  src={previewUrl}
                  alt={item.name}
                  className="w-full h-[200px] sm:h-[250px] object-cover rounded-lg"
                  loading="eager"
                />
              </>
            )}
          </div>
          {/* Right Column - Extras and Controls */}
          <div className="flex flex-col gap-3 bg-gray-50 dark:bg-[#201a18] rounded-lg p-4">
            {/* Extras Section */}
            <Card className="bg-white dark:bg-[#2c2522] border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#fd683e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Extras Available
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {itemExtras && Array.isArray(itemExtras) && itemExtras.length > 0 ? (
                  <div className="space-y-3 max-h-[200px] overflow-y-auto">
                    {itemExtras.map((group, index) => (
                      <div key={group.delika_extras_table_id || `group-${index}`} className="border border-gray-200 rounded-lg p-3 bg-gray-50 dark:bg-[#201a18]">
                        <h4 className="text-sm font-medium text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                          <div className="w-2 h-2 bg-[#fd683e] rounded-full"></div>
                          {group.extrasDetails?.extrasTitle || 'Unknown Group'}
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {group.extrasDetails?.extrasDetails?.map((detail, detailIndex) => 
                            detail.inventoryDetails?.map((inventoryDetail, inventoryIndex) => (
                              <div key={`${detail.delika_inventory_table_id}-${inventoryIndex}`} className="bg-white dark:bg-[#2c2522] rounded-lg border border-gray-200 p-2 text-center hover:shadow-sm transition-shadow">
                                <div className="text-xs font-medium text-gray-800 dark:text-white leading-tight mb-1">
                                  {inventoryDetail.foodName}
                                </div>
                                <div className="text-xs font-semibold text-[#fd683e]">
                                  GH₵{inventoryDetail.foodPrice}
                                </div>
                              </div>
                            )) || []
                          ) || []}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-[#201a18] rounded-full flex items-center justify-center mb-3">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 1L5 5l4 4"></path>
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">No extras available</p>
                    <p className="text-xs text-gray-400">This menu item currently has no additional extras or add-ons</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Select Extras Groups Section - Only in Edit Mode */}
            {isEditMode && (
              <Card className="bg-white dark:bg-[#2c2522] border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#fd683e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Select Extras Groups
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingExtrasGroups ? (
                    <div className="text-center py-4">Loading extras groups...</div>
                  ) : allExtrasGroups.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">No extras groups found.</div>
                  ) : (
                    <div className="space-y-2">
                      {allExtrasGroups.map((group) => {
                        const checked = itemExtras.some(g => g.delika_extras_table_id === group.id);
                        return (
                          <label key={group.id} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleExtrasGroupToggle(group)}
                            />
                            <span className="font-medium">{group.extrasTitle}</span>
                            <span className="text-xs text-gray-500">({group.extrasDetails?.length || 0} items)</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Pricing & Availability Section */}
            <Card className="bg-white dark:bg-[#2c2522] border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#fd683e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                  </svg>
                  Pricing & Availability
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isEditMode ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Price (GHS)</Label>
                      <div className="text-2xl font-bold text-[#fd683e]">GH₵{item.price}</div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Availability</Label>
                      <Badge 
                        className={item.available 
                          ? "w-fit bg-green-100 text-green-800 border-green-200 hover:bg-green-200" 
                          : "w-fit bg-red-100 text-red-800 border-red-200 hover:bg-red-200"}
                      >
                        {item.available ? t('inventory.available') : t('inventory.unavailable')}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="price-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Price (GHS)
                      </Label>
                      <div className="relative w-[240px] mb-6">
                        <div className="relative w-full max-w-xs">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">GH₵</span>
                          <Input
                            id="price-input"
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(Number(e.target.value))}
                            className="pl-14 border-gray-300 focus:border-[#fd683e] focus:ring-[#fd683e]"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Availability
                      </Label>
                      <div className="flex items-center space-x-3">
                        <Switch
                          checked={available}
                          onCheckedChange={(checked: boolean) => setAvailable(checked)}
                          className="data-[state=checked]:bg-[#fd683e]"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {available ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>
                    </div>
                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 pt-4 mt-6 justify-between">
                      <div className="flex gap-3">
                        <UIButton
                          onClick={onClose}
                          variant="outline"
                          className="flex-1 min-w-[100px]"
                        >
                          Cancel
                        </UIButton>
                        <UIButton
                          onClick={() => onDelete(item)}
                          variant="outline"
                          className="flex-1 min-w-[120px] border-red-500 text-red-500 hover:bg-red-50 hover:border-red-600"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                          Delete Item
                        </UIButton>
                      </div>
                      <UIButton
                        onClick={handleSave}
                        className="flex-1 min-w-[140px] bg-[#fd683e] hover:bg-[#e54d0e] text-white"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Save Changes
                      </UIButton>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EditInventoryModal; 