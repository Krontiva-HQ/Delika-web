import React, { useState, useEffect, FunctionComponent } from "react";
import { Button } from "@mui/material";
import { getAuthenticatedUser, UserResponse, placeOrder } from "../../services/api";
import LocationInput from '../../components/LocationInput';
import { LocationData } from "../../types/location";
import { calculateDistance } from "../../utils/distance";
import { RiDeleteBinLine } from "react-icons/ri";
import { usePlaceOrderItems } from '../../hooks/usePlaceOrderItems';
import { useNotifications } from '../../context/NotificationContext';
import { IoIosCloseCircleOutline, IoIosArrowBack, IoMdAdd } from "react-icons/io";
import { useUserProfile } from '../../hooks/useUserProfile';
import { useBranches } from '../../hooks/useBranches';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import { styled } from '@mui/material/styles';
import { SelectChangeEvent } from '@mui/material/Select';
import { toast } from 'react-toastify';
import BatchSummaryModal from '../../components/BatchSummaryModal';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';

// Add the API key directly if needed
const GOOGLE_MAPS_API_KEY = 'AIzaSyAdv28EbwKXqvlKo2henxsKMD-4EKB20l8';

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
  scheduleDelivery?: {
    scheduleDate: string;
    scheduleTime: string;
    scheduleDateTime: string;
  };
  Walkin: boolean; // Add this line
  payVisaCard: boolean;  // Add this new field
}

