import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { AiOutlineDollar } from "react-icons/ai";
import { LuBox } from "react-icons/lu";
import { IoFastFoodOutline } from "react-icons/io5";
import { HiOutlineUsers } from "react-icons/hi";
import { SlOptionsVertical } from "react-icons/sl";
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { api } from '../../services/api';
import dayjs from 'dayjs';
import { useDashboardData } from '../../hooks/useDashboardData';
import useMonthlyOrderData from '../../hooks/useMonthlyOrderData';
import { BroadcastBanner } from './BroadcastBanner';
import BranchFilter from '../../components/BranchFilter';
import { useUserProfile } from '../../hooks/useUserProfile';



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
}

const CustomTooltip = ({ active, payload, coordinate }: any) => {
  if (active && payload && payload.length) {
    return (
      <div 
        className="relative bg-white px-2 py-1 rounded shadow-md"
        style={{
          transform: 'translate(-50%, -50%)',
          left: coordinate?.x,
          top: coordinate?.y,
          position: 'absolute',
        }}
      >
        <div className="text-sm font-medium">{payload[0].value}</div>
        <div 
          className="absolute left-1/2 bottom-0"
          style={{
            transform: 'translate(-50%, 95%)',
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid white'
          }}
        />
      </div>
    );
  }
  return null;
};

interface OverviewProps {
  setActiveView: (view: string) => void;
  hideRevenue?: boolean;
}

interface DashboardPermissions {
  canViewRevenue: boolean;
}

