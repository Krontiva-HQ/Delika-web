import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { SelectedItemExtra } from '../types/order';

interface Selection {
  id: string;
  foodName: string;
  foodPrice: number;
  foodDescription?: string;
  groupTitle?: string;
  groupType?: string;
  required?: boolean;
  minSelection?: number;
  maxSelection?: number;
}

interface SelectExtrasModalProps {
  open: boolean;
  onClose: () => void;
  extras: SelectedItemExtra[];
  onConfirm: (selectedExtras: { [key: string]: Selection[] }) => void;
  itemName: string;
}

const SelectExtrasModal: React.FC<SelectExtrasModalProps> = ({
  open,
  onClose,
  extras,
  onConfirm,
  itemName
}) => {
  // State to track selected extras for each group
  const [selectedExtras, setSelectedExtras] = useState<{ [key: string]: Selection[] }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSingleSelection = (groupId: string, item: Selection) => {
    const newSelectedExtras = {
      ...selectedExtras,
      [groupId]: [item]
    };
    setSelectedExtras(newSelectedExtras);
    
    // Clear error when selection is made
    setErrors(prev => ({
      ...prev,
      [groupId]: ''
    }));

    // Immediately add the selected item to the selected items
    const enrichedSelections = Object.entries(newSelectedExtras).reduce((acc, [groupId, selections]) => {
      const group = extras.find(e => e.extrasDetails.id === groupId);
      if (!group) return acc;

      acc[groupId] = selections.map(selection => ({
        ...selection,
        groupTitle: group.extrasDetails.extrasTitle,
        groupType: group.extrasDetails.extrasType,
        required: group.extrasDetails.required,
        minSelection: group.extrasDetails.extrasDetails[0]?.minSelection,
        maxSelection: group.extrasDetails.extrasDetails[0]?.maxSelection
      }));
      return acc;
    }, {} as { [key: string]: Selection[] });

    onConfirm(enrichedSelections);
  };

  const handleMultipleSelection = (groupId: string, item: Selection, checked: boolean) => {
    const newSelectedExtras = {
      ...selectedExtras,
      [groupId]: checked 
        ? [...(selectedExtras[groupId] || []), item]
        : (selectedExtras[groupId] || []).filter(i => i.id !== item.id)
    };
    
    setSelectedExtras(newSelectedExtras);
    
    // Clear error when selection is made
    setErrors(prev => ({
      ...prev,
      [groupId]: ''
    }));

    // Immediately add the selected items to the selected items
    const enrichedSelections = Object.entries(newSelectedExtras).reduce((acc, [groupId, selections]) => {
      const group = extras.find(e => e.extrasDetails.id === groupId);
      if (!group) return acc;

      acc[groupId] = selections.map(selection => ({
        ...selection,
        groupTitle: group.extrasDetails.extrasTitle,
        groupType: group.extrasDetails.extrasType,
        required: group.extrasDetails.required,
        minSelection: group.extrasDetails.extrasDetails[0]?.minSelection,
        maxSelection: group.extrasDetails.extrasDetails[0]?.maxSelection
      }));
      return acc;
    }, {} as { [key: string]: Selection[] });

    onConfirm(enrichedSelections);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Extras for {itemName}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {extras.map((extra) => (
            <div key={extra.extrasDetails.id} className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">
                  {extra.extrasDetails.extrasTitle}
                  {extra.extrasDetails.required && <span className="text-red-500 ml-1">*</span>}
                </h3>
              </div>

              {errors[extra.extrasDetails.id] && (
                <p className="text-sm text-red-500 mb-2">{errors[extra.extrasDetails.id]}</p>
              )}

              {extra.extrasDetails.extrasType === 'multiple' ? (
                <div className="space-y-2">
                  {extra.extrasDetails.extrasDetails.map((detail) => (
                    detail.inventoryDetails.map((item) => (
                      <div key={item.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={item.id}
                          checked={(selectedExtras[extra.extrasDetails.id] || []).some(i => i.id === item.id)}
                          onCheckedChange={(checked) => 
                            handleMultipleSelection(extra.extrasDetails.id, item, checked as boolean)
                          }
                        />
                        <Label htmlFor={item.id} className="flex-1">
                          {item.foodName}
                        </Label>
                        <span className="text-sm text-gray-600">
                          GH₵{item.foodPrice}
                        </span>
                      </div>
                    ))
                  ))}
                </div>
              ) : (
                <RadioGroup
                  value={(selectedExtras[extra.extrasDetails.id]?.[0]?.id || '')}
                  onValueChange={(value) => {
                    const item = extra.extrasDetails.extrasDetails
                      .flatMap(d => d.inventoryDetails)
                      .find(i => i.id === value);
                    if (item) {
                      handleSingleSelection(extra.extrasDetails.id, item);
                    }
                  }}
                >
                  {extra.extrasDetails.extrasDetails.map((detail) => (
                    detail.inventoryDetails.map((item) => (
                      <div key={item.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={item.id} id={item.id} />
                        <Label htmlFor={item.id} className="flex-1">
                          {item.foodName}
                        </Label>
                        <span className="text-sm text-gray-600">
                          GH₵{item.foodPrice}
                        </span>
                      </div>
                    ))
                  ))}
                </RadioGroup>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SelectExtrasModal; 