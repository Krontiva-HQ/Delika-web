import React, { useState, useEffect, FunctionComponent } from "react";
import { IoIosCloseCircleOutline, IoIosArrowBack } from "react-icons/io";
import { RiDeleteBinLine } from "react-icons/ri";
import LocationInput from '../../components/LocationInput';
import { LocationData } from "../../types/location";
import { calculateDistance } from "../../utils/distance";
import { usePlaceOrderItems } from '../../hooks/usePlaceOrderItems';
import { useNotifications } from '../../context/NotificationContext';
import { Order } from '../../types/order';
import { useEditOrder } from '../../hooks/useEditOrder';

interface EditOrderProps {
  order: Order;
  onClose: () => void;
  onOrderEdited: () => void;
}

const EditOrder: FunctionComponent<EditOrderProps> = ({ order, onClose, onOrderEdited }) => {
  const { addNotification } = useNotifications();
  const [currentStep, setCurrentStep] = useState(1);
  const [customerName, setCustomerName] = useState(order.customerName);
  const [customerPhone, setCustomerPhone] = useState(order.customerPhoneNumber);
  const [pickupLocation, setPickupLocation] = useState<LocationData>({
    latitude: parseFloat(order.pickup[0].fromLatitude),
    longitude: parseFloat(order.pickup[0].fromLongitude),
    address: order.pickup[0].fromAddress,
    name: order.pickupName
  });
  const [dropoffLocation, setDropoffLocation] = useState<LocationData>({
    latitude: parseFloat(order.dropOff[0].toLatitude),
    longitude: parseFloat(order.dropOff[0].toLongitude),
    address: order.dropOff[0].toAddress,
    name: order.dropoffName
  });
  const [deliveryPrice, setDeliveryPrice] = useState(parseFloat(order.deliveryPrice));
  const [distance, setDistance] = useState<number | null>(parseFloat(order.deliveryDistance));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderStatus, setOrderStatus] = useState(order.orderStatus);
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [orderPrice] = useState(parseFloat(order.orderPrice));
  const [totalPrice, setTotalPrice] = useState(parseFloat(order.totalPrice));
  const [comment, setComment] = useState(order.orderComment || '');
  
  const { 
    selectedItems,
    setSelectedItems,
    selectedCategory, 
    setSelectedCategory,
    updateQuantity,
    removeItem
  } = usePlaceOrderItems();

  const { editOrder, isLoading, error } = useEditOrder();

  // Add validation states
  const [isValidPhone, setIsValidPhone] = useState(true);
  const [isValidName, setIsValidName] = useState(true);

  // Modify the customer phone input handler
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setCustomerPhone(value);
    setIsValidPhone(value.length === 10); // Validate phone number length
  };

  // Add name input handler
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setCustomerName(value);
    setIsValidName(value.length > 0);
  };

  // Add validation check
  const isFormValid = isValidPhone && isValidName && customerName.trim() !== '' && customerPhone.length === 10;

  // Initialize selected items from order
  useEffect(() => {
    const initialItems = order.products.map(product => ({
      name: product.name,
      quantity: parseInt(product.quantity),
      price: parseFloat(product.price),
      image: product.foodImage?.url || ''
    }));
    setSelectedItems(initialItems);
  }, [order]);

  // Add this useEffect to update distance when locations change
  useEffect(() => {
    if (pickupLocation && dropoffLocation) {
      const newDistance = calculateDistance(
        pickupLocation.latitude,
        pickupLocation.longitude,
        dropoffLocation.latitude,
        dropoffLocation.longitude
      );
      setDistance(newDistance);
      
      // Calculate delivery price based on distance
      let calculatedPrice;
      if (newDistance <= 2) {
        calculatedPrice = 10; // Fixed price for distances up to 2km
      } else {
        const updatedDistance = Math.max(0, newDistance - 1); // Ensure we don't go below 0
        calculatedPrice = Math.round(15 + (updatedDistance * 2.5)); // Round to nearest whole number
      }
      setDeliveryPrice(calculatedPrice);
      
      // Update total price
      setTotalPrice(orderPrice + calculatedPrice);
    }
  }, [pickupLocation, dropoffLocation, orderPrice]);

  useEffect(() => {
    if (order) {
      setPaymentStatus(order.paymentStatus || 'Pending');
    }
  }, [order]);

  const handleSaveChanges = async () => {
    const params = {
      dropOff: [
        {
          toAddress: dropoffLocation.address,
          toLatitude: dropoffLocation.latitude.toString(),
          toLongitude: dropoffLocation.longitude.toString(),
        },
      ],
      orderNumber: order.orderNumber,
      customerName: customerName,
      customerPhoneNumber: customerPhone,
      deliveryDistance: distance?.toString() || '',
      trackingUrl: order.trackingUrl, // Assuming this is part of the order object
      orderStatus,
      deliveryPrice: deliveryPrice.toString(),
      totalPrice: totalPrice.toString(),
      paymentStatus: paymentStatus,
      dropOffCity: dropoffLocation.name, // Assuming this is the city name
      orderComment: comment
    };

    try {
      await editOrder(params);
      onOrderEdited();
      
      // Add a notification for successful order edit
      addNotification({
        type: 'order_edited',
        message: `Order **#${order.orderNumber}** has been successfully edited.`,
      });
    } catch (err) {
      
      // Add a notification for error
      addNotification({
        type: 'order_status',
        message: `Failed to edit Order #${order.orderNumber}. Please try again.`,
      });
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <b className="font-sans text-sm  gap-2 mb-4">Edit Order #{order.orderNumber}</b>
            {/* Customer Details Section */}
            <div className="self-stretch flex flex-row items-start justify-center flex-wrap content-start gap-[15px] mb-4 font-sans text-sm">
              <div className="flex-1 flex flex-col items-start justify-start gap-[4px]">
                <div className="self-stretch  leading-[18px] font-sans text-black">
                  Customer Name
                </div>
                <input
                  className={`font-sans border-[1px] border-solid [outline:none] 
                            text-[12px] bg-[#fff] self-stretch rounded-[3px] overflow-hidden flex flex-row items-center justify-center py-[8px] px-[10px] text-black
                            ${!isValidName ? 'border-red-500' : 'border-[#efefef]'}`}
                  value={customerName}
                  onChange={handleNameChange}
                />
              </div>
              <div className="flex-1 flex flex-col items-start justify-start gap-[4px] font-sans text-sm">
                <div className="self-stretch relative leading-[18px] font-sans text-black">
                  Customer Phone
                </div>
                <input
                  className={`font-sans border-[1px] border-solid [outline:none] 
                            text-[12px] bg-[#fff] self-stretch rounded-[3px] overflow-hidden flex flex-row items-center justify-start py-[8px] px-[10px] text-black
                            ${!isValidPhone ? 'border-red-500' : 'border-[#efefef]'}`}
                  value={customerPhone}
                  onChange={handlePhoneChange}
                  maxLength={10}
                />
              </div>
            </div>
            
            {/* Location Inputs */}
            <div className="self-stretch flex flex-col items-start justify-start gap-[1px] mb-4 font-sans text-sm">
              <LocationInput 
                label="Pick-Up Location" 
                onLocationSelect={setPickupLocation}
                prefillData={pickupLocation}
                disabled={true}
              />
            </div>
            <div className="self-stretch flex flex-col items-start justify-start gap-[1px] mb-4 font-sans text-sm">
              <LocationInput 
                label="Drop-Off Location" 
                onLocationSelect={setDropoffLocation}
                prefillData={dropoffLocation}
              />
            </div>

            {/* Add price display before status dropdowns */}
            <div className="self-stretch flex flex-col gap-2 mb-4 bg-[#f9fafb] p-3 rounded-lg font-sans text-sm">
              <div className="flex justify-between items-center">
                <span className="font-sans text-black text-sm">Order Price:</span>
                <span className="font-sans font-medium">GH₵{orderPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-sans text-black text-sm">Delivery Price:</span>
                <span className="font-sans font-medium">GH₵{deliveryPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="font-sans text-black text-sm">Total Price:</span>
                <span className="font-sans font-medium text-[#fd683e]">GH₵{totalPrice.toFixed(2)}</span>
              </div>
            </div>

            {/* Order Status Dropdown */}
            <div className="self-stretch flex flex-col items-start justify-start gap-[4px] mb-4 font-sans text-sm">
              <div className="self-stretch relative leading-[20px] font-sans text-black">
                Order Status
              </div>
              <select
                className="font-sans border-[#efefef] border-[1px] border-solid [outline:none] 
                          text-[12px] bg-[#fff] self-stretch rounded-[3px] overflow-hidden flex flex-row items-center justify-start py-[8px] px-[10px] text-black"
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value)}
              >
                <option value="ReadyForPickup">Ready For Pickup</option>
                <option value="Assigned">Assigned</option>
                <option value="Pickup">Pickup</option>
                <option value="OnTheWay">On The Way</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
                <option value="DeliveryFailed">Delivery Failed</option>
              </select>
            </div>

            {/* Transaction Status Dropdown */}
            <div className="self-stretch flex flex-col items-start justify-start gap-[4px] mb-4 font-sans text-sm">
              <div className="self-stretch relative leading-[20px] font-sans text-black">
                Transaction Status
              </div>
              <select
                className="font-sans border-[#efefef] border-[1px] border-solid [outline:none] 
                          text-[12px] bg-[#fff] self-stretch rounded-[3px] overflow-hidden flex flex-row items-center justify-start py-[8px] px-[10px] text-black"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">
                Additional Comment
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-[465px] h-[40px] p-2 border border-gray-300 rounded-md text-sm font-sans"
                rows={3}
                placeholder="Add any additional comments..."
              />
            </div>
          </>
        );

      // ... Continue with cases 2 and 3 similar to PlaceOrder but with pre-populated data
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg w-[500px] relative flex flex-col max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 bg-transparent"
        >
          <IoIosCloseCircleOutline size={24} />
        </button>

        {renderStepContent()}

        {/* Show estimated distance only for steps 1 and 2 */}
        {currentStep !== 3 && distance && (
          <div className="mt-4 bg-[#f9fafb] rounded-lg p-3">
            <div className="text-xs !font-sans">
              <div className="font-medium mb-1 !font-sans">Estimated Distance: {distance} km</div>
              <div className="text-gray-500 !font-sans">
                From {pickupLocation?.address} to {dropoffLocation?.address}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <button
          onClick={handleSaveChanges}
          disabled={!isFormValid}
          className={`self-stretch rounded-[4px] border-[1px] border-solid overflow-hidden 
                   flex flex-row items-center justify-center py-[15px] px-[60px] 
                   cursor-pointer text-[12px] mt-4
                   ${isFormValid 
                     ? 'bg-[#fd683e] border-[#f5fcf8] text-[#fff] hover:opacity-90' 
                     : 'bg-gray-300 border-gray-300 text-gray-500 cursor-not-allowed'}`}
        >
          <div className="relative leading-[16px] font-sans text-[#fff]">
            {isLoading ? 'Saving...' : 'Save Changes'}
          </div>
        </button>
      </div>
    </div>
  );
};

export default EditOrder; 