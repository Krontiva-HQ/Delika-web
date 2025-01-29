import React, { useState, useEffect, FunctionComponent, useMemo } from "react";
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

  // Memoize validation values
  const step1ValidationState = useMemo(() => {
    const isPhoneValid = customerPhone.length === 10 && /^\d+$/.test(customerPhone);
    const isNameValid = customerName.trim().length > 0;
    const areLocationsValid = pickupLocation !== null && dropoffLocation !== null;
    return isPhoneValid && isNameValid && areLocationsValid;
  }, [customerPhone, customerName, pickupLocation, dropoffLocation]);

  const step2ValidationState = useMemo(() => {
    return selectedItems.length > 0 && deliveryPrice !== '';
  }, [selectedItems, deliveryPrice]);

  const step3ValidationState = useMemo(() => {
    return customerName.trim() !== '' && 
      customerPhone.trim() !== '' && 
      pickupLocation !== null && 
      dropoffLocation !== null &&
      selectedItems.length > 0 && 
      deliveryPrice !== '';
  }, [customerName, customerPhone, pickupLocation, dropoffLocation, selectedItems, deliveryPrice]);

  // Update validation states only when memoized values change
  useEffect(() => {
    setIsStep1Valid(step1ValidationState);
  }, [step1ValidationState]);

  useEffect(() => {
    setIsStep2Valid(step2ValidationState);
  }, [step2ValidationState]);

  useEffect(() => {
    setIsStep3Valid(step3ValidationState);
  }, [step3ValidationState]);

  // Initialize pickup location only once
  useEffect(() => {
    if (userProfile?.branchesTable && !pickupLocation) {
      const location = {
        longitude: parseFloat(userProfile.branchesTable.branchLongitude),
        latitude: parseFloat(userProfile.branchesTable.branchLatitude),
        name: userProfile.branchesTable.branchName,
        address: userProfile.branchesTable.branchLocation
      };
      setPickupLocation(location);
    }
  }, [userProfile?.branchesTable, pickupLocation]);

  // Calculate delivery price based on distance
  useEffect(() => {
    if (distance !== null) {
      const updatedDistance = Math.max(0, distance - 1);
      const calculatedPrice = 15 + (updatedDistance * 2.5);
      setDeliveryPrice(calculatedPrice.toFixed(2));
    }
  }, [distance]);

  // Calculate total food price
  useEffect(() => {
    const total = selectedItems.reduce((sum, item) => {
      return sum + (Number(item.price) * Number(item.quantity));
    }, 0);
    setTotalFoodPrice(total.toFixed(2));
  }, [selectedItems]);

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
    return (itemsTotal + deliveryAmount).toFixed(2);
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
      throw error;
    } finally {
      // Reset the submitting state after a delay to show the loading state
      setTimeout(() => {
        setIsPayLaterSubmitting(false);
        setIsPayNowSubmitting(false);
      }, 2000);
    }
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
            onChange={(e) => setSelectedBranchId(e.target.value as string)}
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

  const handlePickupLocationSelect = (location: LocationData) => {
    setPickupLocation(location);
  };

  const handleDropoffLocationSelect = (location: LocationData) => {
    setDropoffLocation(location);
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

      
      </div>
    </div>
  );
};

export default PlaceOrder;