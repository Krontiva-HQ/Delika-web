import React from 'react';
import { IoIosArrowBack } from "react-icons/io";
import LocationInput from './LocationInput';
import { useTranslation } from 'react-i18next';
import { MenuItem, SelectChangeEvent } from '@mui/material';
import { StyledSelect } from '../styles/StyledComponents';
import { LocationData } from "../types/location";
import { RiDeleteBinLine } from "react-icons/ri";

interface SelectedItem {
  name: string;
  quantity: number;
  price: number;
  image: string;
}

interface BatchContentProps {
  currentStep: number;
  customerName: string;
  setCustomerName: (name: string) => void;
  customerPhone: string;
  setCustomerPhone: (phone: string) => void;
  selectedBranchId: string;
  setSelectedBranchId: (id: string) => void;
  branches: any[];
  userProfile: any;
  handlePickupLocationSelect: (location: LocationData) => void;
  handleDropoffLocationSelect: (location: LocationData) => void;
  pickupLocation: LocationData | null;
  dropoffLocation: LocationData | null;
  distance: number | null;
  handleBackToDeliveryType: () => void;
  handleNextStep: () => void;
  handlePreviousStep: () => void;
  isDeliveryPriceValid: () => boolean;
  handlePlaceOrder: (paymentType: 'cash' | 'momo' | 'visa') => void;
  isSubmitting: boolean;
  deliveryPrice: string;
  totalFoodPrice: string;
  calculateTotal: () => string;
  renderDistanceInfo: () => JSX.Element | null;
  renderDeliveryPriceInput: () => JSX.Element | null;
  renderRiderSelection: () => JSX.Element | null;
  orderComment: string;
  setOrderComment: (comment: string) => void;
  selectedItems: SelectedItem[];
  updateQuantity: (itemName: string, quantity: number) => void;
  removeItem: (itemName: string) => void;
  categoryItems: any[];
  renderEnhancedMenuSelection: () => JSX.Element;
  currentBatchId: string | null;
  handleAddAnotherOrder: () => void;
  handleCompleteBatch: () => void;
}