const Overview: React.FC<OverviewProps> = ({ setActiveView, hideRevenue = false }) => {
  const [orderTimeRange, setOrderTimeRange] = useState('6');
  const [revenueTimeRange, setRevenueTimeRange] = useState('6');
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const { userProfile, isAdmin } = useUserProfile();
  
  const { monthlyOrderData, isLoading: isMonthlyOrderDataLoading } = useMonthlyOrderData(
    userProfile.restaurantId,
    selectedBranchId || userProfile.branchId
  );

  const [permissions, setPermissions] = useState<DashboardPermissions>({
    canViewRevenue: false
  });

  const getBarSize = () => {
    switch (orderTimeRange) {
      case '3': return 40;
      case '6': return 20;
      case '12': return 15;
      default: return 25;
    }
  };

  const fetchRecentOrders = async (branchId?: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        restaurantId: userProfile.restaurantId || '',
        branchId: branchId || selectedBranchId || userProfile.branchId || '',
        date: dayjs().format('YYYY-MM-DD')
      });

      const response = await api.get(`/filter/orders/by/date?${params.toString()}`);
      const ordersWithDefaultImage = response.data.slice(0, 3).map((order: Order) => ({
        ...order,
        customerImage: order.customerImage || '/default-profile.jpg'
      }));
      setRecentOrders(ordersWithDefaultImage);
    } catch (error) {
      setRecentOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile.restaurantId && (selectedBranchId || userProfile.branchId)) {
      fetchRecentOrders(selectedBranchId || userProfile.branchId);
    }
  }, [userProfile.restaurantId, selectedBranchId]);

  const handleSeeAllClick = () => {
    setActiveView('orders');
  };

  const { data, isLoading: isDashboardLoading, error } = useDashboardData({
    restaurantId: userProfile.restaurantId || '',
    branchId: selectedBranchId || userProfile.branchId || '',
  });

  const fetchMonthlyData = async () => {
    try {
      const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      const response = await api.get(`/orders/monthly/data`, {
        params: {
          restaurantId: userProfile.restaurantId,
          branchId: userProfile.branchId
        }
      });
      
    } catch (error) {
    }
  };

  const getFilteredOrderData = () => {
    const range = parseInt(orderTimeRange);
    const filteredData = monthlyOrderData?.slice(0, range) || [];
    return filteredData;
  };

  const filteredRevenueData = useMemo(() => {
    const filtered = monthlyOrderData?.slice(0, parseInt(revenueTimeRange)) || [];
    return filtered;
  }, [monthlyOrderData, revenueTimeRange]);

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

  const handleBranchSelect = async (branchId: string) => {
    setSelectedBranchId(branchId);
    fetchRecentOrders(branchId);
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `GH₵${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `GH₵${(value / 1000).toFixed(1)}K`;
    }
    return `GH₵${value}`;
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  return (
    <main>
      <div className="p-3 md:p-4">
        <BroadcastBanner restaurantId={userProfile.restaurantId || ''} />

        <div className="flex justify-between items-center mb-4">
          <h1 className="text-lg md:text-xl font-bold font-sans">Dashboard</h1>
          {isAdmin && (
            <BranchFilter 
              restaurantId={userProfile.restaurantId || null}
              onBranchSelect={handleBranchSelect}
              selectedBranchId={selectedBranchId}
              className="appearance-none bg-white border border-[rgba(167,161,158,0.1)] rounded-md px-4 py-2 pr-8 text-[14px] font-sans text-[#666] cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-0 focus:border-[rgba(167,161,158,0.1)]"
            />
          )}
        </div>
       {/* Overview Stats */}   
        <section className={`grid ${!hideRevenue ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3'} gap-3 mb-4 font-sans`}>
          {!hideRevenue && (
            <div className="bg-white rounded-2xl p-3 flex items-center gap-3 shadow-[0px_4px_4px_rgba(0,0,0,0.05)]">
              <div className="w-[50px] h-[50px] rounded-lg bg-[rgba(254,91,24,0.05)] flex items-center justify-center">
                <AiOutlineDollar className="w-5 h-5 text-[#fe5b18]" />
              </div>
              <div>
                <p className="text-gray-600 text-xs font-sans m-0">Total Revenue</p>
                <p className="text-xl font-bold font-sans m-0">
                  {isDashboardLoading ? 'Loading...' : formatCurrency(Number(data?.totalRevenue || 0))}
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-3 flex items-center gap-3 shadow-[0px_4px_4px_rgba(0,0,0,0.05)]">
            <div className="w-[50px] h-[50px] rounded-lg bg-[rgba(254,91,24,0.05)] flex items-center justify-center">
              <LuBox className="w-5 h-5 text-[#fe5b18]" />
            </div>
            <div>
              <p className="text-gray-600 text-xs font-sans m-0">Total Orders</p>
              <p className="text-xl font-bold font-sans m-0">
                {isDashboardLoading ? 'Loading...' : formatNumber(Number(data?.totalOrders || 0))}
              </p>
            </div>
          </div>

          {!hideRevenue && (
            <div className="bg-white rounded-2xl p-3 flex items-center gap-3 shadow-[0px_4px_4px_rgba(0,0,0,0.05)]">
              <div className="w-[50px] h-[50px] rounded-lg bg-[rgba(254,91,24,0.05)] flex items-center justify-center">
                <IoFastFoodOutline className="w-5 h-5 text-[#fe5b18]" />
              </div>
              <div>
                <p className="text-gray-600 text-xs font-sans m-0">Inventory Items</p>
                <p className="text-xl font-bold font-sans m-0">
                  {isDashboardLoading ? 'Loading...' : formatNumber(Number(data?.totalMenu || 0))}
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-3 flex items-center gap-3 shadow-[0px_4px_4px_rgba(0,0,0,0.05)]">
            <div className="w-[50px] h-[50px] rounded-lg bg-[rgba(254,91,24,0.05)] flex items-center justify-center">
              <HiOutlineUsers className="w-5 h-5 text-[#fe5b18]" />
            </div>
            <div>
              <p className="text-gray-600 text-xs font-sans m-0">Total Staff</p>
              <p className="text-xl font-bold font-sans m-0">
                {isDashboardLoading ? 'Loading...' : formatNumber(Number(data?.totalStaff || 0))}
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 font-sans">
          <div className={`bg-white rounded-2xl p-4 ${hideRevenue ? 'md:col-span-2' : ''}`}>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-gray-800 font-sans">
                Total Orders {isMonthlyOrderDataLoading && '(Loading...)'}
              </h2>
              <div className="relative">
                <select
                  value={orderTimeRange}
                  onChange={(e) => setOrderTimeRange(e.target.value)}
                  className="appearance-none bg-white border border-[rgba(167,161,158,0.1)] rounded-md px-4 py-2 pr-8 text-[14px] font-sans text-[#666] cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-0 focus:border-[rgba(167,161,158,0.1)]"
                >
                  <option value="3">Last 3 Months</option>
                  <option value="6">Last 6 Months</option>
                  <option value="12">Last 12 Months</option>
                </select>
              </div>
            </div>
            {isMonthlyOrderDataLoading ? (
              <div className="h-[200px] flex items-center justify-center">Loading...</div>
            ) : monthlyOrderData?.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart 
                  data={getFilteredOrderData()} 
                  margin={{ top: 20, right: 0, left: 0, bottom: 5 }}
                >
                  <CartesianGrid 
                    horizontal={true}
                    vertical={false}
                    strokeDasharray="3 3" 
                  />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#666', fontSize: 12, fontFamily: 'sans-serif' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: '#666',
                      fontSize: 11,
                      fontFamily: 'sans-serif',
                    }}
                    tickFormatter={formatNumber}
                    width={45}
                  />
                  <Tooltip 
                    cursor={false}
                    content={<CustomTooltip />}
                    position={{ y: -10 }}
                  />
                  <Bar 
                    dataKey="orders" 
                    fill="#F97316" 
                    barSize={getBarSize()} 
                    radius={[10, 10, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {!hideRevenue && (
            <div className="bg-white rounded-2xl p-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold text-gray-800 font-sans">
                  Total Revenue {isMonthlyOrderDataLoading && '(Loading...)'}
                </h2>
                <div className="relative">
                  <select
                    value={revenueTimeRange}
                    onChange={(e) => setRevenueTimeRange(e.target.value)}
                    className="appearance-none bg-white border border-[rgba(167,161,158,0.1)] rounded-md px-4 py-2 pr-8 text-[14px] font-sans text-[#666] cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-0 focus:border-[rgba(167,161,158,0.1)]"
                  >
                    <option value="3">Last 3 Months</option>
                    <option value="6">Last 6 Months</option>
                    <option value="12">Last 12 Months</option>
                  </select>
                </div>
              </div>
              
              {isMonthlyOrderDataLoading ? (
                <div className="h-[200px] flex items-center justify-center">Loading...</div>
              ) : monthlyOrderData?.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center">No data available</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart
                    data={filteredRevenueData}
                    margin={{ top: 20, right: 0, left: 0, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="rgb(255, 138, 76)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="rgb(255, 138, 76)" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid 
                      horizontal={true}
                      vertical={false}
                      strokeDasharray="3 3"
                      stroke="#eee"
                    />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#666', fontSize: 12, fontFamily: 'sans-serif' }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: '#666',
                        fontSize: 11,
                        fontFamily: 'sans-serif',
                      }}
                      tickFormatter={formatCurrency}
                      width={75}
                    />
                    <Tooltip
                      cursor={false}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white shadow-lg rounded-lg p-2 text-sm font-sans">
                              <p className="font-medium text-gray-900">
                                  GH₵{payload[0].value}
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="totalPrice"
                      stroke="rgb(255, 138, 76)"
                      strokeWidth={2}
                      fill="url(#revenueGradient)"
                      dot={false}


                      activeDot={{
                        r: 6,
                        fill: "white",
                        stroke: "rgb(255, 138, 76)",
                        strokeWidth: 2
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold font-sans">Current Orders</h2>
          </div>

          <div className="w-full border-[1px] border-solid border-[rgba(167,161,158,0.1)] rounded-lg overflow-hidden">
            <div className="grid grid-cols-6 bg-[#f9f9f9] p-3" style={{ borderBottom: '1px solid #eaeaea' }}>
              <div className="text-[12px] leading-[20px] font-sans text-[#666]">Order Number</div>
              <div className="text-[12px] leading-[20px] font-sans text-[#666]">Name</div>
              <div className="text-[12px] leading-[20px] font-sans text-[#666]">Address</div>
              <div className="text-[12px] leading-[20px] font-sans text-[#666]">Date</div>
              <div className="text-[12px] leading-[20px] font-sans text-[#666]">Price (GH₵)</div>
              <div className="text-[12px] leading-[20px] font-sans text-[#666]">Status</div>
            </div>

            {isLoading ? (
              <div className="p-4 text-center text-gray-500">Loading orders...</div>
            ) : recentOrders.length === 0 ? (
              <div className="p-4 text-center text-gray-500 font-sans">No current orders found</div>
            ) : (
              recentOrders.map((order) => (
                <div 
                  key={order.id} 
                  style={{ borderBottom: '1px solid #eaeaea' }}
                  className="grid grid-cols-6 p-3 hover:bg-[#f9f9f9]"
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
                  <div className="text-[12px] leading-[20px] font-sans text-[#444]">{Number(order.totalPrice).toFixed(2)}</div>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-[10px] leading-[20px] font-sans ${getStatusStyle(order.orderStatus)}`}>
                      {order.orderStatus}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end mt-4">
            <span 
              onClick={handleSeeAllClick}
              className="text-[#fe5b18] text-sm font-semibold font-sans cursor-pointer hover:text-[#e54d0e]"
            >
              See All
            </span>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Overview;

