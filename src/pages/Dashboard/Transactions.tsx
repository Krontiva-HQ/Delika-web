import { FunctionComponent, useState, useEffect, useCallback, useMemo } from "react";
import { IoMdAdd, IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { SlOptionsVertical } from "react-icons/sl";
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Popover } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import { useNavigate } from 'react-router-dom';
import TransactionDetails from './TransactionDetails';
import useFetchOrders from '../../hooks/useFetchOrders';
import useTransactionDetails from '../../hooks/useTransactionDetails';
import { api } from '../../services/api';
import { useBranches } from '../../hooks/useBranches';
import { useUserProfile } from '../../hooks/useUserProfile';
import BranchFilter from '../../components/BranchFilter';
import { CiEdit } from "react-icons/ci";
import EditOrder from '../Dashboard/EditOrder';
import { Order } from "@/types/order";

const Transactions: FunctionComponent = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string | null>(null);
  const { userProfile } = useUserProfile();
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [showEditOrder, setShowEditOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { branches, isLoading: branchesLoading } = useBranches(userProfile?.restaurantId ?? null);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => {
    return localStorage.getItem('selectedBranchId') || '';
  });

  // Add pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  // Updated fetchTransactions function
  const fetchTransactions = useCallback(async (branchId: string, date: string) => {
    setIsLoading(true);
    
    try {
      let params = new URLSearchParams();

      // Handle different roles like in Orders.tsx
      if (userProfile?.role === 'Store Clerk' || userProfile?.role === 'Manager') {
        params = new URLSearchParams({
          restaurantId: userProfile?.restaurantId || '',
          branchId: userProfile?.branchId || '', // Use assigned branchId
          date: date,
          page: currentPage.toString(),
          limit: ordersPerPage.toString()
        });
      } else if (userProfile?.role === 'Admin') {
        params = new URLSearchParams({
          restaurantId: userProfile?.restaurantId || '',
          branchId: branchId,
          date: date,
          page: currentPage.toString(),
          limit: ordersPerPage.toString()
        });
      }

      const response = await api.get(`/filter/orders/by/date?${params.toString()}`);

      if (!response.data) {
        throw new Error('No data received from server');
      }

      if (!Array.isArray(response.data)) {
        console.error('Unexpected response format:', response.data);
        throw new Error('Invalid response format');
      }

      const sortedOrders = Array.isArray(response.data) 
        ? response.data.sort((a: Order, b: Order) => {
            return new Date(b.orderReceivedTime).getTime() - new Date(a.orderReceivedTime).getTime();
          })
        : [];
        
      setOrders(sortedOrders);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.restaurantId, userProfile?.role, userProfile?.branchId, currentPage, ordersPerPage]);

  const { transactionDetails, isLoading: isTransactionDetailsLoading, error: transactionDetailsError } = useTransactionDetails(selectedOrderNumber);

  // Add this useEffect to handle initial branch selection
  useEffect(() => {
    if (userProfile?.role === 'Admin' && branches.length > 0 && !selectedBranchId) {
      const firstBranchId = branches[0].id;
      localStorage.setItem('selectedBranchId', firstBranchId);
      setSelectedBranchId(firstBranchId);
    } else if ((userProfile?.role === 'Store Clerk' || userProfile?.role === 'Manager') && userProfile?.branchId) {
      setSelectedBranchId(userProfile.branchId);
    }
  }, [branches, userProfile?.role, userProfile?.branchId]);

  const handleBranchSelect = useCallback((branchId: string) => {
    localStorage.setItem('selectedBranchId', branchId);
    setSelectedBranchId(branchId);
    
    if (selectedDate) {
      // Immediate fetch with new branch
      fetchTransactions(branchId, selectedDate.format('YYYY-MM-DD'));
    }
  }, [selectedDate, fetchTransactions]);

  // Update your date change effect
  useEffect(() => {
    if (selectedDate && selectedBranchId && userProfile?.restaurantId) {
      fetchTransactions(selectedBranchId, selectedDate.format('YYYY-MM-DD'));
    }
  }, [selectedDate, selectedBranchId, userProfile?.restaurantId, fetchTransactions]);

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

  const handleTransactionClick = (orderNumber: string) => {
    setSelectedOrderNumber(orderNumber);
  };

  const handleBackToTransactions = () => {
    setSelectedOrderNumber(null);
  };

  // Update the filteredOrders to include pagination
  const paginatedOrders = useMemo(() => {
    const filtered = orders
      .sort((a, b) => {
        return new Date(b.orderReceivedTime).getTime() - new Date(a.orderReceivedTime).getTime();
      })
      .filter(order => {
        switch (activeTab) {
          case 'pending':
            return order.paymentStatus === 'Pending';
          case 'paid':
            return order.paymentStatus === 'Paid';
          case 'momo':
            return order.payLater === true;
          case 'cash':
            return order.payNow === true;
          case 'visa':
            return order.payVisaCard === true;
          default:
            return true;
        }
      });

    // Calculate pagination
    const indexOfLastOrder = currentPage * ordersPerPage;
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
    
    return {
      orders: filtered.slice(indexOfFirstOrder, indexOfLastOrder),
      totalOrders: filtered.length,
      totalPages: Math.ceil(filtered.length / ordersPerPage)
    };
  }, [orders, activeTab, currentPage]);

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
  }, [activeTab, selectedDate]);

  // Add this handler for edit click
  const handleEditClick = (e: React.MouseEvent, order: Order) => {
    e.stopPropagation();
    setEditingOrder(order);
    setShowEditOrder(true);
  };

  // Add this handler for after editing
  const handleOrderEdited = useCallback(() => {
    if (selectedDate && selectedBranchId) {
      fetchTransactions(selectedBranchId, selectedDate.format('YYYY-MM-DD'));
      setShowEditOrder(false);  // Close the modal
      setEditingOrder(null);    // Clear the editing order
    }
  }, [selectedDate, selectedBranchId, fetchTransactions]);

  // Add this useMemo hook after the paginatedOrders calculation
  const totalAmount = useMemo(() => {
    if (!orders.length) return 0;
    
    const relevantOrders = orders.filter(order => {
      switch (activeTab) {
        case 'pending':
          return order.paymentStatus === 'Pending';
        case 'paid':
          return order.paymentStatus === 'Paid';
        case 'momo':
          return order.payLater === true;
        case 'cash':
          return order.payNow === true;
        case 'visa':
          return order.payVisaCard === true;
        default:
          return true;
      }
    });

    return relevantOrders.reduce((sum, order) => sum + (parseFloat(order.orderPrice) || 0), 0).toFixed(2);
  }, [orders, activeTab]);

  return (
    <div className="h-full w-full bg-white m-0 p-0">
      {selectedOrderNumber ? (
        <TransactionDetails 
          orderNumber={selectedOrderNumber} 
          onBack={handleBackToTransactions}
          transactionDetails={transactionDetails}
          isLoading={isTransactionDetailsLoading}
          error={transactionDetailsError}
        />
      ) : (
        <div className="p-3 ml-4 mr-4">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-4">
            <b className="text-[18px] font-sans">
              Transactions
            </b>
            <div className="flex items-center gap-4">
              {userProfile?.role === 'Admin' && (
                <BranchFilter 
                  restaurantId={userProfile.restaurantId || null}
                  onBranchSelect={handleBranchSelect}
                  selectedBranchId={selectedBranchId}
                  hideAllBranches={true}
                  className="appearance-none bg-white border border-[rgba(167,161,158,0.1)] rounded-md px-4 py-2 pr-8 text-[14px] font-sans text-[#666] cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-0 focus:border-[rgba(167,161,158,0.1)]"
                />
              )}
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
                All Transactions
              </div>
              <div 
                className={`relative text-[12px] leading-[20px] font-sans cursor-pointer border-[1px] border-solid border-[#eaeaea] rounded-[6px] px-1 py-1
                  ${activeTab === 'pending'
                    ? 'bg-[#fe5b18] text-white border-[#fe5b18]'
                    : 'text-[#929494]'
                  }`}
                onClick={() => setActiveTab('pending')}
              >
                Pending
              </div>
              <div 
                className={`relative text-[12px] leading-[20px] font-sans cursor-pointer border-[1px] border-solid border-[#eaeaea] rounded-[6px] px-1 py-1
                  ${activeTab === 'paid'
                    ? 'bg-[#fe5b18] text-white border-[#fe5b18]'
                    : 'text-[#929494]'
                  }`}
                onClick={() => setActiveTab('paid')}
              >
                Paid
              </div>
              <div 
                className={`relative text-[12px] leading-[20px] font-sans cursor-pointer border-[1px] border-solid border-[#eaeaea] rounded-[6px] px-1 py-1
                  ${activeTab === 'momo'
                    ? 'bg-[#fe5b18] text-white border-[#fe5b18]'
                    : 'text-[#929494]'
                  }`}
                onClick={() => setActiveTab('momo')}
              >
                Momo
              </div>
              <div 
                className={`relative text-[12px] leading-[20px] font-sans cursor-pointer border-[1px] border-solid border-[#eaeaea] rounded-[6px] px-1 py-1
                  ${activeTab === 'cash'
                    ? 'bg-[#fe5b18] text-white border-[#fe5b18]'
                    : 'text-[#929494]'
                  }`}
                onClick={() => setActiveTab('cash')}
              >
                Cash
              </div>
              <div 
                className={`relative text-[12px] leading-[20px] font-sans cursor-pointer border-[1px] border-solid border-[#eaeaea] rounded-[6px] px-1 py-1
                  ${activeTab === 'visa'
                    ? 'bg-[#fe5b18] text-white border-[#fe5b18]'
                    : 'text-[#929494]'
                  }`}
                onClick={() => setActiveTab('visa')}
              >
                Visa Card
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Total Amount Display */}
              <div className="border border-[#eaeaea] border-solid rounded-md px-3 py-1">
                <span className="text-[12px] font-sans text-[#666]">
                  Total {activeTab === 'all' ? '' : 
                         activeTab === 'momo' ? 'Momo' :
                         activeTab === 'cash' ? 'Cash' :
                         activeTab === 'visa' ? 'Visa Card' :
                         activeTab === 'pending' ? 'Pending' :
                         activeTab === 'paid' ? 'Paid' : ''}: GH₵ {totalAmount}
                </span>
              </div>

              {/* Calendar Trigger */}
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
              <div className="text-[12px] leading-[20px] font-sans text-[#666]">ID</div>
              <div className="text-[12px] leading-[20px] font-sans text-[#666]">Name</div>
              <div className="text-[12px] leading-[20px] font-sans text-[#666]">Address</div>
              <div className="text-[12px] leading-[20px] font-sans text-[#666]">Date</div>
              <div className="text-[12px] leading-[20px] font-sans text-[#666]">Price (GH₵)</div>
              <div className="text-[12px] leading-[20px] font-sans text-[#666]">Status</div>
            </div>

            {/* Table Body */}
            {isLoading ? (
              <div className="p-4 text-center text-gray-500 font-sans">Loading transactions...</div>
            ) : error ? (
              <div className="p-4 text-center text-red-500 font-sans">Error: {error}</div>
            ) : paginatedOrders.orders.length === 0 ? (
              <div className="p-4 text-center text-gray-500 font-sans">No transactions found</div>
            ) : (
              <>
                {/* Map through paginatedOrders.orders instead of filteredOrders */}
                {paginatedOrders.orders.map((order) => (
                  <div 
                    key={order.id} 
                    style={{ borderBottom: '1px solid #eaeaea' }}
                    className="grid grid-cols-6 p-3 hover:bg-[#f9f9f9] cursor-pointer"
                    onClick={() => handleTransactionClick(order.orderNumber.toString())}
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
                    <div className="text-[12px] leading-[20px] font-sans text-[#666]">{order.dropOff[0]?.toAddress || 'N/A'}</div>
                    <div className="text-[12px] leading-[20px] font-sans text-[#666]">{order.orderDate}</div>
                    <div className="text-[12px] leading-[20px] font-sans text-[#444]">{order.orderPrice}</div>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-[10px] leading-[20px] font-sans ${
                        order.payLater ? 'bg-green-100 text-green-800' :
                        order.payNow ? 'bg-yellow-100 text-yellow-800' :
                        order.payVisaCard ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.payLater ? 'Momo' : order.payNow ? 'Cash' : order.payVisaCard ? 'Visa Card' : 'Unknown'}
                      </span>
                      <button 
                        className="p-1 border-[1px] border-solid border-[#eaeaea] rounded-[4px] bg-white hover:bg-gray-50"
                        onClick={(e) => handleEditClick(e, order)}
                      >
                        <CiEdit className="w-[14px] h-[14px] text-[#666]" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add Pagination Controls */}
                <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-[rgba(167,161,158,0.1)]">
                  <div className="text-[12px] text-gray-500 font-sans">
                    Showing {((currentPage - 1) * ordersPerPage) + 1} to {Math.min(currentPage * ordersPerPage, paginatedOrders.totalOrders)} of {paginatedOrders.totalOrders} transactions
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
                      Page {currentPage} of {paginatedOrders.totalPages}
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
      )}

      {showEditOrder && editingOrder && (
        <EditOrder 
          order={editingOrder}
          onClose={() => {
            setShowEditOrder(false);
            setEditingOrder(null);
          }}
          onOrderEdited={handleOrderEdited}
          isFromTransactions={true}
        />
      )}
    </div>
  );
};

export default Transactions; 