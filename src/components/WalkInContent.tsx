import React, { useState } from 'react';
import { IoIosArrowBack } from "react-icons/io";
import { useTranslation } from 'react-i18next';
import { RiDeleteBinLine } from "react-icons/ri";
import SelectExtrasModal from './SelectExtrasModal';
import { SelectedItem, SelectedItemExtra } from '../types/order';

interface InventoryDetail {
  id: string;
  foodName: string;
  foodPrice: number;
  foodDescription: string;
}

interface ExtraDetail {
  delika_inventory_table_id: string;
  minSelection: number;
  maxSelection: number;
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

interface WalkInContentProps {
  currentStep: number;
  customerName: string;
  setCustomerName: (name: string) => void;
  customerPhone: string;
  setCustomerPhone: (phone: string) => void;
  handleBackToDeliveryType: () => void;
  handleNextStep: () => void;
  handlePreviousStep: () => void;
  handlePlaceOrder: (paymentType: 'cash' | 'momo' | 'visa') => void;
  isSubmitting: boolean;
  totalFoodPrice: string;
  calculateTotal: () => string;
  orderComment: string;
  setOrderComment: (comment: string) => void;
  selectedItems: SelectedItem[];
  updateQuantity: (itemName: string, quantity: number) => void;
  removeItem: (itemName: string) => void;
  categoryItems: any[];
  renderEnhancedMenuSelection: () => JSX.Element;
  showPrinterModal: boolean;
  setShowPrinterModal: (show: boolean) => void;
  printerConnectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  connectToPrinter: () => Promise<void>;
  disconnectPrinter: () => void;
  connectedDevice: { name: string } | null;
  updateItemWithExtras: (itemName: string, extras: SelectedItemExtra[], extrasCost: number) => void;
}

const WalkInContent: React.FC<WalkInContentProps> = ({
  currentStep,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  handleBackToDeliveryType,
  handleNextStep,
  handlePreviousStep,
  handlePlaceOrder,
  isSubmitting,
  totalFoodPrice,
  calculateTotal,
  orderComment,
  setOrderComment,
  selectedItems,
  updateQuantity,
  removeItem,
  categoryItems,
  renderEnhancedMenuSelection,
  showPrinterModal,
  setShowPrinterModal,
  printerConnectionStatus,
  connectToPrinter,
  disconnectPrinter,
  connectedDevice,
  updateItemWithExtras
}) => {
  const { t } = useTranslation();

  // Add new state for extras selection
  const [showExtrasModal, setShowExtrasModal] = useState(false);
  const [selectedItemForExtras, setSelectedItemForExtras] = useState<any>(null);

  // Add new function to handle menu item selection
  const handleMenuItemSelect = (item: any) => {
    if (item.extras && item.extras.length > 0) {
      setSelectedItemForExtras(item);
      setShowExtrasModal(true);
    } else {
      // If no extras, add item directly
      const newItem: SelectedItem = {
        name: item.name,
        quantity: 1,
        price: Number(item.price),
        image: item.foodImage.url
      };
      updateQuantity(newItem.name, 1);
    }
  };

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

  // Add new function to handle extras confirmation
  const handleExtrasConfirm = (selectedExtras: { [key: string]: Selection[] }) => {
    if (!selectedItemForExtras) return;

    // Calculate total price including extras
    const extrasCost = Object.entries(selectedExtras).reduce((total, [groupId, selections]) => {
      return total + selections.reduce((selectionTotal, selection) => {
        return selectionTotal + selection.foodPrice;
      }, 0);
    }, 0);

    // Transform the selected extras to match the SelectedItemExtra type
    const formattedExtras: SelectedItemExtra[] = Object.entries(selectedExtras).map(([groupId, selections]) => {
      const extraGroup = selectedItemForExtras.extras?.find((e: any) => e.delika_extras_table_id === groupId);
      if (!extraGroup) return null;

      return {
        delika_extras_table_id: extraGroup.delika_extras_table_id,
        extrasDetails: {
          id: extraGroup.extrasDetails.id,
          extrasTitle: extraGroup.extrasDetails.extrasTitle,
          extrasType: extraGroup.extrasDetails.extrasType,
          required: extraGroup.extrasDetails.required,
          extrasDetails: extraGroup.extrasDetails.extrasDetails.map((detail: any) => ({
            ...detail,
            inventoryDetails: selections.map(selection => ({
              id: selection.id,
              foodName: selection.foodName,
              foodPrice: selection.foodPrice,
              foodDescription: selection.foodDescription || ''
            }))
          }))
        }
      };
    }).filter(Boolean) as SelectedItemExtra[];

    // Update the existing item in selectedItems instead of adding a new one
    updateItemWithExtras(selectedItemForExtras.name, formattedExtras, extrasCost);
    // Don't close the extras selection to allow multiple selections
    // setSelectedItemForExtras(null);
  };

  const renderPrinterModal = () => {
    if (!showPrinterModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full">
          <h2 className="text-xl font-semibold mb-4">Connect to Printer</h2>
          
          {printerConnectionStatus === 'connected' && connectedDevice ? (
            <div>
              <p className="text-green-600 mb-4">Connected to {connectedDevice.name}</p>
              <button
                onClick={disconnectPrinter}
                className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div>
              <p className="mb-4">
                {printerConnectionStatus === 'connecting'
                  ? 'Connecting...'
                  : printerConnectionStatus === 'error'
                  ? 'Failed to connect. Please try again.'
                  : 'Click connect to pair with your printer.'}
              </p>
              <button
                onClick={connectToPrinter}
                disabled={printerConnectionStatus === 'connecting'}
                className={`w-full py-2 px-4 rounded text-white ${
                  printerConnectionStatus === 'connecting'
                    ? 'bg-gray-400'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {printerConnectionStatus === 'connecting' ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          )}
          
          <button
            onClick={() => setShowPrinterModal(false)}
            className="w-full mt-4 border border-gray-300 py-2 px-4 rounded hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  switch (currentStep) {
    case 1:
      return (
        <>
          <div className="flex items-center mb-6">
            <button
              className="flex items-center gap-2 text-[#201a18] text-sm font-sans hover:text-gray-700 bg-transparent"
              onClick={handleBackToDeliveryType}
            >
              <IoIosArrowBack className="w-5 h-5" />
              <span>Back</span>
            </button>
          </div>
          
          <b className="font-sans text-lg font-semibold gap-2 mb-4">Walk-In Service</b>

          {/* Enhanced Menu Selection */}
          {renderEnhancedMenuSelection && renderEnhancedMenuSelection()}

          {/* Selected Items */}
          <div className="self-stretch flex flex-col items-start justify-start gap-[4px] pt-6">
            <div className="self-stretch relative leading-[20px] font-sans text-black">Selected Items</div>
            <div className="w-full">
              {(() => {
                // Group items by their base name (before the " - " separator)
                const groupedItems = selectedItems.reduce((groups, item) => {
                  const baseName = item.name.includes(' - ') ? item.name.split(' - ')[0] : item.name;
                  if (!groups[baseName]) {
                    groups[baseName] = [];
                  }
                  groups[baseName].push(item);
                  return groups;
                }, {} as { [key: string]: typeof selectedItems });

                return Object.entries(groupedItems).map(([baseName, items]) => (
                  <div key={baseName} className="mb-4 w-full">
                    {/* Main Item */}
                    {items.filter(item => !item.name.includes(' - ')).map((item, index) => (
              <div 
                key={`${item.name}-${index}`}
                        className="w-full shadow-[0px_0px_2px_rgba(23,_26,_31,_0.12),_0px_0px_1px_rgba(23,_26,_31,_0.07)] rounded-[6px] bg-[#f6f6f6] border-[#fff] border-[1px] border-solid flex flex-col items-start justify-between p-[1px]"
              >
                <div className="w-full flex items-center">
                  <div className="w-[61px] rounded-[6px] bg-[#f6f6f6] box-border overflow-hidden shrink-0 flex flex-row items-center justify-center py-[16px] px-[20px] gap-[7px]">
                    <div className="flex flex-row items-center gap-1">
                      <button 
                        onClick={() => updateQuantity(item.name, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className={`w-[20px] h-[20px] bg-[#f6f6f6] rounded flex items-center justify-center 
                                 ${item.quantity <= 1 ? 'text-gray-400 cursor-not-allowed' : 'text-black cursor-pointer'} 
                                 font-sans`}
                      >
                        -
                      </button>
                      <div className="w-[20px] h-[20px] bg-[#f6f6f6] rounded flex items-center justify-center text-black font-sans">
                        {item.quantity}
                      </div>
                      <button 
                        onClick={() => updateQuantity(item.name, item.quantity + 1)}
                                className="w-[20px] h-[20px] bg-[#f6f6f6] rounded flex items-center justify-center text-black cursor-pointer font-sans"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 rounded-[6px] bg-[#fff] border-[#fff] border-[1px] border-solid flex flex-row items-center justify-between py-[15px] px-[20px] text-[#858a89]">
                    <div className="flex flex-col">
                              <div className="relative leading-[20px] text-black font-sans font-medium">{item.name}</div>
                                  </div>
                            <div className="flex items-center gap-3">
                              <div className="relative leading-[20px] text-black font-sans">{item.price * item.quantity} GHS</div>
                              <RiDeleteBinLine 
                                className="cursor-pointer text-red-500 hover:text-red-600" 
                                onClick={() => removeItem(item.name)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Related Extras */}
                    {items.filter(item => item.name.includes(' - ')).map((item, index) => (
                      <div 
                        key={`${item.name}-${index}`}
                        className="w-full shadow-[0px_0px_2px_rgba(23,_26,_31,_0.12),_0px_0px_1px_rgba(23,_26,_31,_0.07)] rounded-[6px] bg-[#f6f6f6] border-[#fff] border-[1px] border-solid flex flex-col items-start justify-between p-[1px]"
                      >
                        <div className="w-full flex items-center">
                          <div className="w-[61px] rounded-[6px] bg-[#f6f6f6] box-border overflow-hidden shrink-0 flex flex-row items-center justify-center py-[16px] px-[20px] gap-[7px]">
                            <div className="flex flex-row items-center gap-1">
                              <button 
                                onClick={() => updateQuantity(item.name, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className={`w-[20px] h-[20px] bg-[#f6f6f6] rounded flex items-center justify-center 
                                     ${item.quantity <= 1 ? 'text-gray-400 cursor-not-allowed' : 'text-black cursor-pointer'} 
                                     font-sans`}
                              >
                                -
                              </button>
                              <div className="w-[20px] h-[20px] bg-[#f6f6f6] rounded flex items-center justify-center text-black font-sans">
                                {item.quantity}
                              </div>
                              <button 
                                onClick={() => updateQuantity(item.name, item.quantity + 1)}
                                className="w-[20px] h-[20px] bg-[#f6f6f6] rounded flex items-center justify-center text-black cursor-pointer font-sans"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <div className="flex-1 rounded-[6px] bg-[#fff] border-[#fff] border-[1px] border-solid flex flex-row items-center justify-between py-[15px] px-[20px] text-[#858a89]">
                            <div className="flex flex-col">
                              <div className="relative leading-[20px] text-gray-600 font-sans">
                                <span className="text-xs text-gray-400">•</span> {item.name}
                              </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative leading-[20px] text-black font-sans">{item.price * item.quantity} GHS</div>
                      <RiDeleteBinLine 
                        className="cursor-pointer text-red-500 hover:text-red-600" 
                        onClick={() => removeItem(item.name)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
                  </div>
                ));
              })()}
            </div>
            {selectedItems.length === 0 && (
              <div className="text-[#b1b4b3] text-[13px] italic font-sans">No items selected</div>
            )}
          </div>

          {/* Total Price */}
          <div className="self-stretch flex flex-col items-start justify-start gap-[4px] pt-6">
            <div className="self-stretch relative leading-[20px] font-sans text-black">
              Total Price
            </div>
            <div className="self-stretch shadow-[0px_0px_2px_rgba(23,_26,_31,_0.12),_0px_0px_1px_rgba(23,_26,_31,_0.07)] rounded-[6px] bg-[#f6f6f6] border-[#fff] border-[1px] border-solid flex flex-row items-center justify-start py-[1px] px-[0px]">
              <div className="w-[64px] rounded-[6px] bg-[#f6f6f6] border-[#fff] border-[1px] border-solid box-border overflow-hidden shrink-0 flex flex-row items-center justify-center py-[16px] px-[18px]">
                <div className="relative leading-[20px] font-sans">GH₵</div>
              </div>
              <div className="flex-1 rounded-[6px] bg-[#fff] border-[#fff] border-[1px] border-solid flex flex-row items-center justify-start py-[15px] px-[20px] text-[#858a89]">
                <div className="relative leading-[20px] font-sans">{calculateTotal()}</div>
              </div>
            </div>
          </div>

          {/* Customer Details Section - Moved here */}
          <div className="self-stretch flex flex-col items-start justify-start gap-[4px] pt-6">
            <div className="self-stretch relative leading-[20px] font-sans text-black">
              Customer Name 
            </div>
            <input
              className="font-sans border-[#efefef] border-[1px] border-solid [outline:none] 
                        text-[12px] bg-[#fff] self-stretch rounded-[3px] overflow-hidden flex flex-row items-center justify-center py-[10px] px-[12px] text-black"
              placeholder="Customer Name"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          {/* Additional Comment Section */}
          <div className="self-stretch flex flex-col items-start justify-start gap-[4px] mb-4 mt-6">
            <div className="self-stretch relative leading-[20px] font-sans">Additional Comment</div>
            <textarea
              className="font-sans border-[#efefef] border-[1px] border-solid [outline:none] 
                        text-[12px] bg-[#fff] self-stretch rounded-[3px] overflow-hidden 
                        flex flex-row items-start justify-start py-[10px] px-[12px] 
                        min-h-[20px] resize-none w-[550px]"
              placeholder="Add any special instructions or notes here..."
              value={orderComment}
              onChange={(e) => setOrderComment(e.target.value)}
            />
          </div>

          {/* Printer Connection Status */}
          <div className="flex items-center justify-between mb-6 mt-6">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                printerConnectionStatus === 'connected' ? 'bg-green-500' :
                printerConnectionStatus === 'connecting' ? 'bg-yellow-500' :
                printerConnectionStatus === 'error' ? 'bg-red-500' :
                'bg-gray-500'
              }`} />
              <span className="text-sm">
                {printerConnectionStatus === 'connected' ? `Connected to ${connectedDevice?.name}` :
                 printerConnectionStatus === 'connecting' ? 'Connecting...' :
                 printerConnectionStatus === 'error' ? 'Connection failed' :
                 'Not connected'}
              </span>
            </div>
            <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPrinterModal(true)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {printerConnectionStatus === 'connected' ? 'Change printer' : 'Connect printer'}
            </button>
            </div>
          </div>

          {/* Payment Buttons */}
          <div className="flex gap-4 w-full pt-4 mt-4">
            <button
              className={`flex-1 font-sans cursor-pointer border-[1px] border-solid 
                         py-[8px] text-white text-[10px] rounded-[4px] hover:opacity-90 text-center justify-center
                         ${isSubmitting
                           ? 'bg-gray-400 border-gray-400 cursor-not-allowed'
                           : 'bg-[#201a18] border-[#201a18]'}`}
              onClick={() => handlePlaceOrder('cash')}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                'Cash'
              )}
            </button>

            <button
              className={`flex-1 font-sans cursor-pointer border-[1px] border-solid 
                         py-[8px] text-white text-[10px] rounded-[4px] hover:opacity-90 text-center justify-center
                         ${isSubmitting
                           ? 'bg-gray-400 border-gray-400 cursor-not-allowed'
                           : 'bg-[#fd683e] border-[#fd683e]'}`}
              onClick={() => handlePlaceOrder('momo')}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                'MoMo'
              )}
            </button>

            <button
              className={`flex-1 font-sans cursor-pointer border-[1px] border-solid 
                         py-[8px] text-white text-[10px] rounded-[4px] hover:opacity-90 text-center justify-center
                         ${isSubmitting
                           ? 'bg-gray-400 border-gray-400 cursor-not-allowed'
                           : 'bg-[#4CAF50] border-[#4CAF50]'}`}
              onClick={() => handlePlaceOrder('visa')}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                'Visa Card'
              )}
            </button>
          </div>

          {renderPrinterModal()}

          {/* Add the SelectExtrasModal component */}
          {showExtrasModal && selectedItemForExtras && (
            <SelectExtrasModal
              open={showExtrasModal}
              onClose={() => {
                setShowExtrasModal(false);
                setSelectedItemForExtras(null);
              }}
              extras={selectedItemForExtras.extras}
              onConfirm={handleExtrasConfirm}
              itemName={selectedItemForExtras.name}
            />
          )}
        </>
      );
    default:
      return null;
  }
};

export default WalkInContent; 