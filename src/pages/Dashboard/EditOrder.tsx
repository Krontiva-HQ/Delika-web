import React, { useState, useEffect, FunctionComponent } from "react";
import { IoIosCloseCircleOutline, IoIosArrowBack } from "react-icons/io";
import { RiDeleteBinLine } from "react-icons/ri";
import LocationInput from '../../components/LocationInput';
import { LocationData } from "../../types/location";
import { calculateDeliveryPriceAPI } from '../../services/api';
import { usePlaceOrderItems } from '../../hooks/usePlaceOrderItems';
import { useNotifications } from '../../context/NotificationContext';
import { Order } from '../../types/order';
import { useEditOrder } from '../../hooks/useEditOrder';

interface EditOrderProps {
  order: Order;
  onClose: () => void;
  onOrderEdited: () => void;
  isFromTransactions?: boolean;
}

const EditOrder: FunctionComponent<EditOrderProps> = ({ order, onClose, onOrderEdited, isFromTransactions = false }) => {
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
  const [paymentMethod, setPaymentMethod] = useState(() => {
    if (order.payLater) return 'momo';
    if (order.payNow) return 'cash';
    if (order.payVisaCard) return 'visa';
    return 'cash'; // default
  });
  
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

  // Add state to track modified fields
  const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set());

  // Add state to track whether delivery price has been calculated
  const [hasCalculatedDelivery, setHasCalculatedDelivery] = useState(false);

  // Modify the customer phone input handler
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setCustomerPhone(value);
    setIsValidPhone(value.length === 10);
    setModifiedFields(prev => new Set(Array.from(prev).concat('customerPhoneNumber')));
  };

  // Add name input handler
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setCustomerName(value);
    setIsValidName(value.length > 0);
    setModifiedFields(prev => new Set(Array.from(prev).concat('customerName')));
  };

  // Add handlers for other fields
  const handleOrderStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOrderStatus(e.target.value);
    setModifiedFields(prev => new Set(Array.from(prev).concat('orderStatus')));
  };

  const handlePaymentStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPaymentStatus(e.target.value);
    setModifiedFields(prev => new Set(Array.from(prev).concat('paymentStatus')));
  };

  const handlePaymentMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPaymentMethod(e.target.value);
    setModifiedFields(prev => new Set(Array.from(prev).concat('paymentMethod')));
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
    setModifiedFields(prev => new Set(Array.from(prev).concat('orderComment')));
  };

  // Add validation check
  const isFormValid = order.Walkin 
    ? isValidName && customerName.trim() !== ''  // Only validate name for walk-in orders
    : isValidPhone && isValidName && customerName.trim() !== '' && customerPhone.length === 10;

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

  useEffect(() => {
    if (pickupLocation && dropoffLocation && !hasCalculatedDelivery) {
      setHasCalculatedDelivery(true);
      calculateDeliveryPriceAPI({
        pickup: {
          fromLongitude: pickupLocation.longitude,
          fromLatitude: pickupLocation.latitude
        },
        dropOff: {
          toLongitude: dropoffLocation.longitude,
          toLatitude: dropoffLocation.latitude
        },
        rider: false,
        pedestrian: false
      })
        .then(result => {
          setDeliveryPrice(result.riderFee);
          setDistance(result.distance);
          setTotalPrice(orderPrice + result.riderFee);
        })
        .catch(() => {
          setDeliveryPrice(0);
          setDistance(null);
          setTotalPrice(orderPrice);
        });
    }
  }, [pickupLocation, dropoffLocation, orderPrice]);

  // Reset hasCalculatedDelivery when pickup changes
  useEffect(() => {
    setHasCalculatedDelivery(false);
  }, [pickupLocation]);

  useEffect(() => {
    if (order) {
      setPaymentStatus(order.paymentStatus || 'Pending');
    }
  }, [order]);

  const handleSaveChanges = async () => {
    // Start with all existing data from the order
    const params: any = {
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhoneNumber: order.customerPhoneNumber,
      deliveryDistance: order.deliveryDistance,
      orderStatus: order.orderStatus,
      deliveryPrice: order.deliveryPrice,
      totalPrice: order.totalPrice,
      paymentStatus: order.paymentStatus,
      dropOffCity: order.dropoffName,
      orderComment: order.orderComment || '',
      payNow: order.payNow,
      payLater: order.payLater,
      payVisaCard: order.payVisaCard,
      // Add array to track which fields were modified
      modifiedFields: Array.from(modifiedFields)
    };

    // Update only the modified fields with new values
    if (modifiedFields.has('customerName')) {
      params.customerName = customerName;
    }
    if (modifiedFields.has('customerPhoneNumber')) {
      params.customerPhoneNumber = customerPhone;
    }
    if (modifiedFields.has('orderStatus')) {
      params.orderStatus = orderStatus;
    }
    if (modifiedFields.has('paymentStatus')) {
      params.paymentStatus = paymentStatus;
    }
    if (modifiedFields.has('orderComment')) {
      params.orderComment = comment;
    }
    if (modifiedFields.has('paymentMethod')) {
      params.payNow = paymentMethod === 'cash';
      params.payLater = paymentMethod === 'momo';
      params.payVisaCard = paymentMethod === 'visa';
    }

    // Handle delivery-related fields for non-walkin orders
    if (!order.Walkin) {
      if (modifiedFields.has('deliveryDistance') || modifiedFields.has('deliveryPrice')) {
        params.deliveryDistance = distance?.toString() || order.deliveryDistance;
        params.deliveryPrice = deliveryPrice.toString();
      }
      if (modifiedFields.has('totalPrice')) {
        params.totalPrice = totalPrice.toString();
      }
      if (modifiedFields.has('dropOffCity')) {
        params.dropOffCity = dropoffLocation.name;
      }
    } else {
      // For walk-in orders
      params.deliveryPrice = '0';
      params.totalPrice = orderPrice.toString();
    }

    try {
      await editOrder(params);
      onOrderEdited();
      
      addNotification({
        type: 'order_edited',
        message: `Order **#${order.orderNumber}** has been successfully edited.`,
      });
    } catch (err) {
      addNotification({
        type: 'order_status',
        message: `Failed to edit Order #${order.orderNumber}. Please try again.`,
      });
    }
  };

  const renderWalkinContent = () => (
    <>
      {/* Customer Name Section */}
      <div className="self-stretch flex flex-row items-start justify-center flex-wrap content-start gap-[15px] mb-4 font-sans text-sm">
        <div className="flex-1 flex flex-col items-start justify-start gap-[4px]">
          <div className="self-stretch leading-[18px] font-sans text-black">
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
      </div>

      {/* Order Summary Section */}
      <div className="self-stretch flex flex-col gap-2 mb-4 bg-[#f9fafb] p-3 rounded-lg font-sans text-sm">
        <div className="flex justify-between items-center">
          <span className="font-sans text-black text-sm">Order Price:</span>
          <span className="font-sans font-medium">GH₵{orderPrice.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center border-t pt-2">
          <span className="font-sans text-black text-sm">Total Price:</span>
          <span className="font-sans font-medium text-[#fd683e]">GH₵{totalPrice.toFixed(2)}</span>
        </div>
      </div>

      {/* Products List */}
      <div className="mb-4">
        <div className="font-sans text-sm font-medium mb-2">Ordered Items:</div>
        <div className="bg-[#f9fafb] p-3 rounded-lg">
          {order.products.map((product, index) => (
            <div key={index} className="flex justify-between items-center mb-2 last:mb-0">
              <span className="font-sans text-sm">{product.name} x {product.quantity}</span>
              <span className="font-sans text-sm">GH₵{parseFloat(product.price).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Order Status Dropdown */}
      <div className="self-stretch flex flex-col items-start justify-start gap-[4px] mb-4">
        <div className="self-stretch relative leading-[20px] font-sans text-black">
          Order Status
        </div>
        <select
          className="font-sans border-[#efefef] border-[1px] border-solid [outline:none] 
                    text-[12px] bg-[#fff] self-stretch rounded-[3px] overflow-hidden flex flex-row items-center justify-start py-[8px] px-[10px] text-black"
          value={orderStatus}
          onChange={handleOrderStatusChange}
        >
          {isFromTransactions ? (
            order.Walkin ? (
              <>
                <option value="Preparing">Preparing</option>
                <option value="Prepared">Prepared</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </>
            ) : (
              <>
                <option value="Preparing">Preparing</option>
                <option value="Prepared">Prepared</option>
                <option value="ReadyForPickup">Ready For Pickup</option>
                <option value="Assigned">Assigned</option>
                <option value="Pickup">Pickup</option>
                <option value="OnTheWay">On The Way</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
                <option value="DeliveryFailed">Delivery Failed</option>
              </>
            )
          ) : (
            order.Walkin ? (
              <>
                <option value="Preparing">Preparing</option>
                <option value="Prepared">Prepared</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </>
            ) : (
              <>
                <option value="Preparing">Preparing</option>
                <option value="Prepared">Prepared</option>
                <option value="ReadyForPickup">Ready For Pickup</option>
                <option value="Assigned">Assigned</option>
                <option value="Pickup">Pickup</option>
                <option value="OnTheWay">On The Way</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
                <option value="DeliveryFailed">Delivery Failed</option>
              </>
            )
          )}
        </select>
      </div>

      {/* Transaction Status Dropdown */}
      <div className="self-stretch flex flex-col items-start justify-start gap-[4px] mb-4">
        <div className="self-stretch relative leading-[20px] font-sans text-black">
          Transaction Status
        </div>
        <select
          className="font-sans border-[#efefef] border-[1px] border-solid [outline:none] 
                    text-[12px] bg-[#fff] self-stretch rounded-[3px] overflow-hidden flex flex-row items-center justify-start py-[8px] px-[10px] text-black"
          value={paymentStatus}
          onChange={handlePaymentStatusChange}
        >
          <option value="Pending">Pending</option>
          <option value="Paid">Paid</option>
        </select>
      </div>

      {/* Payment Method Dropdown */}
      <div className="self-stretch flex flex-col items-start justify-start gap-[4px] mb-4">
        <div className="self-stretch relative leading-[20px] font-sans text-black">
          Payment Method
        </div>
        <select
          className="font-sans border-[#efefef] border-[1px] border-solid [outline:none] 
                    text-[12px] bg-[#fff] self-stretch rounded-[3px] overflow-hidden flex flex-row items-center justify-start py-[8px] px-[10px] text-black"
          value={paymentMethod}
          onChange={handlePaymentMethodChange}
        >
          <option value="cash">Cash</option>
          <option value="momo">MoMo</option>
          <option value="visa">Visa Card</option>
        </select>
      </div>
    </>
  );

  const renderRegularContent = () => (
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
      <div className="self-stretch flex flex-col items-start justify-start gap-[4px] mb-4">
        <div className="self-stretch relative leading-[20px] font-sans text-black">
          Order Status
        </div>
        <select
          className="font-sans border-[#efefef] border-[1px] border-solid [outline:none] 
                    text-[12px] bg-[#fff] self-stretch rounded-[3px] overflow-hidden flex flex-row items-center justify-start py-[8px] px-[10px] text-black"
          value={orderStatus}
          onChange={handleOrderStatusChange}
        >
          {isFromTransactions ? (
            order.Walkin ? (
              <>
                <option value="Preparing">Preparing</option>
                <option value="Prepared">Prepared</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </>
            ) : (
              <>
                <option value="Preparing">Preparing</option>
                <option value="Prepared">Prepared</option>
                <option value="ReadyForPickup">Ready For Pickup</option>
                <option value="Assigned">Assigned</option>
                <option value="Pickup">Pickup</option>
                <option value="OnTheWay">On The Way</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
                <option value="DeliveryFailed">Delivery Failed</option>
              </>
            )
          ) : (
            order.Walkin ? (
              <>
                <option value="Preparing">Preparing</option>
                <option value="Prepared">Prepared</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </>
            ) : (
              <>
                <option value="Preparing">Preparing</option>
                <option value="Prepared">Prepared</option>
                <option value="ReadyForPickup">Ready For Pickup</option>
                <option value="Assigned">Assigned</option>
                <option value="Pickup">Pickup</option>
                <option value="OnTheWay">On The Way</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
                <option value="DeliveryFailed">Delivery Failed</option>
              </>
            )
          )}
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
          onChange={handlePaymentStatusChange}
        >
          <option value="Pending">Pending</option>
          <option value="Paid">Paid</option>
        </select>
      </div>

      {/* Payment Method Dropdown */}
      <div className="self-stretch flex flex-col items-start justify-start gap-[4px] mb-4 font-sans text-sm">
        <div className="self-stretch relative leading-[20px] font-sans text-black">
          Payment Method
        </div>
        <select
          className="font-sans border-[#efefef] border-[1px] border-solid [outline:none] 
                    text-[12px] bg-[#fff] self-stretch rounded-[3px] overflow-hidden flex flex-row items-center justify-start py-[8px] px-[10px] text-black"
          value={paymentMethod}
          onChange={handlePaymentMethodChange}
        >
          <option value="cash">Cash</option>
          <option value="momo">MoMo</option>
          <option value="visa">Visa Card</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1 font-sans">
          Additional Comment
        </label>
        <textarea
          value={comment}
          onChange={handleCommentChange}
          className="w-[465px] h-[40px] p-2 border border-gray-300 rounded-md text-sm font-sans"
          rows={3}
          placeholder="Add any additional comments..."
        />
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg w-[500px] relative flex flex-col max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 bg-transparent"
        >
          <IoIosCloseCircleOutline size={24} />
        </button>

        {order.Walkin ? renderWalkinContent() : renderRegularContent()}

        
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
