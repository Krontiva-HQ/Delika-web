import React, { useState } from 'react';
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
}

const ExtrasSelectionInline: React.FC<ExtrasSelectionInlineProps> = ({
  extras,
  onConfirm,
  itemName
}) => {
  const [selectedExtras, setSelectedExtras] = useState<{ [key: string]: Selection[] }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSingleSelection = (groupId: string, item: Selection) => {
    setSelectedExtras(prev => ({
      ...prev,
      [groupId]: [item]
    }));
    // Clear error when selection is made
    setErrors(prev => ({
      ...prev,
      [groupId]: ''
    }));
  };

  const handleMultipleSelection = (groupId: string, item: Selection, checked: boolean) => {
    setSelectedExtras(prev => {
      const currentSelections = prev[groupId] || [];
      if (checked) {
        return {
          ...prev,
          [groupId]: [...currentSelections, item]
        };
      } else {
        return {
          ...prev,
          [groupId]: currentSelections.filter(i => i.id !== item.id)
        };
      }
    });
    // Clear error when selection is made
    setErrors(prev => ({
      ...prev,
      [groupId]: ''
    }));
  };

  const validateSelections = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    let isValid = true;

    extras.forEach(extra => {
      const groupId = extra.extrasDetails.id;
      const selections = selectedExtras[groupId] || [];
      
      if (extra.extrasDetails.required && selections.length === 0) {
        newErrors[groupId] = `Please select at least one ${extra.extrasDetails.extrasTitle.toLowerCase()}`;
        isValid = false;
      }

      // Check min/max selections if specified
      const minSelection = extra.extrasDetails.extrasDetails[0]?.minSelection;
      const maxSelection = extra.extrasDetails.extrasDetails[0]?.maxSelection;

      if (minSelection && selections.length < Number(minSelection)) {
        newErrors[groupId] = `Please select at least ${minSelection} options`;
        isValid = false;
      }

      if (maxSelection && selections.length > Number(maxSelection)) {
        newErrors[groupId] = `Please select no more than ${maxSelection} options`;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleConfirm = () => {
    if (validateSelections()) {
      // Add group metadata to selections
      const enrichedSelections = Object.entries(selectedExtras).reduce((acc, [groupId, selections]) => {
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

      <div className="flex justify-end gap-4 mt-4">
        <button
          onClick={handleConfirm}
          className="bg-[#fd683e] text-white py-2 px-4 rounded-lg font-medium hover:bg-[#e55a35] transition-colors"
        >
          Confirm Selection
        </button>
      </div>
    </div>
  );
};

export default ExtrasSelectionInline; 