interface MenuItemData {
  name: string;
  price: string | number;
  available: boolean;
  image?: string;
  foodImage?: {
    url: string;
    filename: string;
    type: string;
    size: number;
  };
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

// Add new type for delivery method
type DeliveryMethod = 'on-demand' | 'full-service' | 'schedule' | 'batch-delivery' | 'walk-in' | null;

// Add this CSS class near your other styled components
const StyledDateInput = styled('input')({
  '&::-webkit-calendar-picker-indicator': {
    display: 'none'
  },
  '&::-webkit-inner-spin-button': {
    display: 'none'
  },
  '&::-webkit-clear-button': {
    display: 'none'
  },
  appearance: 'textfield',
  WebkitAppearance: 'textfield',
  MozAppearance: 'textfield',
});


const PlaceOrder: FunctionComponent<PlaceOrderProps> = ({ onClose, onOrderPlaced, branchId: initialBranchId }) => {
  const { addNotification } = useNotifications();
  const { userProfile, restaurantData } = useUserProfile();
  const { branches, isLoading: branchesLoading } = useBranches(userProfile?.restaurantId ?? null);
  const [selectedBranchId, setSelectedBranchId] = useState(initialBranchId || '');
  const [selectCategoryAnchorEl, setSelectCategoryAnchorEl] = useState<null | HTMLElement>(null);
  const [selectItemAnchorEl, setSelectItemAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [isItemsDropdownOpen, setIsItemsDropdownOpen] = useState(false);
  const [deliveryPrice, setDeliveryPrice] = useState<string>("");  // Change initial state type
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

  // Add these loading states near your other state declarations
  const [isPayLaterSubmitting, setIsPayLaterSubmitting] = useState(false);
  const [isPayNowSubmitting, setIsPayNowSubmitting] = useState(false);

  const [pickupData, setPickupData] = useState<any>(null);
  const [dropoffData, setDropoffData] = useState<any>(null);

  // Add new state for delivery method selection
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(null);

  // Add these new state variables near the top of the component with other state declarations
  const [scheduledDate, setScheduledDate] = useState(() => {
    // Set default to today's date in YYYY-MM-DD format
    return new Date().toISOString().split('T')[0];
  });
  const [scheduledTime, setScheduledTime] = useState('');

  // Add this check
  const isFullServiceDisabled = restaurantData?.Inventory && restaurantData?.Transactions;

  // First, add the state at the top with other states
  const [orderComment, setOrderComment] = useState<string>('');

  // Add these new state variables at the top with other states
  const [batchId, setBatchId] = useState<string | null>(null);
  const [batchedOrders, setBatchedOrders] = useState<any[]>([]);
  const [showBatchSummary, setShowBatchSummary] = useState(false);

  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);

  // Fix the check to explicitly look for false
  const isOnDemandDisabled = restaurantData?.WalkIn === false;

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
    if (currentStep === 1) {
      if (deliveryMethod === 'on-demand' || deliveryMethod === 'schedule' || deliveryMethod === 'batch-delivery') {
        // Skip directly to step 3 for these delivery methods
        setCurrentStep(3);
      } else {
        // Normal progression for full-service
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  // Function to handle previous step
  const handlePreviousStep = () => {
    if (currentStep === 3) {
      // For on-demand, schedule and batch delivery, go back to step 1
      if (deliveryMethod === 'on-demand' || deliveryMethod === 'schedule' || deliveryMethod === 'batch-delivery') {
        setCurrentStep(1);
      } else {
        // For full-service, go back to step 2
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  // Add useEffect to fetch user data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await getAuthenticatedUser();
        setUserData(response.data);
      } catch (error) {
      }
    };

    fetchUserData();
  }, []);

  // Add this function to generate a 6-digit batch ID
  const generateBatchId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Add this useEffect to generate batch ID when delivery method is selected
  useEffect(() => {
    if (deliveryMethod === 'batch-delivery' && !currentBatchId) {
      setCurrentBatchId(generateBatchId());
    }
  }, [deliveryMethod]);

  // Modify your handlePlaceOrder function
  const handlePlaceOrder = async (paymentType: 'cash' | 'momo' | 'visa') => {
    try {
      setIsSubmitting(true);

      const formData = new FormData();
      
      // Add products to formData
      selectedItems.forEach((item, index) => {
        formData.append(`products[${index}][name]`, item.name);
        formData.append(`products[${index}][price]`, item.price.toString());
        formData.append(`products[${index}][quantity]`, item.quantity.toString());
        if (item.image) {
          formData.append(`products[${index}][foodImage][url]`, item.image);
        }
      });

      // Add other fields to formData
      formData.append('customerName', customerName);
      formData.append('customerPhoneNumber', customerPhone);
      formData.append('restaurantId', userProfile?.restaurantId || '');
      formData.append('branchId', selectedBranchId || userProfile?.branchId || '');
      formData.append('deliveryPrice', deliveryPrice);
      formData.append('orderPrice', totalFoodPrice);
      formData.append('totalPrice', calculateTotal());
      formData.append('pickupName', pickupLocation?.address || '');
      formData.append('dropoffName', dropoffLocation?.address || '');
      formData.append('orderComment', orderComment);
      
      // Set orderStatus based on delivery method
      const orderStatus = deliveryMethod === 'walk-in' ? 'Delivered' : 'ReadyForPickup';
      formData.append('orderStatus', orderStatus);

      formData.append('orderDate', new Date().toISOString());
      formData.append('foodAndDeliveryFee', 'true');
      formData.append('deliveryDistance', distance?.toString() || '');
      formData.append('onlyDeliveryFee', 'false');
      formData.append('payNow', (paymentType === 'cash').toString());
      formData.append('payLater', (paymentType === 'momo').toString());
      formData.append('payVisaCard', (paymentType === 'visa').toString());
      formData.append('Walkin', (deliveryMethod === 'walk-in').toString());

      // Add pickup and dropoff locations
      if (pickupLocation) {
        formData.append('pickup[0][fromLatitude]', pickupLocation.latitude.toString());
        formData.append('pickup[0][fromLongitude]', pickupLocation.longitude.toString());
        formData.append('pickup[0][fromAddress]', pickupLocation.address);
      }
      if (dropoffLocation) {
        formData.append('dropOff[0][toLatitude]', dropoffLocation.latitude.toString());
        formData.append('dropOff[0][toLongitude]', dropoffLocation.longitude.toString());
        formData.append('dropOff[0][toAddress]', dropoffLocation.address);
      }

      // Debug log to check the formData
      formData.forEach((value, key) => {
        console.log(key, value);
      });

      // Inside handlePlaceOrder function, add this before the formData.append:
      console.log('Selected delivery method:', deliveryMethod);

      // Use the placeOrder function from api.ts
      const response = await placeOrder(formData);

      if (!response.data) {
        throw new Error('Failed to place order');
      }

      onOrderPlaced();
    } catch (error) {
      console.error('Error placing order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateDeliveryFee = (distance: number): number => {
    if (distance <= 1) {
        return 15; // Fixed fee for distances up to 1km
    } else if (distance <= 2) {
        return 20; // Fixed fee for distances between 1km and 2km
    } else if (distance <= 10) {
        // For distances > 2km and <= 10km: 17 cedis base price + 2.5 cedis per km beyond 2km
        return 17 + ((distance - 2) * 2.5);
    } else {
        // For distances above 10km: 3.5 * distance + 20
        return (3.5 * distance) + 20;
    }
};

  // Update the delivery price calculation in the useEffect
  useEffect(() => {
    if (distance !== null) {
        const calculatedPrice = Math.round(calculateDeliveryFee(distance));
        setDeliveryPrice(`${calculatedPrice}.00`);
    }
  }, [distance]);

  // Add validation effects
  useEffect(() => {
    // Validate Step 1
    const isPhoneValid = customerPhone.length === 10 && /^\d+$/.test(customerPhone);
    const isNameValid = customerName.trim().length > 0;
    const areLocationsValid = pickupLocation !== null && dropoffLocation !== null;
    const isDistanceValid = distance !== null;

    const isValid = isNameValid && isPhoneValid && areLocationsValid && isDistanceValid;
    
    setIsStep1Valid(isValid);
  }, [customerName, customerPhone, pickupLocation, dropoffLocation, distance]);

  useEffect(() => {
    // Validate Step 2
    const hasItems = selectedItems.length > 0;
    const hasDeliveryPrice = deliveryPrice !== '' && parseFloat(deliveryPrice) > 0;
    
    setIsStep2Valid(hasItems && hasDeliveryPrice);
  }, [selectedItems, deliveryPrice]);

  useEffect(() => {
    // Validate Step 3
    const isBasicInfoValid = customerName.trim() !== '' && 
                            customerPhone.length === 10 && 
                            pickupLocation !== null && 
                            dropoffLocation !== null;
    const isPricingValid = selectedItems.length > 0 && 
                          deliveryPrice !== '' && 
                          parseFloat(deliveryPrice) > 0;
    
    setIsStep3Valid(isBasicInfoValid && isPricingValid);
  }, [customerName, customerPhone, pickupLocation, dropoffLocation, selectedItems, deliveryPrice]);

  // Render different sections based on current step
  const renderStepContent = () => {
    switch (deliveryMethod) {
      case 'on-demand':
        return renderOnDemandContent();
      
      case 'schedule':
        return renderScheduleContent();
        
      case 'batch-delivery':
        return renderBatchContent();
        
      case 'full-service':
        return renderFullServiceContent();
       
        case 'walk-in':
        return renderWalkInContent();

     
      default:
        // Redirect to step 1 if somehow we get to an invalid step
        setCurrentStep(1);
        return null;
    }
  };

  const renderOnDemandContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            {/* Back to delivery type button */}
            <div className="flex items-center mb-6">
              <button
                className="flex items-center gap-2 text-[#201a18] text-sm font-sans hover:text-gray-700 bg-transparent"
                onClick={handleBackToDeliveryType}
              >
                <IoIosArrowBack className="w-5 h-5" />
                <span>Back to Delivery Types</span>
              </button>
            </div>
            
            <b className="font-sans text-lg font-semibold gap-2 mb-4">
              {deliveryMethod === 'on-demand' ? 'On Demand Delivery' :
               deliveryMethod === 'schedule' ? 'Schedule Delivery' :
               'Batch Delivery'}
            </b>
            
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
            
            <b className="font-sans text-lg font-semibold mb-6">Choose Payment Method</b>

            {/* Scrollable container */}
            <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: 'calc(100vh - 250px)' }}>
              <div className="flex flex-col gap-4">
                {/* Add scheduling inputs for schedule delivery */}
                {deliveryMethod === 'schedule' && (
                  <div className="self-stretch flex flex-row items-start justify-center flex-wrap content-start gap-[15px] mb-4">
                    <div className="flex-1 flex flex-col items-start justify-start gap-[4px]">
                      <div className="self-stretch relative leading-[20px] font-sans text-black">
                        Delivery Date
                      </div>
                      <StyledDateInput
                        type="date"
                        value={scheduledDate}
                        onChange={handleDateChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="font-sans border-[#efefef] border-[1px] border-solid [outline:none] 
                                  text-[12px] bg-[#fff] self-stretch rounded-[3px] overflow-hidden 
                                  flex flex-row items-center justify-start py-[10px] px-[12px]"
                      />
                    </div>
                    <div className="flex-1 flex flex-col items-start justify-start gap-[4px]">
                      <div className="self-stretch relative leading-[20px] font-sans text-black">
                        Delivery Time
                      </div>
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="font-sans border-[#efefef] border-[1px] border-solid [outline:none] 
                                  text-[12px] bg-[#fff] self-stretch rounded-[3px] overflow-hidden 
                                  flex flex-row items-center justify-start py-[10px] px-[12px]"
                      />
                    </div>
                  </div>
                )}

                {/* Add Estimated Distance section */}
                <div className="self-stretch bg-[#f9fafb] rounded-lg p-4">
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
                  </div>

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
          </>
        );
      default:
        // Redirect to step 1 if somehow we get to an invalid step
        setCurrentStep(1);
        return null;
    }
  };

  const renderScheduleContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            {/* Back to delivery type button */}
            <div className="flex items-center mb-6">
              <button
                className="flex items-center gap-2 text-[#201a18] text-sm font-sans hover:text-gray-700 bg-transparent"
                onClick={handleBackToDeliveryType}
              >
                <IoIosArrowBack className="w-5 h-5" />
                <span>Back to Delivery Types</span>
              </button>
            </div>
            
            <b className="font-sans text-lg font-semibold gap-2 mb-4">
              {deliveryMethod === 'on-demand' ? 'On Demand Delivery' :
               deliveryMethod === 'schedule' ? 'Schedule Delivery' :
               'Batch Delivery'}
            </b>
            
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
            <div className="flex items-center mb-6">
              
              <button
                className="flex items-center gap-2 text-[#201a18] text-sm font-sans hover:text-gray-700 bg-transparent"
                onClick={handlePreviousStep}
              >
                <IoIosArrowBack className="w-5 h-5" />
                <span>Back</span>
              </button>
            </div>
            
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
                              item.available 
                                ? 'hover:bg-gray-100 cursor-pointer'
                                : 'cursor-not-allowed opacity-100'
                            }`}
                            onClick={() => {
                              if (item.available) {
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
                                {!item.available && (
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

            {/* Navigation Button - Keep outside scrollable area */}
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
            <div className="flex items-center mb-6">
              
             
              <button
                className="flex items-center gap-2 text-[#201a18] text-sm font-sans hover:text-gray-700 bg-transparent"
                onClick={handlePreviousStep}
              >
                <IoIosArrowBack className="w-5 h-5" />
                <span>Back</span>
              </button>
            </div>
            
            <b className="font-sans text-lg font-semibold mb-6">Choose Payment Method</b>

            {/* Scrollable container */}
            <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: 'calc(100vh - 250px)' }}>
              <div className="flex flex-col gap-4">
                {/* Only show scheduling inputs for schedule delivery method */}
                {deliveryMethod === 'schedule' && (
                  <div className="self-stretch flex flex-row items-start justify-center flex-wrap content-start gap-[15px] mb-4">
                    <div className="flex-1 flex flex-col items-start justify-start gap-[4px]">
                      <div className="self-stretch relative leading-[20px] font-sans text-black">
                        Delivery Date
                      </div>
                      <StyledDateInput
                        type="date"
                        value={scheduledDate}
                        onChange={handleDateChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="font-sans border-[#efefef] border-[1px] border-solid [outline:none] 
                                  text-[12px] bg-[#fff] self-stretch rounded-[3px] overflow-hidden 
                                  flex flex-row items-center justify-start py-[10px] px-[12px]"
                      />
                    </div>
                    <div className="flex-1 flex flex-col items-start justify-start gap-[4px]">
                      <div className="self-stretch relative leading-[20px] font-sans text-black">
                        Delivery Time
                      </div>
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="font-sans border-[#efefef] border-[1px] border-solid [outline:none] 
                                  text-[12px] bg-[#fff] self-stretch rounded-[3px] overflow-hidden 
                                  flex flex-row items-center justify-start py-[10px] px-[12px]"
                      />
                    </div>
                  </div>
                )}

                {/* Add Estimated Distance section */}
                <div className="self-stretch bg-[#f9fafb] rounded-lg p-4">
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
                  </div>

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
          </>
        );
      default:
        // Redirect to step 1 if somehow we get to an invalid step
        setCurrentStep(1);
        return null;
    }
  };

  const renderBatchContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            {/* Back to delivery type button */}
            <div className="flex items-center mb-6">
              <button
                className="flex items-center gap-2 text-[#201a18] text-sm font-sans hover:text-gray-700 bg-transparent"
                onClick={handleBackToDeliveryType}
              >
                <IoIosArrowBack className="w-5 h-5" />
                <span>Back to Delivery Types</span>
              </button>
            </div>
            
            <b className="font-sans text-lg font-semibold gap-2 mb-4">
              {deliveryMethod === 'on-demand' ? 'On Demand Delivery' :
               deliveryMethod === 'schedule' ? 'Schedule Delivery' :
               'Batch Delivery'}
            </b>
            
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
            
            <b className="font-sans text-lg font-semibold mb-6">Choose Payment Method</b>

            {/* Scrollable container */}
            <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: 'calc(100vh - 250px)' }}>
              <div className="flex flex-col gap-4">
                {/* Only show scheduling inputs for schedule delivery method */}
                {deliveryMethod === 'schedule' && (
                  <div className="self-stretch flex flex-row items-start justify-center flex-wrap content-start gap-[15px] mb-4">
                    <div className="flex-1 flex flex-col items-start justify-start gap-[4px]">
                      <div className="self-stretch relative leading-[20px] font-sans text-black">
                        Delivery Date
                      </div>
                      <StyledDateInput
                        type="date"
                        value={scheduledDate}
                        onChange={handleDateChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="font-sans border-[#efefef] border-[1px] border-solid [outline:none] 
                                  text-[12px] bg-[#fff] self-stretch rounded-[3px] overflow-hidden 
                                  flex flex-row items-center justify-start py-[10px] px-[12px]"
                      />
                    </div>
                    <div className="flex-1 flex flex-col items-start justify-start gap-[4px]">
                      <div className="self-stretch relative leading-[20px] font-sans text-black">
                        Delivery Time
                      </div>
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="font-sans border-[#efefef] border-[1px] border-solid [outline:none] 
                                  text-[12px] bg-[#fff] self-stretch rounded-[3px] overflow-hidden 
                                  flex flex-row items-center justify-start py-[10px] px-[12px]"
                      />
                    </div>
                  </div>
                )}

                {/* Add Estimated Distance section */}
                <div className="self-stretch bg-[#f9fafb] rounded-lg p-4">
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
                  </div>

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
          </>
        );
      default:
        // Redirect to step 1 if somehow we get to an invalid step
        setCurrentStep(1);
        return null;
    }
  };

  const renderFullServiceContent = () => {
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
                <span>Back to Delivery Types</span>
              </button>
            </div>
            
            <b className="font-sans text-lg font-semibold gap-2 mb-4">Full Service Delivery</b>
            
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
                                item.available 
                                  ? 'hover:bg-gray-100 cursor-pointer'
                                  : 'cursor-not-allowed opacity-100'
                              }`}
                              onClick={() => {
                                if (item.available) {   
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
                                  {!item.available && (
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
            <div className="flex items-center mb-6">
              
             
              <button
                className="flex items-center gap-2 text-[#201a18] text-sm font-sans hover:text-gray-700 bg-transparent"
                onClick={handlePreviousStep}
              >
                <IoIosArrowBack className="w-5 h-5" />
                <span>Back</span>
              </button>
            </div>
            
            <b className="font-sans text-lg font-semibold mb-6">Choose Payment Method</b>

            {/* Scrollable container */}
            <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: 'calc(100vh - 250px)' }}>
              <div className="flex flex-col gap-4">
                {/* Only show scheduling inputs for schedule delivery method */}
                {deliveryMethod === 'schedule' && (
                  <div className="self-stretch flex flex-row items-start justify-center flex-wrap content-start gap-[15px] mb-4">
                    <div className="flex-1 flex flex-col items-start justify-start gap-[4px]">
                      <div className="self-stretch relative leading-[20px] font-sans text-black">
                        Delivery Date
                      </div>
                      <StyledDateInput
                        type="date"
                        value={scheduledDate}
                        onChange={handleDateChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="font-sans border-[#efefef] border-[1px] border-solid [outline:none] 
                                  text-[12px] bg-[#fff] self-stretch rounded-[3px] overflow-hidden 
                                  flex flex-row items-center justify-start py-[10px] px-[12px]"
                      />
                    </div>
                    <div className="flex-1 flex flex-col items-start justify-start gap-[4px]">
                      <div className="self-stretch relative leading-[20px] font-sans text-black">
                        Delivery Time
                      </div>
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="font-sans border-[#efefef] border-[1px] border-solid [outline:none] 
                                  text-[12px] bg-[#fff] self-stretch rounded-[3px] overflow-hidden 
                                  flex flex-row items-center justify-start py-[10px] px-[12px]"
                      />
                    </div>
                  </div>
                )}

                {/* Add Estimated Distance section */}
                <div className="self-stretch bg-[#f9fafb] rounded-lg p-4">
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
                  </div>

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
          </>
        );
      default:
        // Redirect to step 1 if somehow we get to an invalid step
        setCurrentStep(1);
        return null;
    }
  };

  const renderWalkInContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <b className="font-sans text-lg font-semibold">Add Menu Item</b>
            {/* Add this scrollable container */}
            <div className="flex-1 overflow-y-auto max-h-[75vh] pr-2">
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
                              item.available 
                                ? 'hover:bg-gray-100 cursor-pointer'
                                : 'cursor-not-allowed opacity-100'
                            }`}
                            onClick={() => {
                              if (item.available) {
                                setSelectedItem(item.name);
                                setIsItemsDropdownOpen(false);
                                // Add the item to selected items with initial quantity of 1
                                const newItem: SelectedItem = {
                                  name: item.name,
                                  quantity: 1,
                                  price: parseFloat(item.price as string),
                                  image: item.image || ''
                                };
                                setSelectedItems(prev => [...prev, newItem]);
                              }
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-[14px] leading-[22px] font-sans">
                                  {item.name}
                                </span>
                                {!item.available && (
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

              {/* Navigation Button */}
              <div className="flex justify-between mt-8 pt-4 border-t">
              <button
                className={`flex-1 font-sans cursor-pointer border-[1px] border-solid 
                          py-[8px] text-white text-[10px] rounded-[4px] hover:opacity-90 text-center justify-center
                          ${selectedItems.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#fd683e]'}`}
                onClick={handleNextStep}
                disabled={selectedItems.length === 0}
              >
                Next
              </button>
            </div>
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
              
              <b className="font-sans text-lg font-semibold mb-6">Customer Details</b>
  
              {/* Order Summary Section */}
              <div className="mb-6 bg-[#f9fafb] rounded-lg p-4 font-sans">
                <div className="font-sans text-lg font-semibold mb-3">Order Summary</div>
                <div className="space-y-3">
                  {selectedItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.quantity}x</span>
                        <span>{item.name}</span>
                      </div>
                      <span className="text-gray-600">GH₵ {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between items-center font-medium">
                      <span>Total Items:</span>
                      <span>{selectedItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Details Section */}
              <div className="self-stretch flex flex-col gap-4">
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
              </div>

              {/* Total Price Section */}
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

              {/* Payment Buttons */}
              <div className="flex gap-4 w-full mt-6">
                <button
                  className={`flex-1 font-sans cursor-pointer border-[1px] border-solid 
                            py-[8px] text-white text-[10px] rounded-[4px] hover:opacity-90 text-center justify-center
                            ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#201a18] border-[#201a18]'}`}
                  onClick={() => handlePlaceOrder('cash')}
                  disabled={isSubmitting || !customerName.trim()}
                >
                  {isSubmitting ? 'Processing...' : 'Cash'}
                </button>
  
                <button
                  className={`flex-1 font-sans cursor-pointer border-[1px] border-solid 
                            py-[8px] text-white text-[10px] rounded-[4px] hover:opacity-90 text-center justify-center
                            ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#fd683e] border-[#fd683e]'}`}
                  onClick={() => handlePlaceOrder('momo')}
                  disabled={isSubmitting || !customerName.trim()}
                >
                  {isSubmitting ? 'Processing...' : 'MoMo'}
                </button>
  
                <button
                  className={`flex-1 font-sans cursor-pointer border-[1px] border-solid 
                            py-[8px] text-white text-[10px] rounded-[4px] hover:opacity-90 text-center justify-center
                            ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#4CAF50] border-[#4CAF50]'}`}
                  onClick={() => handlePlaceOrder('visa')}
                  disabled={isSubmitting || !customerName.trim()}
                >
                  {isSubmitting ? 'Processing...' : 'Visa Card'}
                </button>
              </div>
            </>
          );
      default:
        return null;
    }
  };

  const handlePickupLocationSelect = (location: LocationData) => {
    setPickupLocation(location);
  };

  const handleDropoffLocationSelect = (location: LocationData) => {
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

    if (userProfile.branchesTable) {
      const location = {
        longitude: parseFloat(userProfile.branchesTable.branchLongitude),
        latitude: parseFloat(userProfile.branchesTable.branchLatitude),
        name: userProfile.branchesTable.branchName,
        address: userProfile.branchesTable.branchLocation
      };
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

  // Modify the handleDeliveryMethodSelect function
  const handleDeliveryMethodSelect = (method: DeliveryMethod) => {
    setDeliveryMethod(method);
    
    // If walk-in is selected, ensure Walkin is set to true
    if (method === 'walk-in') {
      // Add any additional logic needed for walk-in orders
      console.log('Walk-in service selected');
    }
    
    // Reset any other delivery-specific states if needed
    // ... existing code ...
  };

  // Add this function to handle date changes with validation
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    const today = new Date().toISOString().split('T')[0];
    
    // Only allow dates from today onwards
    if (selectedDate >= today) {
      setScheduledDate(selectedDate);
    }
  };

  // When submitting the order, you can create the timestamp like this:
  const getScheduledTimestamp = () => {
    if (scheduledDate && scheduledTime) {
      const [hours, minutes] = scheduledTime.split(':');
      const scheduleDateTime = new Date(scheduledDate);
      scheduleDateTime.setHours(parseInt(hours), parseInt(minutes), 0);
      return scheduleDateTime.getTime(); // Returns timestamp in milliseconds
    }
    return null;
  };

  const handleAddItem = (item: MenuItemData) => {
    const newItem: SelectedItem = {
      name: item.name,
      quantity: 1,
      price: parseFloat(item.price as string),
      image: item.foodImage?.url || ''
    };
    setSelectedItems(prev => [...prev, newItem]);
    console.log('Added item:', newItem); // Debug log
  };

  // Add these functions inside the PlaceOrder component
  const handleAddAnotherOrder = () => {
    // Add check for maximum orders
    if (batchedOrders.length >= 5) {
      addNotification({
        type: 'order_status',
        message: 'Maximum limit of 5 orders per batch reached'
      });
      return;
    }

    // Reset form fields but keep the batch ID
    setCustomerName('');
    setCustomerPhone('');
    setPickupLocation(null);
    setDropoffLocation(null);
    setSelectedItems([]);
    setOrderComment('');
    setDeliveryPrice("0");
    setDistance(0);
    
    // Hide the summary modal
    setShowBatchSummary(false);
    
    // Reset to step 1
    setCurrentStep(1);
  };

  const handleCompleteBatch = () => {
    // Clear batch-related states for next batch
    setCurrentBatchId(null);
    setBatchedOrders([]);
    setShowBatchSummary(false);
    onClose();
    
    addNotification({
      type: 'batch_completed',
      message: `Batch #${currentBatchId} has been completed with ${batchedOrders.length} orders`
    });
  };

  // Add new function to reset form state
  const resetFormState = () => {
    setCustomerName('');
    setCustomerPhone('');
    setPickupLocation(null);
    setDropoffLocation(null);
    setSelectedItems([]);
    setDeliveryPrice('');
    setTotalFoodPrice('0.00');
    setCurrentStep(1);
    setOrderComment('');
    setDistance(null);
    setSelectedCategory('');
    setSelectedItem('');
    setBatchId(null);
    setBatchedOrders([]);
  };

  // Add function to handle back to delivery type selection
  const handleBackToDeliveryType = () => {
    setDeliveryMethod(null);
    resetFormState();
  };

  const isWalkInValid = () => {
    return (
        customerName.trim() !== '' &&
        customerPhone.length === 10 &&
        selectedItems.length > 0
    );
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

        {!deliveryMethod ? (
          // Initial delivery method selection modal
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-semibold mb-8 font-sans">Select Service Type</h2>
            <div className="flex gap-4 w-full justify-center flex-nowrap">
              {/* On-Demand Delivery */}
              <div
                onClick={() => !isOnDemandDisabled && handleDeliveryMethodSelect('on-demand')}
                className={`flex flex-col items-center p-6 bg-[#FFF5F3] rounded-lg relative w-[200px]
                  ${isOnDemandDisabled 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'cursor-pointer hover:bg-[#FFE5E0] transition-colors'}`}
              >
                <div className="w-14 h-14 mb-4">
                  <img src="/on-demand-delivery.svg" alt="On-Demand" className="w-full h-full" />
                </div>
                <span className="text-center font-medium font-sans">On Demand<br/>Delivery</span>
              </div>

              {/* Full-service */}
              <div
                className={`flex flex-col items-center p-6 bg-[#FFF5F3] rounded-lg relative w-[200px]
                  ${isFullServiceDisabled 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'cursor-pointer hover:bg-[#FFE5E0] transition-colors'}`}
                onClick={() => {
                  if (!isFullServiceDisabled) {
                    handleDeliveryMethodSelect('full-service');
                  }
                }}
              >
                <div className="w-14 h-14 mb-4">
                  <img src="/full-service.svg" alt="Full-service" className="w-full h-full" />
                </div>
                <span className="text-center font-medium font-sans">Full-service<br/>Delivery</span>
              </div>  

              {/* Schedule Delivery */}
              <div
                onClick={() => handleDeliveryMethodSelect('schedule')}
                className="flex flex-col items-center p-6 bg-[#FFF5F3] rounded-lg cursor-pointer hover:bg-[#FFE5E0] transition-colors w-[200px]"
              >
                <div className="w-14 h-14 mb-4">
                  <img src="/schedule-delivery.svg" alt="Schedule" className="w-full h-full" />
                </div>
                <span className="text-center font-medium font-sans">Schedule<br/>Delivery</span>
              </div>

              {/* Batch Delivery */}
              <div
                onClick={() => handleDeliveryMethodSelect('batch-delivery')}
                className="flex flex-col items-center p-6 bg-[#FFF5F3] rounded-lg cursor-pointer hover:bg-[#FFE5E0] transition-colors w-[200px]"
              >
                <div className="w-14 h-14 mb-4">
                  <img src="/batch-delivery.svg" alt="Batch" className="w-full h-full" />
                </div>
                <span className="text-center font-medium font-sans">Batch<br/>Delivery</span>
              </div>

              {/* Walk-In Service */}
              <div
                onClick={() => handleDeliveryMethodSelect('walk-in')}
                className="flex flex-col items-center p-6 bg-[#FFF5F3] rounded-lg cursor-pointer hover:bg-[#FFE5E0] transition-colors w-[200px]"
              >
                <div className="w-14 h-14 mb-4">
                  <img src="/dining-out.png" alt="Walk-In" className="w-full h-full" />
                </div>
                <span className="text-center font-medium font-sans">Walk-In<br/>Service</span>
              </div>
            </div>
          </div>
        ) : (
          // Existing order placement modal content
          <>
            {/* Main content */}
            {renderStepContent()}
          </>
        )}

        <BatchSummaryModal
          open={showBatchSummary}
          orders={batchedOrders}
          batchId={batchId || ''}
          onAddAnother={handleAddAnotherOrder}
          onComplete={handleCompleteBatch}
        />
      </div>
    </div>
  );
};

export default PlaceOrder;
