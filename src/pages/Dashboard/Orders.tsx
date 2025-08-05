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
  orderNumber: string;
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
  Walkin: boolean;
  payLater: boolean;
  payNow: boolean;
  payVisaCard: boolean;
  kitchenStatus: string;
  orderAccepted: "pending" | "accepted" | "declined";
  orderChannel: string;
  orderOTP?: string;
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

  const { addNotification, showGlobalOrderModal } = useNotifications();

  // Add new state for processing menu
  const [processingMenuAnchor, setProcessingMenuAnchor] = useState<{ [key: string]: HTMLElement | null }>({});

  // Add new state for loading specific orders
  const [loadingOrderIds, setLoadingOrderIds] = useState<Set<string>>(new Set());

  // Utility function to manually clear stuck loading states
  const clearAllLoadingStates = useCallback(() => {
    setLoadingOrderIds(new Set());
    addNotification({
      type: 'order_status',
      message: 'Cleared all loading states'
    });
  }, [loadingOrderIds, addNotification]);

  // Add function to window for debugging
  useEffect(() => {
    (window as any).clearOrderLoadingStates = clearAllLoadingStates;
    
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ctrl+Shift+C to clear loading states
      if (event.ctrlKey && event.shiftKey && event.key === 'C') {
        clearAllLoadingStates();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      delete (window as any).clearOrderLoadingStates;
    };
  }, [clearAllLoadingStates]);

  // Add new state for initial loading
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isTableLoading, setIsTableLoading] = useState(false);



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

  // Update the fetchOrders function to handle loading states better
  const fetchOrders = useCallback(async (branchId: string, date: string) => {
    if (!branchId || !date) return;
    
    // Only show full loading state on initial load
    if (isInitialLoading) {
      setIsLoading(true);
    } else {
      setIsTableLoading(true);
    }
    
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
      
      // Optimize sorting by using a more efficient comparison
      const sortedOrders = response.data.sort((a: Order, b: Order) => 
        new Date(b.orderReceivedTime).getTime() - new Date(a.orderReceivedTime).getTime()
      );

      // Batch state updates
      setOrders(sortedOrders);
      
    } catch (error) {
      setOrders([]);
    } finally {
      setIsLoading(false);
      setIsTableLoading(false);
      setIsInitialLoading(false);
    }
  }, [userProfile?.restaurantId, userProfile?.role, userProfile?.branchId, isInitialLoading]);

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

        // Exclude customerApp orders that are still pending (they should only appear in the new order modal)
        // Also exclude customerApp orders that don't have "Paid" payment status
        const shouldShowInTable = !(order.orderChannel === 'customerApp' && 
          (order.orderAccepted === 'pending' || order.paymentStatus !== 'Paid'));

        return matchesSearch && matchesTab && shouldShowInTable;
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

  const handleOrderClick = (orderNumber: string) => {
    // Find the order data from the current orders list
    const orderData = orders.find(order => order.orderNumber === orderNumber);
    setSelectedOrderId(orderNumber);
    onOrderDetailsView(true);
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

  // Update the kitchen status handler for faster refresh
  const handleKitchenStatusUpdate = async (orderId: string, currentStatus: string, order: Order) => {
    // Return early if order is from restaurant portal
    if (order.orderChannel === 'restaurantPortal') {
      // Kitchen status cannot be updated for restaurant portal orders
      return;
    }

    // Prevent multiple simultaneous updates for the same order
    if (loadingOrderIds.has(orderId)) {
      return;
    }

    // Determine the next status based on current status
    let nextStatus = '';
    if (order.kitchenStatus === '' || !order.kitchenStatus) {
      nextStatus = 'orderReceived';
    } else if (order.kitchenStatus === 'orderReceived') {
      nextStatus = 'preparing';
    } else if (order.kitchenStatus === 'preparing') {
      nextStatus = 'prepared';
    } else {
      return; // No further status changes allowed
    }

    // Prevent multiple simultaneous updates for the same order
    if (loadingOrderIds.has(order.id)) {
      return;
    }

    // Add this order to loading state before any updates
    setLoadingOrderIds(prev => new Set(prev).add(order.id));

    // Safety timeout to clear loading state after 10 seconds
    const timeoutId = setTimeout(() => {
      setLoadingOrderIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(order.id);
        return newSet;
      });
    }, 10000);

    try {
      // Make the API call first
      const response = await api.patch('/edit/kitchen/status', {
        orderNumber: order.orderNumber,
        kitchenStatus: nextStatus
      });

    

      // After successful API call, update the UI optimistically
      const updatedOrder = { ...order, kitchenStatus: nextStatus };
      
      // Update the table with the new status
      setOrders(prevOrders => 
        prevOrders.map(prevOrder => 
          prevOrder.id === order.id 
            ? updatedOrder
            : prevOrder
        )
      );

      // Kitchen status updated successfully
      
    } catch (error: any) {
      // Check if the error is just a response format issue but the update might have succeeded
      // Wait a moment and then refresh the order data to check if it actually updated
      setTimeout(async () => {
        try {
          // Refresh the orders to see if the status actually changed
          if (selectedDate && selectedBranchId) {
            await fetchOrders(selectedBranchId, selectedDate.format('YYYY-MM-DD'));
          }
        } catch (refreshError) {
          // Handle refresh error silently
        }
      }, 1000);
      
      // For now, don't revert the UI changes immediately - let the refresh handle it
      // If it's just a response parsing error, the changes might have succeeded
      
      // Only show error if it's clearly a server error (5xx) or network error
      if (error?.status >= 500 || error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network')) {
        // Failed to update kitchen status - Network or server error
        
        // Revert the optimistic updates for network/server errors
        setOrders(prevOrders => 
          prevOrders.map(prevOrder => 
            prevOrder.id === order.id 
              ? { ...prevOrder, kitchenStatus: order.kitchenStatus }
              : prevOrder
          )
        );

        // Notification removed for kitchen status errors
      } else {
        // For other errors (likely response format issues), show a different message
      }
    } finally {
      // Clear the timeout since we're done
      clearTimeout(timeoutId);
      
      // Remove this order from loading state after all operations are complete
      setLoadingOrderIds(prev => {
        const next = new Set(prev);
        next.delete(order.id);
        return next;
      });
    }
  };



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
      {selectedOrderId ? (
        <OrderDetails 
          orderId={selectedOrderId} 
          onBack={handleBackToOrders}
          orderDetails={orderDetails}
          isLoading={isOrderDetailsLoading}
          error={error}
          // Pass the order data directly from the orders list
          orderData={orders.find(order => order.orderNumber === selectedOrderId) || null}
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
              <div className="grid grid-cols-8 bg-[#f9f9f9] p-3 gap-2" style={{ borderBottom: '1px solid #eaeaea', gridTemplateColumns: '80px 1fr 1.2fr 0.8fr 80px 80px 1fr 1fr' }}>
                <div className="text-[12px] leading-[20px] font-sans text-[#666]">{t('orders.orderNumber')}</div>
                <div className="text-[12px] leading-[20px] font-sans text-[#666]">{t('orders.customer')}</div>
                <div className="text-[12px] leading-[20px] font-sans text-[#666]">{t('orders.address')}</div>
                <div className="text-[12px] leading-[20px] font-sans text-[#666]">{t('orders.date')}</div>
                <div className="text-[12px] leading-[20px] font-sans text-[#666]">{t('orders.price')} (GH₵)</div>
                <div className="text-[12px] leading-[20px] font-sans text-[#666]">OTP</div>
                <div className="text-[12px] leading-[20px] font-sans text-[#666]">{t('orders.orderStatus')}</div>
                <div className="text-[12px] leading-[20px] font-sans text-[#666]">{t('orders.kitchenStatus')}</div>
              </div>

              {/* Table Body */}
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#fe5b18] border-t-transparent"></div>
                  <div className="mt-2 text-[#666] font-sans">{t('common.loading')}</div>
                </div>
              ) : paginatedOrders.orders.length === 0 ? (
                <div className="p-4 text-center text-gray-500 font-sans">{t('orders.noOrdersFound')}</div>
              ) : (
                <>
                  {paginatedOrders.orders.map((order) => (
                    <div 
                      key={order.id} 
                      style={{ borderBottom: '1px solid #eaeaea', gridTemplateColumns: '80px 1fr 1.2fr 0.8fr 80px 80px 1fr 1fr' }}
                      className="grid grid-cols-8 p-3 gap-2 hover:bg-[#f9f9f9] transition-all duration-200 cursor-pointer"
                      onClick={() => handleOrderClick(order.orderNumber)}
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
                      <div className="text-[12px] leading-[20px] font-sans text-[#444] font-mono">
                        {order.orderOTP || 'N/A'}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-[10px] leading-[20px] font-sans ${getStatusStyle(order.orderStatus)}`}>
                          {formatOrderStatus(order.orderStatus)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] leading-[20px] font-sans
                            ${loadingOrderIds.has(order.id) ? 'opacity-50' : ''} 
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
                            if (!loadingOrderIds.has(order.id) && order.orderChannel !== 'restaurantPortal') {
                              handleKitchenStatusUpdate(order.id, order.kitchenStatus || '', order);
                            }
                          }}
                          style={{ 
                            cursor: loadingOrderIds.has(order.id) || order.orderChannel === 'restaurantPortal' 
                              ? 'not-allowed' 
                              : order.kitchenStatus === 'prepared' 
                                ? 'default' 
                                : 'pointer',
                            position: 'relative'
                          }}
                        >
                          {loadingOrderIds.has(order.id) ? (
                            <span className="flex items-center gap-1">
                              <svg className="animate-spin h-3 w-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              {translateKitchenStatus(order.kitchenStatus)}
                            </span>
                          ) : (
                            order.orderChannel === 'restaurantPortal' 
                              ? `${translateKitchenStatus(order.kitchenStatus)} (Portal Order)` 
                              : translateKitchenStatus(order.kitchenStatus)
                          )}
                        </span>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button 
                            className="p-1 border-[1px] border-solid border-[#eaeaea] rounded-[4px] bg-white hover:bg-gray-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOrderClick(order.orderNumber);
                            }}
                          >
                            <IoInformationCircleOutline className="w-[14px] h-[14px] text-[#666]" />
                          </button>
                          {/* Hide edit button for customerApp orders */}
                          {order.orderChannel !== 'customerApp' && (
                            <button 
                              className="p-1 border-[1px] border-solid border-[#eaeaea] rounded-[4px] bg-white hover:bg-gray-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(e, order);
                              }}
                            >
                              <CiEdit className="w-[14px] h-[14px] text-[#666]" />
                            </button>
                          )}
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


        </div>
      )}
    </div>
  );
};

export default Orders; 