const BatchContent: React.FC<BatchContentProps> = ({
  currentStep,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  selectedBranchId,
  setSelectedBranchId,
  branches,
  userProfile,
  handlePickupLocationSelect,
  handleDropoffLocationSelect,
  pickupLocation,
  dropoffLocation,
  distance,
  handleBackToDeliveryType,
  handleNextStep,
  handlePreviousStep,
  isDeliveryPriceValid,
  handlePlaceOrder,
  isSubmitting,
  deliveryPrice,
  totalFoodPrice,
  calculateTotal,
  renderDistanceInfo,
  renderDeliveryPriceInput,
  renderRiderSelection,
  orderComment,
  setOrderComment,
  selectedItems,
  updateQuantity,
  removeItem,
  categoryItems,
  renderEnhancedMenuSelection,
  currentBatchId,
  handleAddAnotherOrder,
  handleCompleteBatch
}) => {
  const { t } = useTranslation();

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
          
          <div className="flex justify-between items-center mb-6">
            <b className="font-sans text-lg font-semibold">Batch Delivery</b>
            {currentBatchId && (
              <div className="text-sm text-gray-600">
                Batch ID: {currentBatchId}
              </div>
            )}
          </div>
          
          {/* Add Estimated Distance section here */}
          {renderDistanceInfo()}

          {/* Customer Details Section */}
          <div className="self-stretch flex flex-row items-start justify-center flex-wrap content-start gap-[15px] mb-4">
            <div className="flex-1 flex flex-col items-start justify-start gap-[4px]">
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
            <div className="flex-1 flex flex-col items-start justify-start gap-[4px]">
              <div className="self-stretch relative leading-[20px] font-sans text-black">
                Customer Phone
              </div>
              <input
                className="font-sans border-[#efefef] border-[1px] border-solid [outline:none] 
                          text-[12px] bg-[#fff] self-stretch rounded-[3px] overflow-hidden flex flex-row items-center justify-start py-[10px] px-[12px] text-black"
                placeholder="Customer Phone"
                type="tel"
                value={customerPhone}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setCustomerPhone(value);
                }}
                maxLength={10}
              />
            </div>
          </div>
          <div className="self-stretch flex flex-col items-start justify-start gap-[1px] mb-4">
            {userProfile?.role === 'Admin' ? (
              <div className="w-full">
                <div className="text-[12px] leading-[20px] font-sans text-[#535353] mb-1">
                  Pickup Location
                </div>
                <StyledSelect
                  fullWidth
                  value={selectedBranchId}
                  onChange={(event: SelectChangeEvent<unknown>, child: React.ReactNode) => {
                    const selectedId = event.target.value as string;
                    setSelectedBranchId(selectedId);
                    
                    // Find selected branch
                    const selectedBranch = branches.find(branch => branch.id === selectedId);
                    if (selectedBranch) {
                      // Update pickup location for distance calculation
                      handlePickupLocationSelect({
                        address: selectedBranch.branchLocation,
                        latitude: parseFloat(selectedBranch.branchLatitude),
                        longitude: parseFloat(selectedBranch.branchLongitude),
                        name: selectedBranch.branchName
                      });
                    }
                  }}
                  variant="outlined"
                  size="small"
                  className="mb-2"
                >
                  {branches.map((branch) => (
                    <MenuItem key={branch.id} value={branch.id}>
                      {branch.branchName} - {branch.branchLocation}
                    </MenuItem>
                  ))}
                </StyledSelect>
              </div>
            ) : (
              <div className="w-full">
                <div className="text-[12px] leading-[20px] font-sans text-[#535353] mb-1">
                  Pickup Location
                </div>
                <div className="font-sans border-[#efefef] border-[1px] border-solid 
                              bg-[#f9fafb] self-stretch rounded-[3px] overflow-hidden 
                              flex flex-row items-center py-[10px] px-[12px] text-gray-600">
                  {userProfile?.branchesTable?.branchName} - {userProfile?.branchesTable?.branchLocation}
                </div>
              </div>
            )}
          </div>
          <div className="self-stretch flex flex-col items-start justify-start gap-[1px] mb-4">
            <LocationInput label="Drop-Off Location" onLocationSelect={handleDropoffLocationSelect} />
            {dropoffLocation && (
              <div className="text-sm text-gray-600 mt-2 pl-2">
              </div>
            )}
          </div>
          <button
            onClick={handleNextStep}
            disabled={!isDeliveryPriceValid()}
            className={`self-stretch rounded-[4px] border-[1px] border-solid overflow-hidden 
                        flex flex-row items-center justify-center py-[9px] px-[90px] 
                        cursor-pointer text-[10px] text-[#fff] mt-4
                        ${isDeliveryPriceValid() 
                          ? 'bg-[#fd683e] border-[#f5fcf8] hover:opacity-90' 
                          : 'bg-gray-400 border-gray-300 cursor-not-allowed'}`}
          >
            <div className="relative leading-[16px] font-sans text-[#fff]">{t('common.next')}</div>
          </button>
        </>
      );

    case 2:
      return (
        <>
          <div className="flex items-center mb-6">
            <button
              className="flex items-center gap-2 text-[#201a18] text-sm font-sans hover:text-gray-700 bg-transparent"
              onClick={handlePreviousStep}
            >
              <IoIosArrowBack className="w-5 h-5" />
              <span>Back</span>
            </button>
          </div>
          
          <div className="flex justify-between items-center mb-6">
            <b className="font-sans text-lg font-semibold">Add Menu Item</b>
            {currentBatchId && (
              <div className="text-sm text-gray-600">
                Batch ID: {currentBatchId}
              </div>
            )}
          </div>

          {/* Add this scrollable container */}
          <div className="flex-1 overflow-y-auto max-h-[75vh] pr-2">
            {/* Enhanced Menu Selection */}
            {renderEnhancedMenuSelection()}

            {/* Selected Items */}
            <div className="self-stretch flex flex-col items-start justify-start gap-[4px] pt-6">
              <div className="self-stretch relative leading-[20px] font-sans text-black">Selected Items</div>
              {selectedItems.map((item, index) => (
                <div 
                  key={`${item.name}-${index}`}
                  className="self-stretch shadow-[0px_0px_2px_rgba(23,_26,_31,_0.12),_0px_0px_1px_rgba(23,_26,_31,_0.07)] rounded-[6px] bg-[#f6f6f6] border-[#fff] border-[1px] border-solid flex flex-row items-start justify-between p-[1px]"
                >
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
                        disabled={!categoryItems.find(mi => mi.name === item.name)?.available}
                        className={`w-[20px] h-[20px] bg-[#f6f6f6] rounded flex items-center justify-center 
                               ${!categoryItems.find(mi => mi.name === item.name)?.available
                                 ? 'text-gray-400 cursor-not-allowed' 
                                 : 'text-black cursor-pointer'} 
                               font-sans`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 rounded-[6px] bg-[#fff] border-[#fff] border-[1px] border-solid flex flex-row items-center justify-between py-[15px] px-[20px] text-[#858a89]">
                    <div className="relative leading-[20px] text-black font-sans">{item.name}</div>
                    <div className="flex items-center gap-3">
                      <div className="relative leading-[20px] text-black font-sans">{item.price * item.quantity} GHS</div>
                      <RiDeleteBinLine 
                        className="cursor-pointer text-red-500 hover:text-red-600" 
                        onClick={() => removeItem(item.name)}
                      />
                    </div>
                  </div>
                </div>
              ))}
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
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-4 border-t">
            <button
              className="flex-1 font-sans cursor-pointer bg-[#201a18] border-[#201a18] border-[1px] border-solid 
                          py-[8px] text-white text-[10px] rounded-[4px] hover:opacity-90 text-center justify-center"
              onClick={handlePreviousStep}
              disabled={isSubmitting}
            >
              Back
            </button>
            <div className="mx-2" />
            <button
              className={`flex-1 font-sans cursor-pointer border-[#fd683e] border-[1px] border-solid 
                          py-[8px] text-white text-[10px] rounded-[4px] hover:opacity-90 text-center justify-center
                          ${selectedItems.length === 0 ? 'bg-[#fd683e] cursor-not-allowed' : 'bg-[#fd683e] cursor-pointer'}`}
              onClick={handleNextStep}
              disabled={selectedItems.length === 0}
            >
              Next
            </button>
          </div>
        </>
      );

    case 3:
      return (
        <>
          <div className="flex items-center mb-6">
            <button
              className="flex items-center gap-2 text-[#201a18] text-sm font-sans hover:text-gray-700 bg-transparent"
              onClick={handlePreviousStep}
            >
              <IoIosArrowBack className="w-5 h-5" />
              <span>Back</span>
            </button>
          </div>
          
          <div className="flex justify-between items-center mb-6">
            <b className="font-sans text-lg font-semibold">Choose Payment Method</b>
            {currentBatchId && (
              <div className="text-sm text-gray-600">
                Batch ID: {currentBatchId}
              </div>
            )}
          </div>

          {/* Scrollable container */}
          <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: 'calc(100vh - 250px)' }}>
            <div className="flex flex-col gap-4">
              {/* Add Estimated Distance section */}
              {renderDistanceInfo()}

              {/* Order Price Section */}
              <div className="self-stretch flex flex-col items-start justify-start gap-[4px] text-[12px] text-[#686868] font-sans">
                {renderDeliveryPriceInput()}

                <div className="self-stretch flex flex-col items-start justify-start gap-[4px]">
                  <div className="self-stretch relative leading-[20px] font-sans">Food Price</div>
                  <div className="self-stretch shadow-[0px_0px_2px_rgba(23,_26,_31,_0.12),_0px_0px_1px_rgba(23,_26,_31,_0.07)] rounded-[6px] bg-[#f6f6f6] border-[#fff] border-[1px] border-solid flex flex-row items-center justify-start py-[1px] px-[0px] mb-4">
                    <div className="w-[64px] rounded-[6px] bg-[#f6f6f6] border-[#fff] border-[1px] border-solid box-border overflow-hidden shrink-0 flex flex-row items-center justify-center py-[12px] px-[16px]">
                      <div className="relative leading-[20px] font-sans">GH₵</div>
                    </div>
                    <div className="flex-1 rounded-[6px] bg-[#fff] border-[#fff] border-[1px] border-solid flex flex-row items-center justify-start py-[12px] px-[16px] text-[#858a89]">
                      <div className="relative leading-[20px] font-sans">{totalFoodPrice}</div>
                    </div>
                  </div>
                </div>

                <div className="self-stretch flex flex-col items-start justify-start gap-[4px] pt-2">
                  <div className="self-stretch relative leading-[20px] font-sans text-black">Total Price</div>
                  <div className="self-stretch shadow-[0px_0px_2px_rgba(23,_26,_31,_0.12),_0px_0px_1px_rgba(23,_26,_31,_0.07)] rounded-[6px] bg-[#f6f6f6] border-[#fff] border-[1px] border-solid flex flex-row items-center justify-start py-[1px] px-[0px]">
                    <div className="w-[64px] rounded-[6px] bg-[#f6f6f6] border-[#fff] border-[1px] border-solid box-border overflow-hidden shrink-0 flex flex-row items-center justify-center py-[16px] px-[18px]">
                      <div className="relative leading-[20px] text-black font-sans">GH₵</div>
                    </div>
                    <div className="flex-1 rounded-[6px] bg-[#fff] border-[#fff] border-[1px] border-solid flex flex-row items-center justify-start py-[15px] px-[20px] text-[#858a89]">
                      <div className="relative leading-[20px] text-black font-sans">{calculateTotal()}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Add Rider Selection */}
              {renderRiderSelection()}

              {/* Additional Comment Section */}
              <div className="self-stretch flex flex-col items-start justify-start gap-[4px] mb-4">
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
            </div>
          </div>

          {/* Payment Buttons - Keep outside scrollable area */}
          <div className="flex gap-4 w-full pt-4 mt-4">
            <button
              className={`flex-1 font-sans cursor-pointer border-[1px] border-solid 
                         py-[8px] text-white text-[10px] rounded-[4px] hover:opacity-90 text-center justify-center
                         ${!isDeliveryPriceValid() || isSubmitting
                           ? 'bg-gray-400 border-gray-400 cursor-not-allowed'
                           : 'bg-[#201a18] border-[#201a18]'}`}
              onClick={() => handlePlaceOrder('cash')}
              disabled={!isDeliveryPriceValid() || isSubmitting}
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
                         ${!isDeliveryPriceValid() || isSubmitting
                           ? 'bg-gray-400 border-gray-400 cursor-not-allowed'
                           : 'bg-[#fd683e] border-[#fd683e]'}`}
              onClick={() => handlePlaceOrder('momo')}
              disabled={!isDeliveryPriceValid() || isSubmitting}
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
                         ${!isDeliveryPriceValid() || isSubmitting
                           ? 'bg-gray-400 border-gray-400 cursor-not-allowed'
                           : 'bg-[#4CAF50] border-[#4CAF50]'}`}
              onClick={() => handlePlaceOrder('visa')}
              disabled={!isDeliveryPriceValid() || isSubmitting}
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

          {/* Batch Actions */}
          <div className="flex gap-4 w-full pt-4 mt-4">
            <button
              className="flex-1 font-sans cursor-pointer bg-[#4CAF50] border-[#4CAF50] border-[1px] border-solid 
                        py-[8px] text-white text-[10px] rounded-[4px] hover:opacity-90 text-center justify-center"
              onClick={handleAddAnotherOrder}
            >
              Add Another Order
            </button>
            <button
              className="flex-1 font-sans cursor-pointer bg-[#fd683e] border-[#fd683e] border-[1px] border-solid 
                        py-[8px] text-white text-[10px] rounded-[4px] hover:opacity-90 text-center justify-center"
              onClick={handleCompleteBatch}
            >
              Complete Batch
            </button>
          </div>
        </>
      );
    default:
      return null;
  }
};

export default BatchContent; 