import React, { useState, useEffect } from 'react';
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

interface ExtrasSelectionInlineProps {
  extras: SelectedItemExtra[];
  onConfirm: (selectedExtras: { [key: string]: Selection[] }) => void;
  itemName: string;
  existingSelections?: { [key: string]: Selection[] }; // Add this prop
}

const ExtrasSelectionInline: React.FC<ExtrasSelectionInlineProps> = ({
  extras,
  onConfirm,
  itemName,
  existingSelections = {} // Default to empty object
}) => {
  const [selectedExtras, setSelectedExtras] = useState<{ [key: string]: Selection[] }>(existingSelections);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Update selectedExtras when existingSelections prop changes
  useEffect(() => {
    setSelectedExtras(existingSelections);
  }, [existingSelections]);

  const handleSingleSelection = (groupId: string, item: Selection) => {
    console.log('🎯 Single Selection - Selected Item:', {
      groupId,
      itemName: item.foodName,
      itemId: item.id,
      itemPrice: item.foodPrice
    });

    const newSelectedExtras = {
      [groupId]: [item]
    };
    setSelectedExtras(newSelectedExtras);

    setErrors(prev => ({
      ...prev,
      [groupId]: ''
    }));

    // Only call onConfirm if there is a selection
    if (item) {
      const group = extras.find(e => e.extrasDetails.id === groupId);
      if (!group) return;
      const enrichedSelections = {
        [groupId]: [{
          ...item,
          groupTitle: group.extrasDetails.extrasTitle,
          groupType: group.extrasDetails.extrasType,
          required: group.extrasDetails.required,
          minSelection: group.extrasDetails.extrasDetails[0]?.minSelection,
          maxSelection: group.extrasDetails.extrasDetails[0]?.maxSelection
        }]
      };
      
      console.log('📤 Sending to onConfirm (Single):', {
        groupId,
        groupTitle: group.extrasDetails.extrasTitle,
        selectedItems: enrichedSelections[groupId].map(item => ({
          name: item.foodName,
          id: item.id,
          price: item.foodPrice
        })),
        totalItems: enrichedSelections[groupId].length
      });
      
      onConfirm(enrichedSelections);
    }
  };

  const handleMultipleSelection = (groupId: string, item: Selection, checked: boolean) => {
    console.log('🎯 Multiple Selection:', {
      groupId,
      itemName: item.foodName,
      itemId: item.id,
      checked,
      action: checked ? 'ADDING' : 'REMOVING'
    });

    const currentSelections = selectedExtras[groupId] || [];
    let updatedSelections;
    if (checked) {
      updatedSelections = [...currentSelections, item];
    } else {
      updatedSelections = currentSelections.filter(i => i.id !== item.id);
    }
    
    console.log('📋 Updated Selections for Group:', {
      groupId,
      beforeCount: currentSelections.length,
      afterCount: updatedSelections.length,
      items: updatedSelections.map(s => s.foodName)
    });

    const newSelectedExtras = {
      [groupId]: updatedSelections
    };
    setSelectedExtras(newSelectedExtras);

    setErrors(prev => ({
      ...prev,
      [groupId]: ''
    }));

    if (updatedSelections.length > 0) {
      const group = extras.find(e => e.extrasDetails.id === groupId);
      if (!group) return;
      const enrichedSelections = {
        [groupId]: updatedSelections.map(selection => ({
          ...selection,
          groupTitle: group.extrasDetails.extrasTitle,
          groupType: group.extrasDetails.extrasType,
          required: group.extrasDetails.required,
          minSelection: group.extrasDetails.extrasDetails[0]?.minSelection,
          maxSelection: group.extrasDetails.extrasDetails[0]?.maxSelection
        }))
      };
      
      console.log('📤 Sending to onConfirm (Multiple):', {
        groupId,
        groupTitle: group.extrasDetails.extrasTitle,
        selectedItems: enrichedSelections[groupId].map(item => ({
          name: item.foodName,
          id: item.id,
          price: item.foodPrice
        })),
        totalItems: enrichedSelections[groupId].length
      });
      
      onConfirm(enrichedSelections);
    } else {
      console.log('❌ No selections to send to onConfirm');
    }
  };

  return (
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {extra.extrasDetails.extrasDetails.map((detail) => (
                detail.inventoryDetails.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-[#fd683e] transition-colors">
                    <div className="flex items-center space-x-2 flex-1">
                      <Checkbox
                        id={item.id}
                        checked={(selectedExtras[extra.extrasDetails.id] || []).some(i => i.id === item.id)}
                        onCheckedChange={(checked) => 
                          handleMultipleSelection(extra.extrasDetails.id, item, checked as boolean)
                        }
                      />
                      <Label htmlFor={item.id} className="flex-1 cursor-pointer">
                        {item.foodName}
                      </Label>
                    </div>
                    <span className="text-sm font-medium text-[#fd683e]">
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
              className="grid grid-cols-1 md:grid-cols-2 gap-2"
            >
              {extra.extrasDetails.extrasDetails.map((detail) => (
                detail.inventoryDetails.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-[#fd683e] transition-colors">
                    <div className="flex items-center space-x-2 flex-1">
                      <RadioGroupItem value={item.id} id={item.id} />
                      <Label htmlFor={item.id} className="flex-1 cursor-pointer">
                        {item.foodName}
                      </Label>
                    </div>
                    <span className="text-sm font-medium text-[#fd683e]">
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
  );
};

export default ExtrasSelectionInline; 