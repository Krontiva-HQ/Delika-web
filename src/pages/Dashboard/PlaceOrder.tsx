import React, { useState, useEffect, FunctionComponent } from "react";
import { Button } from "@mui/material";
import { getAuthenticatedUser, UserResponse } from "../../services/api";
import LocationInput from '../../components/LocationInput';
import { LocationData } from "../../types/location";
import { calculateDistance } from "../../utils/distance";
import { RiDeleteBinLine } from "react-icons/ri";
import { usePlaceOrderItems } from '../../hooks/usePlaceOrderItems';
import { useNotifications } from '../../context/NotificationContext';
import { IoIosCloseCircleOutline, IoIosArrowBack } from "react-icons/io";
import { useUserProfile } from '../../hooks/useUserProfile';
import { useBranches } from '../../hooks/useBranches';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import { styled } from '@mui/material/styles';
import { SelectChangeEvent } from '@mui/material/Select';

interface PlaceOrderProps {
  onClose: () => void;
  onOrderPlaced: () => void;
  branchId: string;
}

interface SelectedItem {
  name: string;
  quantity: number;
  price: number;
  image: string;
}

interface OrderPayload {
  restaurantId: string | null;
  branchId: string | null;
  dropOff: Array<{
    toLatitude: string;
    toLongitude: string;
    toAddress: string;
  }>;
  pickup: Array<{
    fromLatitude: string;
    fromLongitude: string;
    fromAddress: string;
  }>;
  customerName: string;
  customerPhoneNumber: string;
  orderNumber: number;
  deliveryDistance: string;
  orderPrice: string;
  trackingUrl: string;
  courierName: string;
  courierPhoneNumber: string;
  orderStatus: string;
  products: Array<{
    name: string;
    price: string;
    quantity: string;
    foodImage: {
      url: string;
      filename: string;
      type: string;
      size: number;
    };
  }>;
  orderDate: string | null;
  deliveryPrice: string;
  pickupName: string;
  dropoffName: string;
  totalPrice: string;
  foodAndDeliveryFee: boolean;
  onlyDeliveryFee: boolean;
  payNow: boolean;
  payLater: boolean;
}

// Style the Select component to match LocationInput
const StyledSelect = styled(Select)({
  '& .MuiOutlinedInput-input': {
    padding: '8px 12px',
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: '1px solid rgba(167, 161, 158, 0.15)',
    borderRadius: '8px',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(167, 161, 158, 0.3)',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(167, 161, 158, 0.5)',
    borderWidth: '1px',
  },
  backgroundColor: 'white',
});

