import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { getRestaurantExtrasGroups } from '../services/api';
import { useUserProfile } from '../hooks/useUserProfile';
import { CircularProgress } from '@mui/material';
import ExtrasGroupMeta from './ExtrasGroupMeta';

interface ExtrasGroup {
  id: string;
  extrasTitle: string;
  extrasType: string;
  required: boolean;
  extrasDetails: Array<{
    delika_inventory_table_id: string;
    extrasDetails: Array<{
      foodName: string;
      foodPrice: string;
      foodDescription: string;
    }>;
  }>;
}

interface SelectExtrasGroupsModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (selectedGroups: ExtrasGroup[]) => void;
  initialSelectedGroups?: ExtrasGroup[];
}

const SelectExtrasGroupsModal: React.FC<SelectExtrasGroupsModalProps> = ({
  open,
  onClose,
  onSelect,
  initialSelectedGroups = []
}) => {
  const [existingGroups, setExistingGroups] = useState<ExtrasGroup[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<ExtrasGroup[]>(initialSelectedGroups);
  const [loading, setLoading] = useState(false);
  const { restaurantData } = useUserProfile();

  // Fetch existing extras groups
  useEffect(() => {
    const fetchExistingGroups = async () => {
      if (!open || !restaurantData.id) return;
      
      try {
        setLoading(true);
        const response = await getRestaurantExtrasGroups(restaurantData.id);
        setExistingGroups(response.data || []);
      } catch (error) {
        // console.error('Error fetching existing groups:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExistingGroups();
  }, [open, restaurantData.id]);

  const handleGroupToggle = (group: ExtrasGroup) => {
    const isSelected = selectedGroups.some(g => g.id === group.id);
    
    if (isSelected) {
      setSelectedGroups(prev => prev.filter(g => g.id !== group.id));
    } else {
      setSelectedGroups(prev => [...prev, group]);
    }
  };

  const handleConfirm = () => {
    onSelect(selectedGroups);
    onClose();
  };

  const handleCancel = () => {
    setSelectedGroups(initialSelectedGroups);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" aria-describedby="select-extras-description">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Select Extras Groups
          </DialogTitle>
        </DialogHeader>
        <DialogDescription id="select-extras-description">
          Select one or more extras groups to attach to this menu item.
        </DialogDescription>

        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <CircularProgress sx={{ color: '#fd683e' }} size={40} />
            </div>
          ) : existingGroups.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-2">No extras groups found</p>
              <p className="text-sm text-gray-400">
                Create extras groups in the Extras section first
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {existingGroups.map((group) => {
                const isSelected = selectedGroups.some(g => g.id === group.id);
                
                return (
                  <Card 
                    key={group.id} 
                    className={`cursor-pointer transition-all ${
                      isSelected 
                        ? 'ring-2 ring-orange-500 bg-orange-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleGroupToggle(group)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleGroupToggle(group)}
                            className="data-[state=checked]:bg-orange-500"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {group.extrasTitle}
                            </h3>
                          </div>
                          
                          <ExtrasGroupMeta 
                            extrasType={group.extrasType}
                            required={group.required}
                            count={group.extrasDetails.length}
                          />
                          
                          <div className="flex flex-wrap gap-2 mt-3">
                            {group.extrasDetails.map((detail, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="bg-orange-100 text-orange-800 text-xs"
                              >
                                {detail.extrasDetails[0]?.foodName || 'Unknown Item'}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={selectedGroups.length === 0}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            Select {selectedGroups.length} Group{selectedGroups.length !== 1 ? 's' : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SelectExtrasGroupsModal; 