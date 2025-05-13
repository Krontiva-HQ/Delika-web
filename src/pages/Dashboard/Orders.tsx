import { FunctionComponent, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { IoMdAdd, IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { SlOptionsVertical } from "react-icons/sl";
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Popover } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import PlaceOrder from './PlaceOrder';
import { api, API_ENDPOINTS } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import OrderDetails from './OrderDetails';
import useOrderDetails from '../../hooks/useOrderDetails';
import { CiEdit } from "react-icons/ci";
import EditOrder from '../Dashboard/EditOrder';
import { useBranches } from '../../hooks/useBranches';
import { useUserProfile } from '../../hooks/useUserProfile';
import BranchFilter from '../../components/BranchFilter';
import { useNotifications } from '../../context/NotificationContext';
import { MdOutlineRestaurant } from "react-icons/md";
import { IoInformationCircleOutline } from "react-icons/io5";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { useTranslation } from 'react-i18next';
import { formatDate, translateOrderStatus, translateKitchenStatus } from '../../i18n/i18n';
import i18n from '../../i18n/i18n';
import 'dayjs/locale/es';
import 'dayjs/locale/fr';

interface Order {
  id: string;
  customerName: string;
  customerPhoneNumber: string;
  orderNumber: number;
  deliveryDistance: string;
  orderPrice: string;
  trackingUrl: string;
  courierName: string;
  courierPhoneNumber: string;
  orderStatus: string;
  totalPrice: string;
  orderDate: string;
  deliveryPrice: string;
  dropOff: {
    toLatitude: string;
    toLongitude: string;
    toAddress: string;
  }[];
  pickup: {
    fromLatitude: string;
    fromLongitude: string;
    fromAddress: string;
  }[];
  products: any[];
  customerImage?: string;
  pickupName: string;
  dropoffName: string;
  status: string;
  transactionStatus: string;
  paymentStatus: string;
  orderComment?: string;
  orderReceivedTime: string;
  Walkin?: boolean;
  payLater: boolean;
  payNow: boolean;
  payVisaCard: boolean;
  kitchenStatus: string;
  orderAccepted: boolean;
  orderChannel: string;
}

// Add interface for API request params
interface OrderFilterParams {
  restaurantId: string | null;
  branchId: string | null;
  date: string;
}

interface PlaceOrderProps {
  onClose: () => void;
  onOrderPlaced: () => void;
  branchId: string;
}

// Add this helper function before the Orders component
const formatOrderStatus = (status: string): string => {
  if (!status) return translateOrderStatus('');
  return translateOrderStatus(status);
};

interface OrdersProps {
  searchQuery: string;
  onOrderDetailsView: (viewing: boolean) => void;
}

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (orderId: string) => void;
  onDecline: (orderId: string) => void;
  newOrders: Order[];
}

