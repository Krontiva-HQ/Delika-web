import { FunctionComponent, useState, useEffect, useCallback, useMemo } from "react";
import { IoMdAdd } from "react-icons/io";
import { SlOptionsVertical } from "react-icons/sl";
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Popover } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import PlaceOrder from './PlaceOrder';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import OrderDetails from './OrderDetails';
import useOrderDetails from '../../hooks/useOrderDetails';
import { CiEdit } from "react-icons/ci";
import EditOrder from '../Dashboard/EditOrder';
import { useBranches } from '../../hooks/useBranches';
import { useUserProfile } from '../../hooks/useUserProfile';
import BranchFilter from '../../components/BranchFilter';

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
  switch (status) {
    case 'ReadyForPickup':
      return 'Ready For Pickup';
    case 'OnTheWay':
      return 'On The Way';
    case 'DeliveryFailed':
      return 'Delivery Failed';
    default:
      return status;
  }
};

interface OrdersProps {
  searchQuery: string;
  onOrderDetailsView: (viewing: boolean) => void;
}

const Orders: FunctionComponent<OrdersProps> = ({ searchQuery, onOrderDetailsView }) => {
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

  // Simplified fetch function
  const fetchOrders = useCallback(async (branchId: string, date: string) => {
    setIsLoading(true);
    setOrders([]); // Clear existing data
    
    try {
      const params = new URLSearchParams({
        restaurantId: userProfile?.restaurantId || '',
        branchId: userProfile?.role === 'Admin' ? branchId : userProfile?.branchId || '',       
        date: date
      });

      const response = await api.get(`/filter/orders/by/date?${params.toString()}`);
      setOrders(response.data);
    } catch (error) {
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.restaurantId]);

  // Immediate fetch on branch selection
  const handleBranchSelect = useCallback((branchId: string) => {
    localStorage.setItem('selectedBranchId', branchId);
    setSelectedBranchId(branchId);
    
    if (selectedDate) {
      // Immediate fetch with new branch
      fetchOrders(branchId, selectedDate.format('YYYY-MM-DD'));
    }
  }, [selectedDate, fetchOrders]);

  // Fetch when date changes
  useEffect(() => {
    if (selectedDate && selectedBranchId) {
      fetchOrders(selectedBranchId, selectedDate.format('YYYY-MM-DD'));
    }
  }, [selectedDate, selectedBranchId, fetchOrders]);

  const handleOrderPlaced = useCallback(() => {
    if (selectedDate && selectedBranchId) {
      fetchOrders(selectedBranchId, selectedDate.format('YYYY-MM-DD'));
    }
  }, [selectedDate, selectedBranchId, fetchOrders]);

  const handleOrderEdited = useCallback(() => {
    if (selectedDate && selectedBranchId) {
      fetchOrders(selectedBranchId, selectedDate.format('YYYY-MM-DD'));
      setShowEditOrder(false);  // Close the modal
      setEditingOrder(null);    // Clear the editing order
    }
  }, [selectedDate, selectedBranchId, fetchOrders]);

  // Filter orders based on search query and active tab
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = searchQuery
        ? order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.orderNumber.toString().includes(searchQuery)
        : true;

      const matchesTab = activeTab === 'all' 
        ? true 
        : activeTab === 'readyForPickup' 
          ? order.orderStatus === 'ReadyForPickup'
          : order.orderStatus.toLowerCase() === activeTab;

      return matchesSearch && matchesTab;
    });
  }, [orders, searchQuery, activeTab]);

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

  // Add useEffect to set initial branch if none selected
  useEffect(() => {
    if (userProfile?.role === 'Admin' && branches.length > 0 && !selectedBranchId) {
      const firstBranchId = branches[0].id;
      localStorage.setItem('selectedBranchId', firstBranchId);
      setSelectedBranchId(firstBranchId);
    }
  }, [branches, userProfile?.role]);

  useEffect(() => {
    // Update parent component when selectedOrderId changes
    onOrderDetailsView(!!selectedOrderId);
  }, [selectedOrderId, onOrderDetailsView]);

  return (
    <div className="h-full w-full bg-white m-0 p-0">
      {selectedOrderId ? (
        <OrderDetails 
          orderId={selectedOrderId} 
          onBack={() => {
            handleBackToOrders();
            onOrderDetailsView(false);
          }} 
          orderDetails={orderDetails}
          isLoading={isOrderDetailsLoading}
          error={error}
        />
      ) : (
        <div className="p-3 ml-4 mr-4">
          {/* Header Section with Orders title and New Order button */}
          <div className="flex justify-between items-center mb-4">
            <b className="text-[18px] font-sans">
              Orders
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
                <span className="font-sans text-white">New Order</span>
              </div>
            </div>
          </div>

          {/* Tabs and Calendar Section */}
          <div className="flex flex-row items-center justify-between text-[#535353] w-full mb-4">
            <div className="flex gap-8">
              <div 
                className={`relative text-[12px] leading-[20px] font-sans cursor-pointer border-[1px] border-solid border-[#eaeaea] rounded-[6px] px-1 py-1
                  ${activeTab === 'all' 
                    ? 'bg-[#fe5b18] text-white border-[#fe5b18]' 
                    : 'text-[#797979]'
                  }`}
                onClick={() => setActiveTab('all')}
              >
                All Orders
              </div>
              <div 
                className={`relative text-[12px] leading-[20px] font-sans cursor-pointer border-[1px] border-solid border-[#eaeaea] rounded-[6px] px-1 py-1
                  ${activeTab === 'readyForPickup'
                    ? 'bg-[#fe5b18] text-white border-[#fe5b18]'
                    : 'text-[#929494]'
                  }`}
                onClick={() => setActiveTab('readyForPickup')}
              >
                Ready For Pickup
              </div>
              <div 
                className={`relative text-[12px] leading-[20px] font-sans cursor-pointer border-[1px] border-solid border-[#eaeaea] rounded-[6px] px-1 py-1
                  ${activeTab === 'assigned'
                    ? 'bg-[#fe5b18] text-white border-[#fe5b18]'
                    : 'text-[#929494]'
                  }`}
                onClick={() => setActiveTab('assigned')}
              >
                Assigned
              </div>
              <div 
                className={`relative text-[12px] leading-[20px] font-sans cursor-pointer border-[1px] border-solid border-[#eaeaea] rounded-[6px] px-1 py-1
                  ${activeTab === 'pickup'
                    ? 'bg-[#fe5b18] text-white border-[#fe5b18]'
                    : 'text-[#929494]'
                  }`}
                onClick={() => setActiveTab('pickup')}
              >
                Pickup
              </div>
              <div 
                className={`relative text-[12px] leading-[20px] font-sans cursor-pointer border-[1px] border-solid border-[#eaeaea] rounded-[6px] px-1 py-1
                  ${activeTab === 'onTheWay'
                    ? 'bg-[#fe5b18] text-white border-[#fe5b18]'
                    : 'text-[#929494]'
                  }`}
                onClick={() => setActiveTab('onTheWay')}
              >
                On The Way
              </div>
              <div 
                className={`relative text-[12px] leading-[20px] font-sans cursor-pointer border-[1px] border-solid border-[#eaeaea] rounded-[6px] px-1 py-1 
                  ${activeTab === 'delivered'
                    ? 'bg-[#fe5b18] text-white border-[#fe5b18]'
                    : 'text-[#929494]'
                  }`}
                onClick={() => setActiveTab('delivered')}
              >
                Delivered
              </div>
              <div 
                className={`relative text-[12px] leading-[20px] font-sans cursor-pointer border-[1px] border-solid border-[#eaeaea] rounded-[6px] px-1 py-1
                  ${activeTab === 'cancelled'
                    ? 'bg-[#fe5b18] text-white border-[#fe5b18]'
                    : 'text-[#929494]'
                  }`}
                onClick={() => setActiveTab('cancelled')}
              >
                Cancelled
              </div>
              <div 
                className={`relative text-[12px] leading-[20px] font-sans cursor-pointer border-[1px] border-solid border-[#eaeaea] rounded-[6px] px-1 py-1
                  ${activeTab === 'deliveryFailed'
                    ? 'bg-[#fe5b18] text-white border-[#fe5b18]'
                    : 'text-[#929494]'
                  }`}
                onClick={() => setActiveTab('deliveryFailed')}
              >
                Delivery Failed
              </div>
            </div>

            {/* Calendar Trigger */}
            <div 
              onClick={handleDateClick}
              className="flex items-center gap-2 px-3 py-1 border border-[rgba(167,161,158,0.1)] rounded-md cursor-pointer hover:bg-gray-50"
            >
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

            {/* Calendar Popover */}
            <LocalizationProvider dateAdapter={AdapterDayjs}>
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

          {/* Table Section */}
          <div className="w-full border-[1px] border-solid border-[rgba(167,161,158,0.1)] rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-6 bg-[#f9f9f9] p-3" style={{ borderBottom: '1px solid #eaeaea' }}>
              <div className="text-[12px] leading-[20px] font-sans text-[#666]">Order Number</div>
              <div className="text-[12px] leading-[20px] font-sans text-[#666]">Name</div>
              <div className="text-[12px] leading-[20px] font-sans text-[#666]">Address</div>
              <div className="text-[12px] leading-[20px] font-sans text-[#666]">Date</div>
              <div className="text-[12px] leading-[20px] font-sans text-[#666]">Price (GH₵)</div>
              <div className="text-[12px] leading-[20px] font-sans text-[#666]">Status</div>
            </div>

            {/* Table Body */}
            {isLoading ? (
              <div className="p-4 text-center text-gray-500 font-sans">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="p-4 text-center text-gray-500 font-sans">No orders found</div>
            ) : (
              filteredOrders.map((order) => (
                <div 
                  key={order.id} 
                  style={{ borderBottom: '1px solid #eaeaea' }}
                  className="grid grid-cols-6 p-3 hover:bg-[#f9f9f9] cursor-pointer"
                  onClick={() => handleOrderClick(order.orderNumber)}
                >
                  <div className="text-[12px] leading-[20px] font-sans text-[#444]">{order.orderNumber}</div>
                  <div className="flex items-center gap-2">
                    <img 
                      src={order.customerImage || '/default-profile.jpg'} 
                      alt={order.customerName} 
                      className="w-6 h-6 rounded-full object-cover"
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
                  <div className="text-[12px] leading-[20px] font-sans text-[#666]">{order.orderDate}</div>
                  <div className="text-[12px] leading-[20px] font-sans text-[#444]">
                    {Number(order.totalPrice).toFixed(2)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-[10px] leading-[20px] font-sans ${getStatusStyle(order.orderStatus)}`}>
                      {formatOrderStatus(order.orderStatus)}
                    </span>
                    <button 
                      className="p-1 border-[1px] border-solid border-[#eaeaea] rounded-[4px] bg-white hover:bg-gray-50"
                      onClick={(e) => handleEditClick(e, order)}
                    >
                      <CiEdit className="w-[14px] h-[14px] text-[#666]" />
                    </button>
                  </div>
                </div>
              ))
            )}
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