const PlaceOrder: FunctionComponent<PlaceOrderProps> = ({ onClose, onOrderPlaced, branchId: initialBranchId }) => {
  const { addNotification } = useNotifications();
  const { userProfile } = useUserProfile();
  const { branches, isLoading: branchesLoading } = useBranches(userProfile?.restaurantId ?? null);
  const [selectedBranchId, setSelectedBranchId] = useState(initialBranchId || '');
  const [selectCategoryAnchorEl, setSelectCategoryAnchorEl] = useState<null | HTMLElement>(null);
  const [selectItemAnchorEl, setSelectItemAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState("");
  const [isItemsDropdownOpen, setIsItemsDropdownOpen] = useState(false);
  const [deliveryPrice, setDeliveryPrice] = useState("");
  const [totalFoodPrice, setTotalFoodPrice] = useState("0.00");
  const [currentStep, setCurrentStep] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [pickupLocation, setPickupLocation] = useState<LocationData | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<LocationData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userData, setUserData] = useState<UserResponse | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const { 
    categories, 
    categoryItems, 
    selectedItems,
    setSelectedItems,
    selectedCategory, 
    setSelectedCategory,
    addItem,
    updateQuantity,
    removeItem
  } = usePlaceOrderItems(selectedBranchId);

  // Add validation states
  const [isStep1Valid, setIsStep1Valid] = useState(false);
  const [isStep2Valid, setIsStep2Valid] = useState(false);
  const [isStep3Valid, setIsStep3Valid] = useState(false);

  const selectCategoryOpen = Boolean(selectCategoryAnchorEl);
  const selectItemOpen = Boolean(selectItemAnchorEl);

  const [showBanner, setShowBanner] = useState(false);

  // Add this to your state declarations at the top of the component
  const [isPayLaterSubmitting, setIsPayLaterSubmitting] = useState(false);
  const [isPayNowSubmitting, setIsPayNowSubmitting] = useState(false);

  const [pickupData, setPickupData] = useState({
    fromLatitude: '',
    fromLongitude: '',
    fromAddress: '',
    branchId: ''
  });

  const handleSelectCategoryClick = (event: React.MouseEvent<HTMLElement>) => {
    setSelectCategoryAnchorEl(event.currentTarget);
  };

  const handleSelectCategoryClose = () => {
    setSelectCategoryAnchorEl(null);
  };

  const handleSelectItemClick = (event: React.MouseEvent<HTMLElement>) => {
    setSelectItemAnchorEl(event.currentTarget);
  };

  const handleSelectItemClose = () => {
    setSelectItemAnchorEl(null);
  };

  const onButtonPlaceOrderClick = () => {
    // Add your order placement logic here
    onClose?.();
  };

  
  // Remove or comment out the hardcoded menuItems object
  // const menuItems: { [key: string]: string[] } = { ... };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isItemsDropdownOpen) {
        const dropdown = document.getElementById('items-dropdown');
        if (dropdown && !dropdown.contains(event.target as Node)) {
          setIsItemsDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isItemsDropdownOpen]);

  const handleDeliveryPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setDeliveryPrice(value);
    }
  };

  const calculateTotal = () => {
    const itemsTotal = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryAmount = deliveryPrice ? parseFloat(deliveryPrice) : 0;
    const total = Math.round(itemsTotal + deliveryAmount);
    return `${total}.00`;
  };

  // Add this handler function
  const handleQuantityChange = (itemName: string, newQuantity: string) => {
    // Convert to number and validate
    const quantity = parseInt(newQuantity);
    if (!isNaN(quantity) && quantity > 0) {
      setSelectedItems(selectedItems.map(item => 
        item.name === itemName 
          ? { ...item, quantity: quantity }
          : item
      ));
    }
  };

  useEffect(() => {
    const total = selectedItems.reduce((sum, item) => {
      return sum + (Number(item.price) * Number(item.quantity));
    }, 0);
    setTotalFoodPrice(`${Math.round(total)}.00`);
  }, [selectedItems]);

  // Function to handle next step
  const handleNextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  // Function to handle previous step
  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Add useEffect to fetch user data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await getAuthenticatedUser();
        setUserData(response.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  // Modify your handlePlaceOrder function
  const handlePlaceOrder = async (paymentType: 'later' | 'now') => {
    if (paymentType === 'later') {
      setIsPayLaterSubmitting(true);
    } else {
      setIsPayNowSubmitting(true);
    }

    try {
      const formData = new FormData();
      
      // Use the selected branch data for Admin users, otherwise use userProfile data
      if (userProfile?.role === 'Admin') {
        formData.append('branchId', pickupData.branchId);
        formData.append('pickup[0][fromAddress]', pickupData.fromAddress);
        formData.append('pickup[0][fromLatitude]', pickupData.fromLatitude);
        formData.append('pickup[0][fromLongitude]', pickupData.fromLongitude);
        formData.append('pickupName', pickupData.fromAddress); // Admin-specific branch name
      } else {
        formData.append('branchId', userProfile?.branchId || '');
        formData.append('pickup[0][fromAddress]', userProfile?.branchesTable?.branchLocation || '');
        formData.append('pickup[0][fromLatitude]', userProfile?.branchesTable?.branchLatitude || '');
        formData.append('pickup[0][fromLongitude]', userProfile?.branchesTable?.branchLongitude || '');
        formData.append('pickupName', userProfile?.branchesTable?.branchName || ''); // Non-Admin branch name
      }
      

      // Structured dropOff array
      formData.append('dropOff[0][toAddress]', dropoffLocation?.address || '');
      formData.append('dropOff[0][toLatitude]', dropoffLocation?.latitude.toString() || '');
      formData.append('dropOff[0][toLongitude]', dropoffLocation?.longitude.toString() || '');

      // Rest of the fields
      formData.append('deliveryDistance', distance ? distance.toString() : '');
      formData.append('orderNumber', Math.floor(Math.random() * 1000000).toString());
      formData.append('orderPrice', totalFoodPrice);
      formData.append('trackingUrl', '');
      formData.append('courierName', '');
      formData.append('customerName', customerName);
      formData.append('customerPhoneNumber', customerPhone);
      formData.append('restaurantId', userProfile?.restaurantId || '');
      formData.append('orderStatus', 'ReadyForPickup');
      
      // Products array without foodImage
      selectedItems.forEach((item, index) => {
        formData.append(`products[${index}][name]`, item.name);
        formData.append(`products[${index}][price]`, item.price.toString());
        formData.append(`products[${index}][quantity]`, item.quantity.toString());
      });

      formData.append('orderDate', new Date().toISOString());
      formData.append('deliveryPrice', deliveryPrice);
      formData.append('dropoffName', dropoffLocation?.name || '');
      formData.append('totalPrice', calculateTotal());
      formData.append('foodAndDeliveryFee', 'true');
      formData.append('onlyDeliveryFee', 'false');
      formData.append('payNow', (paymentType === 'now').toString());
      formData.append('payLater', (paymentType === 'later').toString());

      const response = await fetch(`${import.meta.env.VITE_API_URL}/delikaquickshipper_orders_table`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to place order');
      }

      const result = await response.json();
      
     

      addNotification({
        type: 'order_created',
        message: `Order number **#${Math.floor(Math.random() * 1000000)}** has been created with a total price of GHS ${calculateTotal()}`
      });

      console.log('Order placed successfully:', result);
      
      // Call onOrderPlaced before closing
      onOrderPlaced?.();
      onClose?.();

      // Show the banner after the payment request
      if (paymentType === 'now') {
        // Handle immediate payment logic
      } else {
        // Show banner for payment request
        setShowBanner(true);
        setTimeout(() => {
          setShowBanner(false); // Hide banner after a few seconds
        }, 3000); // Adjust duration as needed
      }

    } catch (error) {
      addNotification({
        type: 'order_status',
        message: 'Failed to send payment request SMS'
      });
      console.error('Error placing order:', error);
      throw error;
    } finally {
      // Reset the submitting state after a delay to show the loading state
      setTimeout(() => {
        setIsPayLaterSubmitting(false);
        setIsPayNowSubmitting(false);
      }, 2000);
    }
  };

  // Update the delivery price calculation in the useEffect
  useEffect(() => {
    if (distance !== null) {
      const updatedDistance = Math.max(0, distance - 1); // Ensure we don't go below 0
      const calculatedPrice = Math.round(15 + (updatedDistance * 2.5)); // Round to nearest whole number
      setDeliveryPrice(`${calculatedPrice}.00`); // Add .00 to the rounded number
    }
  }, [distance]);

  // Add validation effects
  useEffect(() => {
    // Validate Step 1
    const isPhoneValid = customerPhone.length === 10 && /^\d+$/.test(customerPhone);
    const isNameValid = customerName.trim().length > 0;
    const areLocationsValid = pickupLocation !== null && dropoffLocation !== null;

    // Detailed validation logging
    console.log('Validation Details:', {
      customerName: {
        value: customerName,
        isValid: isNameValid
      },
      customerPhone: {
        value: customerPhone,
        isValid: isPhoneValid,
        length: customerPhone.length,
        matchesPattern: /^\d+$/.test(customerPhone)
      },
      locations: {
        pickup: pickupLocation,
        dropoff: dropoffLocation,
        areValid: areLocationsValid
      }
    });

    const isValid = isNameValid && isPhoneValid && areLocationsValid;
    console.log('Final validation result:', isValid);
    
    setIsStep1Valid(isValid);
  }, [customerName, customerPhone, pickupLocation, dropoffLocation]);

  useEffect(() => {
    // Validate Step 2
    setIsStep2Valid(
      selectedItems.length > 0 && 
      deliveryPrice !== ''
    );
  }, [selectedItems, deliveryPrice]);

  useEffect(() => {
    // Validate Step 3
    setIsStep3Valid(
      customerName.trim() !== '' && 
      customerPhone.trim() !== '' && 
      pickupLocation !== null && 
      dropoffLocation !== null &&
      selectedItems.length > 0 && 
      deliveryPrice !== ''
    );
  }, [customerName, customerPhone, pickupLocation, dropoffLocation, selectedItems, deliveryPrice]);

  // Render different sections based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <b className="font-sans text-lg font-semibold gap-2 mb-4">Place New Order</b>
            
            {/* Add Estimated Distance section here */}
            <div className="self-stretch bg-[#f9fafb] rounded-lg p-4 mb-4">
              <div className="text-sm !font-sans">
                <div className="font-medium mb-1 !font-sans">Estimated Distance: {distance} km</div>
                <div className="text-gray-500 !font-sans">
                  From {pickupLocation?.address} to {dropoffLocation?.address}
                </div>
              </div>
            </div>

            {/* Customer Details Section */}
            <div className="self-stretch flex flex-row items-start justify-center flex-wrap content-start gap-[15px] mb-4">
              <div className="flex-1 flex flex-col items-start justify-start gap-[4px]">
                <div className="self-stretch relative leading-[20px] font-sans text-black">
                  Customer Name
                </div>
                <input
                  className="font-sans border-[#efefef] border-[1px] border-solid [outline:none] 
                            text-[12px] bg-[#fff] self-stretch rounded-[3px] overflow-hidden flex flex-row items-center justify-center py-[10px] px-[12px] text-black"
                  placeholder="customer name"
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
                  placeholder="customer phone number"
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
                    Select Branch for Pickup
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
                        setPickupData({
                          fromLatitude: selectedBranch.branchLatitude,
                          fromLongitude: selectedBranch.branchLongitude,
                          fromAddress: selectedBranch.branchLocation,
                          branchId: selectedBranch.id
                        });
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
                    Your Branch
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
              disabled={!isStep1Valid}
              className={`self-stretch rounded-[4px] border-[1px] border-solid overflow-hidden 
                         flex flex-row items-center justify-center py-[9px] px-[90px] 
                         cursor-pointer text-[10px] text-[#fff] mt-4
                         ${isStep1Valid 
                           ? 'bg-[#fd683e] border-[#f5fcf8] hover:opacity-90' 
                           : 'bg-gray-400 border-gray-300 cursor-not-allowed'}`}
            >
              <div className="relative leading-[16px] font-sans text-[#fff]">Next</div>
            </button>
          </>
        );

      case 2:
        return (
          <>
            <b className="font-sans text-lg font-semibold">Add Menu Item</b>
            {/* Add this scrollable container */}
            <div className="flex-1 overflow-y-auto max-h-[75vh] pr-2">
              {/* Delivery Price Section */}
              <div className="self-stretch flex flex-col items-start justify-start gap-[4px] mb-4">
                <div className="self-stretch relative leading-[20px] font-sans text-black">Delivery Price</div>
                <div className="self-stretch shadow-[0px_0px_2px_rgba(23,_26,_31,_0.12),_0px_0px_1px_rgba(23,_26,_31,_0.07)] rounded-[6px] bg-[#f6f6f6] border-[#fff] border-[1px] border-solid flex flex-row items-center justify-start py-[1px] px-[0px]">
                  <div className="w-[60px] rounded-[6px] bg-[#f6f6f6] border-[#fff] border-[1px] border-solid box-border overflow-hidden shrink-0 flex flex-row items-center justify-center py-[12px] px-[16px]">
                    <div className="relative leading-[20px] font-sans">GH₵</div>
                  </div>
                  <div className="flex-1 rounded-[6px] bg-[#fff] border-[#fff] border-[1px] border-solid flex flex-row items-center justify-between py-[12px] px-[16px] text-[#858a89] font-sans">
                    <div className="relative leading-[20px]">{deliveryPrice}</div> 
                  </div>
                </div>
              </div>
             
              {/* Menu Items Section */}
              <div className="self-stretch flex flex-col items-start justify-start gap-[4px] pt-4">
                <div className="self-stretch relative leading-[20px] font-sans">Menu</div>
                <div className="w-full">
                  <div className="text-[12px] leading-[20px] font-sans text-[#535353] mb-1">
                    Select Category
                  </div>
                  <StyledSelect
                    fullWidth
                    value={selectedCategory}
                    onChange={(event: SelectChangeEvent<unknown>, child: React.ReactNode) => {
                      setSelectedCategory(event.target.value as string);
                    }}
                    variant="outlined"
                    size="small"
                    className="mb-2"
                    displayEmpty
                  >
                    <MenuItem value="" disabled>
                      Select Category
                    </MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.value} value={category.label}>
                        {category.label}
                      </MenuItem>
                    ))}
                  </StyledSelect>
                </div>
              </div>
              <div className="self-stretch flex flex-row items-start justify-center flex-wrap content-start gap-[15px] text-[#6f7070] pt-4">
                <div className="flex-1 flex flex-col items-start justify-start gap-[6px]">
                  <div className="self-stretch relative leading-[20px] font-sans text-black">Items</div>
                  <div className="relative w-full">
                    <button
                      onClick={() => setIsItemsDropdownOpen(!isItemsDropdownOpen)}
                      className="w-full p-2 text-left border-[#efefef] border-[1px] border-solid rounded-md bg-white"
                    >
                      <div className="text-[14px] leading-[22px] font-sans">
                        {selectedItem || "Select Item"}
                      </div>
                    </button>
                    
                    {isItemsDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
                        {categoryItems.map((item) => (
                          <div
                            key={item.name}
                            className={`p-2 ${
                              item.quantity > 0 
                                ? 'hover:bg-gray-100 cursor-pointer'
                                : 'cursor-not-allowed opacity-100'
                            }`}
                            onClick={() => {
                              if (item.quantity > 0) {
                                setSelectedItem(item.name);
                                setIsItemsDropdownOpen(false);
                                addItem(item);
                              }
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-[14px] leading-[22px] font-sans">
                                  {item.name}
                                </span>
                                {item.quantity === 0 && (
                                  <span className="ml-2 text-[12px] text-red-500">
                                    Out of stock
                                  </span>
                                )}
                              </div>
                              <span className="text-[14px] leading-[22px] font-sans">
                                GH₵ {item.price}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
                          className="w-[20px] h-[20px] bg-[#f6f6f6] rounded flex items-center justify-center cursor-pointer text-black font-sans"
                        >
                          -
                        </button>
                        <div className="w-[20px] h-[20px] bg-[#f6f6f6] rounded flex items-center justify-center text-black font-sans">
                          {item.quantity}
                        </div>
                        <button 
                          onClick={() => updateQuantity(item.name, item.quantity + 1)}
                          className="w-[20px] h-[20px] bg-[#f6f6f6] rounded flex items-center justify-center cursor-pointer text-black font-sans"
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
              <div className="self-stretch flex flex-col items-start justify-start gap-[4px] pt-6">
                <div className="self-stretch relative leading-[20px] font-sans text-black">
                  Total Price
                </div>
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

            {/* Navigation Buttons - Keep outside scrollable area */}
            <div className="flex justify-between mt-8 pt-4 border-t">
              <button
                className="flex-1 font-sans cursor-pointer bg-[#201a18] border-[#201a18] border-[1px] border-solid 
                          py-[8px] text-white text-[10px] rounded-[4px] hover:opacity-90 text-center justify-center"
                onClick={handlePreviousStep}
                disabled={isSubmitting}
              >
                Back
              </button>
              <div className="mx-2" /> {/* Add space between buttons */}
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
            {/* Back button and heading */}
            <div className="flex items-center mb-6">
              <button
                className="flex items-center gap-2 text-[#201a18] text-sm font-sans hover:text-gray-700 bg-transparent"
                onClick={handlePreviousStep}
                disabled={isSubmitting}
              >
                <IoIosArrowBack className="w-5 h-5" />
                <span>Back</span>
              </button>
            </div>

            <b className="font-sans text-lg font-semibold mb-6">Choose Payment Method</b>
            
            {/* Add Estimated Distance section here */}
            <div className="self-stretch bg-[#f9fafb] rounded-lg p-4 mb-4">
              <div className="text-sm !font-sans">
                <div className="font-medium mb-1 !font-sans">Estimated Distance: {distance} km</div>
                <div className="text-gray-500 !font-sans">
                  From {pickupLocation?.address} to {dropoffLocation?.address}
                </div>
              </div>
            </div>

            {/* Order Price Section */}
            <div className="self-stretch flex flex-col items-start justify-start gap-[4px] text-[12px] text-[#686868] font-sans">
              <div className="self-stretch flex flex-col items-start justify-start gap-[4px]">
                <div className="self-stretch relative leading-[20px] font-sans">Delivery Price</div>
                <div className="self-stretch shadow-[0px_0px_2px_rgba(23,_26,_31,_0.12),_0px_0px_1px_rgba(23,_26,_31,_0.07)] rounded-[6px] bg-[#f6f6f6] border-[#fff] border-[1px] border-solid flex flex-row items-center justify-start py-[1px] px-[0px] mb-4">
                  <div className="w-[64px] rounded-[6px] bg-[#f6f6f6] border-[#fff] border-[1px] border-solid box-border overflow-hidden shrink-0 flex flex-row items-center justify-center py-[12px] px-[16px]">
                    <div className="relative leading-[20px] font-sans">GH₵</div>
                  </div>
                  <div className="flex-1 rounded-[6px] bg-[#fff] border-[#fff] border-[1px] border-solid flex flex-row items-center justify-start py-[12px] px-[16px] text-[#858a89]">
                    <div className="relative leading-[20px] font-sans">{deliveryPrice}</div>
                  </div>
                </div>
                <div className="self-stretch relative leading-[20px] font-sans">Food Price</div>
                <div className="self-stretch shadow-[0px_0px_2px_rgba(23,_26,_31,_0.12),_0px_0px_1px_rgba(23,_26,_31,_0.07)] rounded-[6px] bg-[#f6f6f6] border-[#fff] border-[1px] border-solid flex flex-row items-center justify-start py-[1px] px-[0px]">
                  <div className="w-[64px] rounded-[6px] bg-[#f6f6f6] border-[#fff] border-[1px] border-solid box-border overflow-hidden shrink-0 flex flex-row items-center justify-center py-[12px] px-[16px]">
                    <div className="relative leading-[20px] font-sans">GH₵</div>
                  </div>
                  <div className="flex-1 rounded-[6px] bg-[#fff] border-[#fff] border-[1px] border-solid flex flex-row items-center justify-start py-[12px] px-[16px] text-[#858a89]">
                    <div className="relative leading-[20px] font-sans">{totalFoodPrice}</div>
                  </div>
                </div>
                
              </div>

              <div className="self-stretch flex flex-col items-start justify-start gap-[4px] pt-2">
              <div className="self-stretch relative leading-[20px] font-sans text-black">
                Total Price
              </div>
              <div className="self-stretch shadow-[0px_0px_2px_rgba(23,_26,_31,_0.12),_0px_0px_1px_rgba(23,_26,_31,_0.07)] rounded-[6px] bg-[#f6f6f6] border-[#fff] border-[1px] border-solid flex flex-row items-center justify-start py-[1px] px-[0px]">
                <div className="w-[64px] rounded-[6px] bg-[#f6f6f6] border-[#fff] border-[1px] border-solid box-border overflow-hidden shrink-0 flex flex-row items-center justify-center py-[16px] px-[18px]">
                  <div className="relative leading-[20px] text-black font-sans">GH₵</div>
                </div>
                <div className="flex-1 rounded-[6px] bg-[#fff] border-[#fff] border-[1px] border-solid flex flex-row items-center justify-start py-[15px] px-[20px] text-[#858a89]">
                  <div className="relative leading-[20px] text-black font-sans">{calculateTotal()}</div>
                </div>
              </div>
            </div>

           

              {/* Payment Buttons */}
              <div className="flex gap-4 w-full pt-4">
                <button
                  className={`flex-1 font-sans cursor-pointer border-[1px] border-solid 
                            py-[8px] text-white text-[10px] rounded-[4px] hover:opacity-90 text-center justify-center
                            ${isPayLaterSubmitting || isPayNowSubmitting
                              ? 'bg-gray-400 border-gray-400 cursor-not-allowed'
                              : 'bg-[#201a18] border-[#201a18]'}`}
                  onClick={() => handlePlaceOrder('later')}
                  disabled={isPayLaterSubmitting || isPayNowSubmitting}
                >
                  {isPayLaterSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </div>
                  ) : (
                    'Pay on Delivery'
                  )}
                </button>
                <button
                  className={`flex-1 font-sans cursor-pointer border-[1px] border-solid 
                            py-[8px] text-white text-[10px] rounded-[4px] hover:opacity-90 text-center justify-center
                            ${isPayLaterSubmitting || isPayNowSubmitting
                              ? 'bg-gray-400 border-gray-400 cursor-not-allowed'
                              : 'bg-[#fd683e] border-[#fd683e]'}`}
                  onClick={() => handlePlaceOrder('now')}
                  disabled={isPayLaterSubmitting || isPayNowSubmitting}
                >
                  {isPayNowSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </div>
                  ) : (
                    'Request Payment'
                  )}
                </button>
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  const handlePickupLocationSelect = (location: LocationData) => {
    setPickupLocation(location);
    console.log('Selected Pickup Location:', location);
  };

  const handleDropoffLocationSelect = (location: LocationData) => {
    console.log('Dropoff location selected:', location);
    setDropoffLocation(location);
  };

  useEffect(() => {
    if (pickupLocation && dropoffLocation) {
      const calculatedDistance = calculateDistance(
        pickupLocation.latitude,
        pickupLocation.longitude,
        dropoffLocation.latitude,
        dropoffLocation.longitude
      );
      setDistance(calculatedDistance);
    } else {
      setDistance(null);
    }
  }, [pickupLocation, dropoffLocation]);

  // Add this delete handler function near your other handlers
  const handleDeleteItem = (itemName: string) => {
    setSelectedItems(selectedItems.filter(item => item.name !== itemName));
  };

  useEffect(() => {
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    console.log('UserProfile:', userProfile); // Debug log

    if (userProfile.branchesTable) {
      const location = {
        longitude: parseFloat(userProfile.branchesTable.branchLongitude),
        latitude: parseFloat(userProfile.branchesTable.branchLatitude),
        name: userProfile.branchesTable.branchName,
        address: userProfile.branchesTable.branchLocation
      };
      console.log('Setting pickup location:', location); // Debug log
      setPickupLocation(location);
    }
  }, []);

  const pickupPrefillData = userProfile.branchesTable ? {
    longitude: parseFloat(userProfile.branchesTable.branchLongitude),
    latitude: parseFloat(userProfile.branchesTable.branchLatitude),
    name: userProfile.branchesTable.branchName,
    address: userProfile.branchesTable.branchLocation
  } : undefined;

  // Update useEffect to handle branch data based on user role
  useEffect(() => {
    if (userProfile) {
      if (userProfile.role === 'Admin') {
        // For Admin users, use the selected branch
        if (selectedBranchId) {
          const selectedBranch = branches.find(branch => branch.id === selectedBranchId);
          if (selectedBranch) {
            setPickupData({
              fromLatitude: selectedBranch.branchLatitude,
              fromLongitude: selectedBranch.branchLongitude,
              fromAddress: selectedBranch.branchLocation,
              branchId: selectedBranch.id
            });
            handlePickupLocationSelect({
              address: selectedBranch.branchLocation,
              latitude: parseFloat(selectedBranch.branchLatitude),
              longitude: parseFloat(selectedBranch.branchLongitude),
              name: selectedBranch.branchName
            });
          }
        }
      } else {
        // For non-Admin users, use the branch from userProfile
        if (userProfile.branchesTable) {
          setPickupData({
            fromLatitude: userProfile.branchesTable.branchLatitude,
            fromLongitude: userProfile.branchesTable.branchLongitude,
            fromAddress: userProfile.branchesTable.branchLocation,
            branchId: userProfile.branchesTable.id
          });
          handlePickupLocationSelect({
            address: userProfile.branchesTable.branchLocation,
            latitude: parseFloat(userProfile.branchesTable.branchLatitude),
            longitude: parseFloat(userProfile.branchesTable.branchLongitude),
            name: userProfile.branchesTable.branchName
          });
        }
      }
    }
  }, [userProfile, selectedBranchId, branches]);

  // Replace the branch selection section with this:
  const renderBranchSelection = () => {
    if (userProfile?.role === 'Admin') {
      return (
        <div className="w-full">
          <div className="text-[12px] leading-[20px] font-sans text-[#535353] mb-1">
            Select Branch for Pickup
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
                setPickupData({
                  fromLatitude: selectedBranch.branchLatitude,
                  fromLongitude: selectedBranch.branchLongitude,
                  fromAddress: selectedBranch.branchLocation,
                  branchId: selectedBranch.id
                });
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
      );
    } else if (userProfile?.branchesTable) {
      return (
        <div className="w-full">
          <div className="text-[12px] leading-[20px] font-sans text-[#535353] mb-1">
            Pickup Branch
          </div>
          <div className="p-2 bg-gray-50 rounded-md text-sm font-sans">
            {userProfile.branchesTable.branchName} - {userProfile.branchesTable.branchLocation}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg w-[600px] relative flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 bg-transparent"
        >
          <IoIosCloseCircleOutline size={24} />
        </button>

        {/* Banner Modal */}
        {showBanner && (
          <div className="fixed top-0 left-0 right-0 bg-green-500 text-white text-center py-2">
            SMS has been sent to the user to make payments.
          </div>
        )}

        {/* Main content */}
        {renderStepContent()}
      </div>
    </div>
  );
};

export default PlaceOrder;