const NewOrderModal: React.FC<NewOrderModalProps> = ({ isOpen, onClose, onAccept, onDecline, newOrders }) => {
  const { t } = useTranslation();
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 font-sans">
      <div className="bg-white dark:bg-black rounded-lg p-6 w-full max-w-md mx-4 sm:mx-0 font-sans relative">
        <button
          onClick={onClose}
          className="absolute top-2 sm:top-4 right-2 sm:right-4 text-gray-500 hover:text-gray-700 bg-transparent z-50"
        >
          <IoIosCloseCircleOutline className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>
        
        <h2 className="text-lg sm:text-xl font-semibold mb-4 text-black dark:text-white">
          {t('orders.newOrderReceived', {count: newOrders.length})}
        </h2>
        
        <div className="max-h-[70vh] overflow-y-auto mb-4 font-sans">
          {newOrders.map((order) => (
            <div key={order.id} className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg font-sans">
              <div className="text-sm font-medium text-black dark:text-white font-sans">
                {t('orders.orderNumber')} #{order.orderNumber}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-sans">
                {t('orders.customer')}: {order.customerName}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-sans">
                {t('orders.amount')}: GH₵{Number(order.orderPrice).toFixed(2)}
              </div>
              
              {/* Products Section */}
              <div className="mt-2 border-t border-gray-200 dark:border-gray-700 pt-2">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 font-sans">
                  {t('orders.products')}:
                </div>
                {order.products.map((product, index) => (
                  <div 
                    key={`${order.id}-${index}`} 
                    className="flex justify-between items-start py-1 text-xs font-sans"
                  >
                    <div className="flex-1">
                      <span className="text-black dark:text-white font-medium font-sans">
                        {product.name}
                      </span>
                      <div className="text-gray-500 dark:text-gray-400 text-[10px] font-sans">
                        GH₵{Number(product.price).toFixed(2)} × {product.quantity}
                      </div>
                    </div>
                    <div className="text-black dark:text-white font-medium ml-2 font-sans">
                      GH₵{(Number(product.price) * Number(product.quantity)).toFixed(2)}
                    </div>
                  </div>
                ))}
                <div className="mt-1 pt-1 border-t border-gray-200 dark:border-gray-700 flex justify-between text-xs font-medium font-sans">
                  <span className="text-gray-700 dark:text-gray-300 font-sans">{t('orders.deliveryFee')}:</span>
                  <span className="text-black dark:text-white font-sans">GH₵{Number(order.deliveryPrice).toFixed(2)}</span>
                </div>
                <div className="mt-1 pt-1 border-t border-gray-200 dark:border-gray-700 flex justify-between text-xs font-medium font-sans">
                  <span className="text-gray-700 dark:text-gray-300 font-sans">{t('orders.total')}:</span>
                  <span className="text-black dark:text-white font-sans">GH₵{Number(order.totalPrice).toFixed(2)}</span>
                </div>
              </div>

              {/* Order Type Badge */}
              <div className="mt-2 flex items-center gap-2">
                {order.Walkin && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {t('orders.walkIn')}
                  </span>
                )}
                {order.payNow && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {t('orders.paid')}
                  </span>
                )}
              </div>

              {/* Individual Accept/Decline buttons for each order */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => onAccept(order.id)}
                  className="flex-1 px-3 py-1.5 bg-[#fe5b18] text-white rounded-md text-xs font-medium hover:bg-[#e54d0e] transition-colors"
                >
                  {t('orders.accept')}
                </button>
                <button
                  onClick={() => onDecline(order.id)}
                  className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {t('orders.decline')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Orders: FunctionComponent<OrdersProps> = ({ searchQuery, onOrderDetailsView }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const [showPlaceOrder, setShowPlaceOrder] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const navigate = useNavigate();

  const { orderDetails, isLoading: isOrderDetailsLoading, error } = useOrderDetails(selectedOrderId);

  // Add a refreshTrigger state
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Add new state for edit mode
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Separate state for edit modal
  const [showEditOrder, setShowEditOrder] = useState(false);

  // Add userProfile hook
  const { userProfile } = useUserProfile();
  
  // Replace existing branches state with useBranches hook
  const { branches, isLoading: branchesLoading } = useBranches(userProfile?.restaurantId ?? null);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => {
    return localStorage.getItem('selectedBranchId') || '';
  });

  // Add pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  const { addNotification } = useNotifications();

  // Add these new states after the existing states
  const [newOrders, setNewOrders] = useState<Order[]>([]);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [lastOrderIds, setLastOrderIds] = useState<Set<string>>(new Set());

  // Add new state for processing menu
  const [processingMenuAnchor, setProcessingMenuAnchor] = useState<{ [key: string]: HTMLElement | null }>({});

  // Add after the lastOrderIds state
  const [showFloatingPanel, setShowFloatingPanel] = useState(false);
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const floatingButtonRef = useRef<HTMLDivElement>(null);

  // When the modal is closed but there are still newOrders, show the floating button
  useEffect(() => {
    if (!showNewOrderModal && newOrders.length > 0) {
      setShowFloatingButton(true);
    } else {
      setShowFloatingButton(false);
      setShowFloatingPanel(false);
    }
  }, [showNewOrderModal, newOrders.length]);

  // Filter only CustomerApp orders that are not accepted yet
  const pendingCustomerAppOrders = newOrders.filter(order => order.orderChannel === 'customerApp');

  // Floating panel for pending orders
  const FloatingPendingOrdersPanel = () => (
    <div className="fixed bottom-20 right-6 z-50 bg-white shadow-lg rounded-lg p-4 w-80 max-h-[60vh] overflow-y-auto border border-orange-200 animate-fade-in">
      <div className="flex justify-between items-center mb-2 font-sans">
        <span className="font-bold text-orange-600 font-sans">Pending Orders</span>
        <button onClick={() => setShowFloatingPanel(false)} className="text-gray-400 hover:text-gray-700">✕</button>
      </div>
      {pendingCustomerAppOrders.length === 0 ? (
        <div className="text-gray-500 text-sm font-sans">No pending orders.</div>
      ) : (
        pendingCustomerAppOrders.map(order => (
          <div key={order.id} className="mb-4 p-2 bg-orange-50 rounded">
            <div className="font-semibold text-sm font-sans">Order #{order.orderNumber}</div>
            <div className="text-xs text-gray-600 font-sans">{order.customerName} - GH₵{Number(order.orderPrice).toFixed(2)}</div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleAcceptNewOrders(order.id)}
                className="flex-1 px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 font-sans"
              >Accept</button>
              <button
                onClick={() => handleDeclineNewOrders(order.id)}
                className="flex-1 px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 font-sans"
              >Decline</button>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleKitchenStatusUpdate(order.id, 'orderReceived', order)}
                className="flex-1 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 font-sans"
              >Order Received</button>
              <button
                onClick={() => handleKitchenStatusUpdate(order.id, 'preparing', order)}
                className="flex-1 px-2 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600 font-sans"
              >Preparing</button>
              <button
                onClick={() => handleKitchenStatusUpdate(order.id, 'prepared', order)}
                className="flex-1 px-2 py-1 bg-emerald-500 text-white rounded text-xs hover:bg-emerald-600 font-sans"
              >Prepared</button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const handleDateClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDateChange = (newDate: Dayjs | null) => {
    setSelectedDate(newDate);
    handleClose();
  };

  const open = Boolean(anchorEl);

  // Update the fetchOrders function to handle Store Clerk and Manager roles
  const fetchOrders = useCallback(async (branchId: string, date: string) => {
    if (!branchId || !date) return;
    
    setIsLoading(true);
    setOrders([]); // Clear existing data
    
    try {
      let params = new URLSearchParams();

      if (userProfile?.role === 'Store Clerk' || userProfile?.role === 'Manager') {
        params = new URLSearchParams({
          restaurantId: userProfile?.restaurantId || '',
          branchId: userProfile?.branchId || '',
          date: date
        });
      } else if (userProfile?.role === 'Admin') {
        params = new URLSearchParams({
          restaurantId: userProfile?.restaurantId || '',
          branchId: branchId,
          date: date
        });
      }

      const response = await api.get(`/filter/orders/by/date?${params.toString()}`);
      const sortedOrders = response.data.sort((a: Order, b: Order) => {
        return new Date(b.orderReceivedTime).getTime() - new Date(a.orderReceivedTime).getTime();
      });
      setOrders(sortedOrders);
      
      // Initialize lastOrderIds with current orders
      setLastOrderIds(new Set(sortedOrders.map((order: Order) => order.id)));
    } catch (error) {
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.restaurantId, userProfile?.role, userProfile?.branchId]);

  // Update useEffect to handle branch selection based on role
  useEffect(() => {
    if (userProfile?.role === 'Admin' && branches.length > 0 && !selectedBranchId) {
      // Only Admin can select different branches
      const firstBranchId = branches[0].id;
      localStorage.setItem('selectedBranchId', firstBranchId);
      setSelectedBranchId(firstBranchId);
    } else if ((userProfile?.role === 'Store Clerk' || userProfile?.role === 'Manager') && userProfile?.branchId) {
      // For Store Clerk and Manager, always use their assigned branchId
      setSelectedBranchId(userProfile.branchId);
    }
  }, [branches, userProfile?.role, userProfile?.branchId]);

  // Fetch when date changes
  useEffect(() => {
    if (selectedDate && selectedBranchId) {
      fetchOrders(selectedBranchId, selectedDate.format('YYYY-MM-DD'));
    }
  }, [selectedDate, selectedBranchId, fetchOrders]);

  const handleOrderPlaced = useCallback(() => {
    if (selectedDate && selectedBranchId) {
      fetchOrders(selectedBranchId, selectedDate.format('YYYY-MM-DD'));
      setShowPlaceOrder(false); // Close the modal
    }
  }, [selectedDate, selectedBranchId, fetchOrders]);

  // Add this effect to refresh orders periodically after a new order
  useEffect(() => {
    if (!showPlaceOrder) { // Only trigger when modal closes
      // Immediate refresh
      if (selectedDate && selectedBranchId) {
        fetchOrders(selectedBranchId, selectedDate.format('YYYY-MM-DD'));
      }
    }
  }, [showPlaceOrder, selectedDate, selectedBranchId, fetchOrders]);

  const handleOrderEdited = useCallback(() => {
    if (selectedDate && selectedBranchId) {
      fetchOrders(selectedBranchId, selectedDate.format('YYYY-MM-DD'));
      setShowEditOrder(false);  // Close the modal
      setEditingOrder(null);    // Clear the editing order
    }
  }, [selectedDate, selectedBranchId, fetchOrders]);

  // Update the filteredOrders useMemo to include the new channel filtering
  const paginatedOrders = useMemo(() => {
    const filtered = orders
      .sort((a, b) => {
        return new Date(b.orderReceivedTime).getTime() - new Date(a.orderReceivedTime).getTime();
      })
      .filter(order => {
        const matchesSearch = searchQuery
          ? order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.orderNumber.toString().includes(searchQuery)
          : true;

        const matchesTab = activeTab === 'all' 
          ? true 
          : activeTab === 'customerApp'
          ? order.orderChannel === 'customerApp'
          : activeTab === 'restaurantPortal'
          ? order.orderChannel === 'restaurantPortal'
          : true;

        return matchesSearch && matchesTab;
      });

    // Calculate pagination
    const indexOfLastOrder = currentPage * ordersPerPage;
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
    
    return {
      orders: filtered.slice(indexOfFirstOrder, indexOfLastOrder),
      totalOrders: filtered.length,
      totalPages: Math.ceil(filtered.length / ordersPerPage)
    };
  }, [orders, searchQuery, activeTab, currentPage]);

  // Add pagination handlers
  const handleNextPage = () => {
    if (currentPage < paginatedOrders.totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, selectedDate]);

  // Update the New Order button click handler
  const handleNewOrderClick = () => {
    setShowPlaceOrder(true);
  };

  const handleOrderClick = (orderNumber: number) => {
    setSelectedOrderId(orderNumber.toString());
  };

  const handleBackToOrders = () => {
    setSelectedOrderId(null);
  };

  // Add this status color mapping
  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'all orders':
        return 'bg-gray-100 text-gray-800';
      case 'ready for pickup':
        return 'bg-blue-100 text-blue-800';
      case 'assigned':
        return 'bg-purple-100 text-purple-800';
      case 'pickup':
        return 'bg-yellow-100 text-yellow-800';
      case 'on the way':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'delivery failed':
        return 'bg-orange-100 text-orange-800';
      case 'preparing':
        return 'bg-amber-100 text-amber-800';
      case 'prepared':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Add handler for edit click
  const handleEditClick = (e: React.MouseEvent, order: Order) => {
    e.stopPropagation();
    setEditingOrder(order);
    setShowEditOrder(true);
  };

  useEffect(() => {
    // Update parent component when selectedOrderId changes
    onOrderDetailsView(!!selectedOrderId);
  }, [selectedOrderId, onOrderDetailsView]);

  const handleBranchSelect = useCallback((branchId: string) => {
    localStorage.setItem('selectedBranchId', branchId);
    setSelectedBranchId(branchId);
    
    if (selectedDate) {
      fetchOrders(branchId, selectedDate.format('YYYY-MM-DD'));
    }
  }, [selectedDate, fetchOrders]);

  // Update the checkForNewOrders function dependency array and ensure proper closure
  const checkForNewOrders = useCallback(async () => {
    if (!selectedDate || !selectedBranchId) return;

    try {
      let params = new URLSearchParams();
      
      if (userProfile?.role === 'Store Clerk' || userProfile?.role === 'Manager') {
        params = new URLSearchParams({
          restaurantId: userProfile?.restaurantId || '',
          branchId: userProfile?.branchId || '',
          date: selectedDate.format('YYYY-MM-DD')
        });
      } else if (userProfile?.role === 'Admin') {
        params = new URLSearchParams({
          restaurantId: userProfile?.restaurantId || '',
          branchId: selectedBranchId,
          date: selectedDate.format('YYYY-MM-DD')
        });
      }

      const response = await api.get(`/filter/orders/by/date?${params.toString()}`);
      const latestOrders = response.data.sort((a: Order, b: Order) => 
        new Date(b.orderReceivedTime).getTime() - new Date(a.orderReceivedTime).getTime()
      );

      // Check for new orders with payment status filtering
      const newIncomingOrders = latestOrders.filter((order: Order) => {
        // Skip if order ID already exists in lastOrderIds or already in newOrders
        if (lastOrderIds.has(order.id)) return false;
        if (newOrders.some(o => o.id === order.id)) return false;
        return true;
      });

      if (newIncomingOrders.length > 0) {
        setNewOrders(prev => [...prev, ...newIncomingOrders]);
        setShowNewOrderModal(true);
        const audio = new Audio('/orderRinging.mp3');
        audio.play().catch(() => {});
      }

      // Update lastOrderIds with all current order IDs
      setLastOrderIds(new Set(latestOrders.map((order: Order) => order.id)));

    } catch (error) {
      // Silent fail for background polling
    }
  }, [selectedDate, selectedBranchId, userProfile, lastOrderIds, newOrders]);

  // Update the polling effect
  useEffect(() => {
    let lastPollTime = Date.now();
    
    const shouldPoll = () => {
      const now = Date.now();
      const timeSinceLastPoll = now - lastPollTime;
      if (timeSinceLastPoll >= 10000) { // 10 seconds
        lastPollTime = now;
        return true;
      }
      return false;
    };

    const poll = async () => {
      if (shouldPoll()) {
        await checkForNewOrders();
      }
    };

    const pollInterval = setInterval(poll, 10000); // 10 seconds

    return () => {
      clearInterval(pollInterval);
    };
  }, [checkForNewOrders]);

  // Update the kitchen status handler to check orderChannel
  const handleKitchenStatusUpdate = async (orderId: string, currentStatus: string, order: Order) => {
    // Return early if order is from restaurant portal
    if (order.orderChannel === 'restaurantPortal') {
      addNotification({
        type: 'order_status',
        message: 'Kitchen status cannot be updated for restaurant portal orders'
      });
      return;
    }

    let newStatus = currentStatus;
    
    // Determine the next status
    if (currentStatus === 'orderReceived') {
      newStatus = 'preparing';
    } else if (currentStatus === 'preparing') {
      newStatus = 'prepared';
    } else if (currentStatus === 'prepared') {
      // If already prepared, do nothing
      console.log('Already in prepared state, no update needed');
      return;
    }

    console.log('New Status:', newStatus);
    console.log('Order Data:', order);

    try {
      await api.patch('/edit/kitchen/status', {
        orderNumber: order.orderNumber,
        kitchenStatus: newStatus
      });
      
      // Refresh orders after status update
      if (selectedDate && selectedBranchId) {
        fetchOrders(selectedBranchId, selectedDate.format('YYYY-MM-DD'));
      }
      
      addNotification({
        type: 'order_status',
        message: `Kitchen status updated to ${newStatus}`
      });
    } catch (error) {
      console.error('API Error:', error);
      addNotification({
        type: 'order_status',
        message: 'Failed to update kitchen status'
      });
    }
  };

  // Update the accept/decline handlers
  const handleAcceptNewOrders = useCallback(async (orderId: string) => {
    const acceptedOrder = newOrders.find(order => order.id === orderId);
    if (acceptedOrder) {
      try {
        // Use the ACCEPT_DECLINE endpoint
        await api.patch('/accept/decline/orders', {
          orderNumber: acceptedOrder.orderNumber,
          orderAccepted: true
        });

        setOrders(prev => [acceptedOrder, ...prev]);
        
        addNotification({
          type: 'order_created',
          message: `Accepted order #${acceptedOrder.orderNumber}`
        });
        
        setNewOrders(prev => prev.filter(order => order.id !== orderId));
        
        if (newOrders.length === 1) {
          setShowNewOrderModal(false);
        }

        if (selectedDate && selectedBranchId) {
          fetchOrders(selectedBranchId, selectedDate.format('YYYY-MM-DD'));
        }
      } catch (error) {
        console.error('Failed to accept order:', error);
        addNotification({
          type: 'order_status',
          message: 'Failed to accept order. Please try again.'
        });
      }
    }
  }, [newOrders, addNotification, setOrders, setNewOrders, selectedDate, selectedBranchId, fetchOrders, setShowNewOrderModal]);

  const handleDeclineNewOrders = useCallback(async (orderId: string) => {
    const declinedOrder = newOrders.find(order => order.id === orderId);
    if (declinedOrder) {
      try {
        // Use the ACCEPT_DECLINE endpoint
        await api.patch('/accept/decline/orders', {
          orderNumber: declinedOrder.orderNumber,
          orderAccepted: false
        });

        addNotification({
          type: 'order_created',
          message: `Declined order #${declinedOrder.orderNumber}`
        });
        
        setNewOrders(prev => prev.filter(order => order.id !== orderId));
        
        if (newOrders.length === 1) {
          setShowNewOrderModal(false);
        }

        if (selectedDate && selectedBranchId) {
          fetchOrders(selectedBranchId, selectedDate.format('YYYY-MM-DD'));
        }
      } catch (error) {
        console.error('Failed to decline order:', error);
        addNotification({
          type: 'order_status',
          message: 'Failed to decline order. Please try again.'
        });
      }
    }
  }, [newOrders, addNotification, setNewOrders, selectedDate, selectedBranchId, fetchOrders, setShowNewOrderModal]);

  // Add handler for processing status update
  const handleProcessingStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await api.put(`/orders/${orderId}`, {
        orderStatus: newStatus
      });
      
      // Refresh orders after status update
      if (selectedDate && selectedBranchId) {
        fetchOrders(selectedBranchId, selectedDate.format('YYYY-MM-DD'));
      }
      
      // Show success notification
      addNotification({
        type: 'order_status',
        message: `Order status updated to ${newStatus}`
      });
      
      // Close the menu
      setProcessingMenuAnchor(prev => ({ ...prev, [orderId]: null }));
    } catch (error) {
      addNotification({
        type: 'order_status',
        message: 'Failed to update order status'
      });
    }
  };

  return (
    <div className="h-full w-full bg-white m-0 p-0">
      {/* Floating Button for Pending Orders */}
      {showFloatingButton && (
        <div
          ref={floatingButtonRef}
          className="fixed bottom-6 right-6 z-50 cursor-pointer flex items-center gap-2 bg-[#fe5b18] text-white px-4 py-3 rounded-full shadow-lg border-2 border-white animate-jiggle"
          style={{ animation: 'jiggle 1.2s infinite' }}
          onClick={() => setShowFloatingPanel(true)}
          title="You have pending orders!"
        >
          <span className="font-bold">Pending Orders</span>
          <span className="bg-white text-[#fe5b18] rounded-full px-2 py-0.5 font-bold text-xs">{pendingCustomerAppOrders.length}</span>
          <svg className="w-5 h-5 ml-1 animate-bounce" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </div>
      )}
      {/* Floating Panel */}
      {showFloatingPanel && (
        <FloatingPendingOrdersPanel />
      )}
      {selectedOrderId ? (
        <OrderDetails 
          orderId={selectedOrderId} 
          onBack={handleBackToOrders}
          orderDetails={orderDetails}
          isLoading={isOrderDetailsLoading}
          error={error}
        />
      ) : (
        <div className="p-3 ml-4 mr-4">
          {/* Header Section with Orders title and New Order button */}
          <div className="flex justify-between items-center mb-4">
            <b className="text-[18px] font-sans">
              {t('orders.title')}
            </b>
            <div className="flex items-center gap-2">
              {/* Branch Filter - Only show for Admin */}
              {userProfile?.role === 'Admin' && (
                <BranchFilter 
                  restaurantId={userProfile.restaurantId || null}
                  onBranchSelect={handleBranchSelect}
                  selectedBranchId={selectedBranchId}
                  hideAllBranches={true}
                  className="appearance-none bg-white border border-[rgba(167,161,158,0.1)] rounded-md px-4 py-2 pr-8 text-[14px] font-sans text-[#666] cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-0 focus:border-[rgba(167,161,158,0.1)]"
                />
              )}

              <div
                className="flex items-center gap-2 px-3 py-1 rounded-[4px] bg-[#313131] border-[#737373] border-[1px] border-solid 
                          cursor-pointer text-[12px] font-sans"
                onClick={() => setShowPlaceOrder(true)}
              >
                <IoMdAdd className="w-[16px] h-[16px] text-white" />
                <span className="font-sans text-white">{t('orders.newOrder')}</span>
              </div>
            </div>
          </div>

          {/* Tabs and Calendar Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[#535353] w-full mb-4 gap-4">
            <div className="w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
              <div className="flex gap-4 min-w-max">
                <div 
                  className={`relative text-[12px] leading-[20px] font-sans cursor-pointer border-[1px] border-solid border-[#eaeaea] rounded-[6px] px-1 py-1 whitespace-nowrap
                    ${activeTab === 'all' 
                      ? 'bg-[#fe5b18] text-white border-[#fe5b18]' 
                      : 'text-[#797979]'
                    }`}
                  onClick={() => setActiveTab('all')}
                >
                  {t('orders.tabs.all')}
                </div>
                <div 
                  className={`relative text-[12px] leading-[20px] font-sans cursor-pointer border-[1px] border-solid border-[#eaeaea] rounded-[6px] px-1 py-1 whitespace-nowrap
                    ${activeTab === 'customerApp'
                      ? 'bg-[#fe5b18] text-white border-[#fe5b18]'
                      : 'text-[#929494]'
                    }`}
                  onClick={() => setActiveTab('customerApp')}
                >
                  Customer App
                </div>
                <div 
                  className={`relative text-[12px] leading-[20px] font-sans cursor-pointer border-[1px] border-solid border-[#eaeaea] rounded-[6px] px-1 py-1 whitespace-nowrap
                    ${activeTab === 'restaurantPortal'
                      ? 'bg-[#fe5b18] text-white border-[#fe5b18]'
                      : 'text-[#929494]'
                    }`}
                  onClick={() => setActiveTab('restaurantPortal')}
                >
                  Restaurant Portal
                </div>
              </div>
            </div>

            {/* Calendar Trigger */}
            <div className="flex-shrink-0">
              <div 
                onClick={handleDateClick}
                className="flex items-center gap-2 cursor-pointer"
              >
                <div className="border border-[#eaeaea] border-solid rounded-md px-3 py-1 flex items-center gap-2">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-4 w-4 text-[#666]" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                    />
                  </svg>
                  <span className="text-[12px] font-sans text-[#666]">
                    {selectedDate ? selectedDate.format('DD MMMM YYYY') : '23 January 2024'}
                  </span>
                </div>
              </div>

              {/* Calendar Popover */}
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={i18n.language}>
                <Popover
                  open={open}
                  anchorEl={anchorEl}
                  onClose={handleClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  sx={{
                    '& .MuiPaper-root': {
                      borderRadius: '8px',
                      border: '1px solid rgba(167,161,158,0.1)',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      marginTop: '8px',
                    },
                    '& .MuiPickersDay-root.Mui-selected': {
                      backgroundColor: '#fe5b18',
                      '&:hover': {
                        backgroundColor: '#fe5b18',
                      }
                    },
                    '& .MuiPickersDay-root:hover': {
                      backgroundColor: '#fff3e0',
                    },
                    '& .MuiTypography-root': {
                      fontFamily: 'Inter',
                    },
                  }}
                >
                  <DateCalendar 
                    value={selectedDate}
                    onChange={handleDateChange}
                    sx={{
                      fontFamily: 'Inter',
                      '& .MuiTypography-root': {
                        fontFamily: 'Inter',
                      },
                    }}
                  />
                </Popover>
              </LocalizationProvider>
            </div>
          </div>

          {/* Table Section */}
          <div className="w-full overflow-x-auto">
            <div className="min-w-[900px] border-[1px] border-solid border-[rgba(167,161,158,0.1)] rounded-lg overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-7 bg-[#f9f9f9] p-3 gap-2" style={{ borderBottom: '1px solid #eaeaea', gridTemplateColumns: '80px 1fr 1.2fr 0.8fr 80px 1fr 1fr' }}>
                <div className="text-[12px] leading-[20px] font-sans text-[#666]">{t('orders.orderNumber')}</div>
                <div className="text-[12px] leading-[20px] font-sans text-[#666]">{t('orders.customer')}</div>
                <div className="text-[12px] leading-[20px] font-sans text-[#666]">{t('orders.address')}</div>
                <div className="text-[12px] leading-[20px] font-sans text-[#666]">{t('orders.date')}</div>
                <div className="text-[12px] leading-[20px] font-sans text-[#666]">{t('orders.price')} (GH₵)</div>
                <div className="text-[12px] leading-[20px] font-sans text-[#666]">{t('orders.orderStatus')}</div>
                <div className="text-[12px] leading-[20px] font-sans text-[#666]">{t('orders.kitchenStatus')}</div>
              </div>

              {/* Table Body */}
              {isLoading ? (
                <div className="p-4 text-center text-gray-500 font-sans">{t('common.loading')}</div>
              ) : paginatedOrders.orders.length === 0 ? (
                <div className="p-4 text-center text-gray-500 font-sans">{t('orders.noOrdersFound')}</div>
              ) : (
                <>
                  {/* Map through paginatedOrders.orders instead of filteredOrders */}
                  {paginatedOrders.orders.map((order) => (
                    <div 
                      key={order.id} 
                      style={{ borderBottom: '1px solid #eaeaea', gridTemplateColumns: '80px 1fr 1.2fr 0.8fr 80px 1fr 1fr' }}
                      className="grid grid-cols-7 p-3 gap-2 hover:bg-[#f9f9f9]"
                    >
                      <div className="text-[12px] leading-[20px] font-sans text-[#444] truncate">{order.orderNumber}</div>
                      <div className="flex items-center gap-2 min-w-0">
                        <img 
                          src={order.customerImage || '/default-profile.jpg'} 
                          alt={order.customerName} 
                          className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/default-profile.jpg';
                          }}
                        />
                        <span className="text-[12px] leading-[20px] font-sans text-[#444]">{order.customerName}</span>
                      </div>
                      <div className="text-[12px] leading-[20px] font-sans text-[#666]">
                        {order.dropOff[0]?.toAddress || 'N/A'}
                      </div>
                      <div className="text-[12px] leading-[20px] font-sans text-[#666]">
                        {order.orderDate ? formatDate(order.orderDate, 'DD MMM YYYY') : ''}
                      </div>
                      <div className="text-[12px] leading-[20px] font-sans text-[#444] w-24">
                        {Number(order.orderPrice).toFixed(2)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-[10px] leading-[20px] font-sans ${getStatusStyle(order.orderStatus)}`}>
                          {formatOrderStatus(order.orderStatus)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span 
                          className={`px-2 py-1 rounded-full text-[10px] leading-[20px] font-sans
                            ${order.orderChannel === 'restaurantPortal' 
                              ? 'bg-gray-100 text-gray-500 cursor-not-allowed opacity-60' 
                              : order.kitchenStatus === 'preparing' 
                                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 cursor-pointer'
                                : order.kitchenStatus === 'prepared'
                                  ? 'bg-green-100 text-green-800'
                                  : order.kitchenStatus === 'orderReceived'
                                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer'
                                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer'}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (order.orderChannel !== 'restaurantPortal') {
                              console.log('Kitchen status clicked - Event handler');
                              handleKitchenStatusUpdate(order.id, order.kitchenStatus || '', order);
                            }
                          }}
                          style={{ 
                            cursor: order.orderChannel === 'restaurantPortal' 
                              ? 'not-allowed' 
                              : order.kitchenStatus === 'prepared' 
                                ? 'default' 
                                : 'pointer' 
                          }}
                        >
                          {order.orderChannel === 'restaurantPortal' 
                            ? `${translateKitchenStatus(order.kitchenStatus)} (Portal Order)` 
                            : translateKitchenStatus(order.kitchenStatus)}
                        </span>
                        <div className="flex items-center gap-2">
                          <button 
                            className="p-1 border-[1px] border-solid border-[#eaeaea] rounded-[4px] bg-white hover:bg-gray-50"
                            onClick={() => handleOrderClick(order.orderNumber)}
                          >
                            <IoInformationCircleOutline className="w-[14px] h-[14px] text-[#666]" />
                          </button>
                          <button 
                            className="p-1 border-[1px] border-solid border-[#eaeaea] rounded-[4px] bg-white hover:bg-gray-50"
                            onClick={(e) => handleEditClick(e, order)}
                          >
                            <CiEdit className="w-[14px] h-[14px] text-[#666]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Pagination Controls */}
                  <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-[rgba(167,161,158,0.1)]">
                    <div className="text-[12px] text-gray-500 font-sans">
                      {t('orders.pagination.showing')} {((currentPage - 1) * ordersPerPage) + 1} {t('orders.pagination.to')} {Math.min(currentPage * ordersPerPage, paginatedOrders.totalOrders)} {t('orders.pagination.of')} {paginatedOrders.totalOrders} {t('orders.pagination.orders')}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className={`p-2 rounded-md ${
                          currentPage === 1
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <IoIosArrowBack className="w-4 h-4" />
                      </button>
                      <span className="text-[12px] font-sans">
                        {t('orders.pagination.page')} {currentPage} {t('orders.pagination.of')} {paginatedOrders.totalPages}
                      </span>
                      <button
                        onClick={handleNextPage}
                        disabled={currentPage === paginatedOrders.totalPages}
                        className={`p-2 rounded-md ${
                          currentPage === paginatedOrders.totalPages
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <IoIosArrowForward className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Add the PlaceOrder modal */}
          {showPlaceOrder && (
            <PlaceOrder 
              onClose={() => setShowPlaceOrder(false)} 
              onOrderPlaced={handleOrderPlaced}
              branchId={selectedBranchId || userProfile.branchId}
            />
          )}
          
          {showEditOrder && editingOrder && (
            <EditOrder 
              order={editingOrder}
              onClose={() => {
                setShowEditOrder(false);
                setEditingOrder(null);
              }}
              onOrderEdited={handleOrderEdited}
            />
          )}

          <NewOrderModal
            isOpen={showNewOrderModal}
            onClose={() => setShowNewOrderModal(false)}
            onAccept={handleAcceptNewOrders}
            onDecline={handleDeclineNewOrders}
            newOrders={newOrders}
          />
        </div>
      )}
    </div>
  );
};

export default Orders; 