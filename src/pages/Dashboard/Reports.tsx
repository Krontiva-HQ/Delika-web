import { FunctionComponent, useState, useEffect, useCallback } from "react";
import { IoMdAdd } from "react-icons/io";
import { MdOutlineFileDownload } from "react-icons/md";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import useMonthlyOrderData from '../../hooks/useMonthlyOrderData';
import { useUserProfile } from '../../hooks/useUserProfile';
import { api } from '../../services/api';
import { useAuditData } from '../../hooks/useAuditData';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Popover, Menu, MenuItem } from '@mui/material';
import { Dayjs } from 'dayjs';
import { useMenuCategories } from '../../hooks/useMenuCategories';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { jsPDF as JsPDFType } from 'jspdf';
import { useBranches } from '../../hooks/useBranches';
import BranchFilter from '../../components/BranchFilter';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

interface ReportItem {
  id: number;
  name: string;
  date: string;
  format: string;
  status: string;
  requiresPermissions?: boolean;
}

const reportItems: ReportItem[] = [
  {
    id: 1,
    name: "Orders Report",
    date: "All Time",
    format: "PDF",
    status: "Active",
    requiresPermissions: false
  },
  {
    id: 2,
    name: "Top Sold Items",
    date: "All Time",
    format: "PDF",
    status: "Active",
    requiresPermissions: false
  },
  {
    id: 3,
    name: "Customer Report",
    date: "All Time",
    format: "PDF",
    status: "Active",
    requiresPermissions: false
  },
  {
    id: 4,
    name: "Delivery Report",
    date: "All Time",
    format: "PDF",
    status: "Active",
    requiresPermissions: true
  }
];

// Add new interface for detailed order
interface OrderDetail {
  customerName: string;
  customerPhone: string;
  amount: number;
  courierName: string;
  deliveryPrice: number;
  totalPrice: number;
  orderDate: string;
  products: Array<{
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
}

// Add new interface for most selling items
interface MostSellingItem {
  name: string;
  totalQuantitySold: number;
  totalRevenue: number;
  averagePrice: number;
  lastSoldDate: string;
}

// Add new interface for customer report
interface CustomerReport {
  phoneNumber: string;
  customerName: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate: string;
  mostOrderedItems: Array<{
    name: string;
    quantity: number;
  }>;
}

// Add interface for category and food items
interface FoodItem {
  name: string;
  price: number;
  quantity: number;
  foodImage: {
    url: string;
  };
  description?: string;
}

interface Category {
  foods: FoodItem[];
}

// Add new interface for delivery report
interface DeliveryReport {
  courierName: string;
  totalDeliveries: number;
  totalEarnings: number;
  averageDeliveryTime: string;
  completionRate: number;
  lastDeliveryDate: string;
}

const Reports: FunctionComponent = () => {
  // Move all hooks to the top level
  const [activeTab, setActiveTab] = useState('all');
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([]);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const [mostSellingItems, setMostSellingItems] = useState<MostSellingItem[]>([]);
  const [customerReports, setCustomerReports] = useState<CustomerReport[]>([]);
  const [downloadAnchorEl, setDownloadAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => {
    return localStorage.getItem('selectedBranchId') || '';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [deliveryReports, setDeliveryReports] = useState<DeliveryReport[]>([]);

  const { userProfile, restaurantData } = useUserProfile();
  const { branches, isLoading: branchesLoading } = useBranches(userProfile?.restaurantId ?? null);
  const { categories } = useMenuCategories();
  const { data } = useAuditData(userProfile?.restaurantId ?? null);

  // Check if all special permissions are true
  const hasAllSpecialPermissions = restaurantData.Reports && 
                                 restaurantData.Inventory && 
                                 restaurantData.Transactions;

  // Filter reports based on permissions - REVERSED LOGIC
  const availableReports = reportItems.filter((report: ReportItem) => {
    if (hasAllSpecialPermissions) {
      return report.requiresPermissions === true;
    } else {
      return report.requiresPermissions === false;
    }
  });

  // Effect for initial branch setup - always declare it
  useEffect(() => {
    if (userProfile?.role === 'Admin' && branches.length > 0 && !selectedBranchId) {
      const firstBranchId = branches[0].id;
      localStorage.setItem('selectedBranchId', firstBranchId);
      setSelectedBranchId(firstBranchId);
    }
  }, [branches, userProfile?.role, selectedBranchId]);

  // Effect for handling report data updates
  useEffect(() => {
    if (selectedReport && userProfile) {
      setOrderDetails([]);
      setMostSellingItems([]);
      setCustomerReports([]);
      setDeliveryReports([]);
      setIsLoading(true);
      handleReportClick(selectedReport);
    }
  }, [selectedBranchId, selectedReport]);

  const handleBranchSelect = useCallback((branchId: string) => {
    console.log('Branch selected in Reports:', branchId);
    localStorage.setItem('selectedBranchId', branchId);
    setSelectedBranchId(branchId);
    // Immediately refresh report data
    if (selectedReport) {
      handleReportClick(selectedReport);
    }
  }, [selectedReport]);

  const handleReportClick = async (reportName: string) => {
    setSelectedReport(reportName);
    setDateRange([null, null]);
    
    const branchId = selectedBranchId || userProfile?.branchId;
    
    if (reportName === "Orders Report") {
      try {
        const response = await api.get('/get/all/orders/per/branch', {
          params: {
            restaurantId: userProfile?.restaurantId,
            branchId: branchId
          }
        });

        const formattedOrders: OrderDetail[] = response.data.map((order: any) => ({
          customerName: order.customerName,
          customerPhone: order.customerPhoneNumber,
          amount: order.orderPrice,
          courierName: order.courierName,
          deliveryPrice: order.deliveryPrice,
          totalPrice: parseFloat(order.totalPrice),
          orderDate: order.orderDate,
          products: order.products
        }));

        setOrderDetails(formattedOrders);
      } catch (error) {
        console.error('Error fetching order details:', error);
        setOrderDetails([]);
      }
    } else if (reportName === "Top Sold Items") {
      try {
        const response = await api.get('/get/all/orders/per/branch', {
          params: {
            restaurantId: userProfile?.restaurantId,
            branchId: branchId
          }
        });

        // Process orders to get most selling items
        const itemsMap = new Map<string, {
          totalQuantity: number;
          totalRevenue: number;
          lastSoldDate: string;
          averagePrice: number;
        }>();

        response.data.forEach((order: any) => {
          order.products.forEach((product: any) => {
            const existing = itemsMap.get(product.name) || {
              totalQuantity: 0,
              totalRevenue: 0,
              lastSoldDate: order.orderDate,
              averagePrice: 0
            };

            const quantity = parseInt(product.quantity);
            const price = parseFloat(product.price);

            itemsMap.set(product.name, {
              totalQuantity: existing.totalQuantity + quantity,
              totalRevenue: existing.totalRevenue + (price * quantity),
              lastSoldDate: new Date(order.orderDate) > new Date(existing.lastSoldDate) 
                ? order.orderDate 
                : existing.lastSoldDate,
              averagePrice: price
            });
          });
        });

        const sortedItems = Array.from(itemsMap.entries())
          .map(([name, data]) => ({
            name,
            totalQuantitySold: data.totalQuantity,
            totalRevenue: data.totalRevenue,
            averagePrice: data.averagePrice,
            lastSoldDate: new Date(data.lastSoldDate).toLocaleDateString()
          }))
          .sort((a, b) => b.totalQuantitySold - a.totalQuantitySold);

        setMostSellingItems(sortedItems);
      } catch (error) {
        console.error('Error fetching most selling items:', error);
        setMostSellingItems([]);
      }
    } else if (reportName === "Customer Report") {
      try {
        const response = await api.get('/get/all/orders/per/branch', {
          params: {
            restaurantId: userProfile?.restaurantId,
            branchId: branchId
          }
        });

        // Process customer data with the filtered orders
        const customersMap = new Map<string, {
          name: string;
          orders: number;
          totalSpent: number;
          lastOrderDate: string;
          items: Map<string, number>;
        }>();

        response.data.forEach((order: any) => {
          const phone = order.customerPhoneNumber;
          const existing = customersMap.get(phone) || {
            name: order.customerName,
            orders: 0,
            totalSpent: 0,
            lastOrderDate: order.orderDate,
            items: new Map<string, number>()
          };

          // Update customer data
          existing.orders += 1;
          existing.totalSpent += parseFloat(order.totalPrice);
          existing.lastOrderDate = new Date(order.orderDate) > new Date(existing.lastOrderDate)
            ? order.orderDate
            : existing.lastOrderDate;

          // Track ordered items
          order.products.forEach((product: any) => {
            const currentQuantity = existing.items.get(product.name) || 0;
            existing.items.set(product.name, currentQuantity + parseInt(product.quantity));
          });

          customersMap.set(phone, existing);
        });

        setCustomerReports(Array.from(customersMap.entries())
          .map(([phoneNumber, data]) => ({
            phoneNumber,
            customerName: data.name,
            totalOrders: data.orders,
            totalSpent: data.totalSpent,
            averageOrderValue: data.totalSpent / data.orders,
            lastOrderDate: new Date(data.lastOrderDate).toLocaleDateString(),
            mostOrderedItems: Array.from(data.items.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([name, quantity]) => ({ name, quantity }))
          })));
      } catch (error) {
        console.error('Error fetching customer reports:', error);
        setCustomerReports([]);
      }
    } else if (reportName === "Delivery Report") {
      try {
        const response = await api.get('/get/all/orders/per/branch', {
          params: {
            restaurantId: userProfile?.restaurantId,
            branchId: branchId
          }
        });

        // Process orders to get delivery statistics
        const courierMap = new Map<string, {
          deliveries: number;
          earnings: number;
          completedDeliveries: number;
          lastDeliveryDate: string;
        }>();

        response.data.forEach((order: any) => {
          if (!order.courierName) return;

          const existing = courierMap.get(order.courierName) || {
            deliveries: 0,
            earnings: 0,
            completedDeliveries: 0,
            lastDeliveryDate: order.orderDate
          };

          existing.deliveries += 1;
          existing.earnings += parseFloat(order.deliveryPrice || 0);
          if (order.status === 'completed') {
            existing.completedDeliveries += 1;
          }
          if (new Date(order.orderDate) > new Date(existing.lastDeliveryDate)) {
            existing.lastDeliveryDate = order.orderDate;
          }

          courierMap.set(order.courierName, existing);
        });

        const deliveryStats = Array.from(courierMap.entries()).map(([courierName, data]) => ({
          courierName,
          totalDeliveries: data.deliveries,
          totalEarnings: data.earnings,
          averageDeliveryTime: 'N/A',
          completionRate: (data.completedDeliveries / data.deliveries) * 100,
          lastDeliveryDate: new Date(data.lastDeliveryDate).toLocaleDateString()
        }));

        setDeliveryReports(deliveryStats);
      } catch (error) {
        console.error('Error fetching delivery reports:', error);
        setDeliveryReports([]);
      }
    }
  };

  const handleDownloadClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setDownloadAnchorEl(event.currentTarget);
  };

  const handleDownloadClose = () => {
    setDownloadAnchorEl(null);
  };

  const handleDownloadFormat = (format: 'PDF' | 'CSV') => {
    if (!selectedReport) return;

    const dateRangeString = dateRange[0] && dateRange[1] 
      ? `-${dateRange[0].format('YYYY-MM-DD')}-to-${dateRange[1].format('YYYY-MM-DD')}` 
      : '';

    if (format === 'CSV') {
      let headers: string[] = [];
      let csvData: any[][] = [];

      switch (selectedReport) {
        case "Orders Report":
          headers = ["Customer Name", "Phone", "Amount", "Courier", "Delivery Price", "Total Price", "Order Date", "Products"];
          csvData = orderDetails.map(order => [
            order.customerName,
            order.customerPhone,
            order.amount,
            order.courierName,
            order.deliveryPrice,
            order.totalPrice,
            order.orderDate,
            order.products.map(p => `${p.name} (x${p.quantity})`).join(', ')
          ]);
          break;

        case "Top Sold Items":
          headers = ["Item Name", "Quantity Sold", "Total Revenue", "Average Price"];
          csvData = mostSellingItems.map(item => [
            item.name,
            item.totalQuantitySold,
            `${item.totalRevenue.toFixed(2)} GHS`,
            `${item.averagePrice.toFixed(2)} GHS`
          ]);
          break;

        case "Customer Report":
          headers = ["Phone Number", "Customer Name", "Total Orders", "Total Spent", "Avg. Order Value", "Last Order"];
          csvData = customerReports.map(customer => [
            customer.phoneNumber,
            customer.customerName,
            customer.totalOrders,
            `${customer.totalSpent.toFixed(2)} GHS`,
            `${customer.averageOrderValue.toFixed(2)} GHS`,
            customer.lastOrderDate
          ]);
          break;

        case "Delivery Report":
          headers = ["Courier Name", "Total Deliveries", "Total Earnings", "Avg Delivery Time", "Completion Rate", "Last Delivery"];
          csvData = deliveryReports.map(report => [
            report.courierName,
            report.totalDeliveries,
            `${report.totalEarnings.toFixed(2)} GHS`,
            report.averageDeliveryTime,
            `${report.completionRate.toFixed(1)}%`,
            report.lastDeliveryDate
          ]);
          break;
      }

      if (headers.length > 0 && csvData.length > 0) {
        const csvContent = [headers, ...csvData]
          .map(row => row.map(cell => `"${cell}"`).join(","))
          .join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedReport.toLowerCase().replace(/\s+/g, '-')}${dateRangeString}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } else if (format === 'PDF') {
      try {
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(16);
        doc.text(selectedReport, 15, 15);
        
        // Add date if applicable
        if (dateRange[0] && dateRange[1]) {
          doc.setFontSize(10);
          doc.text(`Period: ${dateRange[0].format('YYYY-MM-DD')} to ${dateRange[1].format('YYYY-MM-DD')}`, 15, 25);
        }

        let headers: string[] = [];
        let data: any[][] = [];

        switch (selectedReport) {
          case "Orders Report":
            headers = ["Customer", "Phone", "Amount", "Total", "Date"];
            data = orderDetails.map(order => [
              order.customerName,
              order.customerPhone,
              order.amount,
              order.totalPrice,
              order.orderDate
            ]);
            break;

          case "Top Sold Items":
            headers = ["Item", "Qty Sold", "Revenue", "Avg Price"];
            data = mostSellingItems.map(item => [
              item.name,
              item.totalQuantitySold,
              `${item.totalRevenue.toFixed(2)} GHS`,
              `${item.averagePrice.toFixed(2)} GHS`
            ]);
            break;

          case "Customer Report":
            headers = ["Customer", "Orders", "Total Spent", "Avg Order"];
            data = customerReports.map(customer => [
              `${customer.customerName}\n${customer.phoneNumber}`,
              customer.totalOrders,
              `${customer.totalSpent.toFixed(2)} GHS`,
              `${customer.averageOrderValue.toFixed(2)} GHS`
            ]);
            break;

          case "Delivery Report":
            headers = ["Courier", "Total Deliveries", "Total Earnings", "Avg Delivery Time", "Completion Rate", "Last Delivery"];
            data = deliveryReports.map(report => [
              report.courierName,
              report.totalDeliveries,
              `${report.totalEarnings.toFixed(2)} GHS`,
              report.averageDeliveryTime,
              `${report.completionRate.toFixed(1)}%`,
              report.lastDeliveryDate
            ]);
            break;
        }

        if (headers.length > 0 && data.length > 0) {
          (doc as any).autoTable({
            head: [headers],
            body: data,
            startY: dateRange[0] && dateRange[1] ? 30 : 20,
            theme: 'grid',
            styles: {
              fontSize: 8,
              cellPadding: 2,
            },
            headStyles: {
              fillColor: [254, 91, 24],
              textColor: [255, 255, 255],
              fontStyle: 'bold',
            },
          });

          doc.save(`${selectedReport.toLowerCase().replace(/\s+/g, '-')}${dateRangeString}.pdf`);
        }
      } catch (error) {
        console.error('Error generating PDF:', error);
        // You might want to show an error message to the user here
      }
    }

    handleDownloadClose();
  };

  const handleDateClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const handleDateRangeSelect = async ([start, end]: [Dayjs | null, Dayjs | null]) => {
    setDateRange([start, end]);
    
    if (start && end) {
      try {
        const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        
        if (selectedReport === "Orders Report" && orderDetails.length > 0) {
          // Filter orders based on orderDate
          const filteredOrders = orderDetails.filter(order => {
            const orderDate = dayjs(order.orderDate);
            return orderDate.isSameOrAfter(start, 'day') && 
                   orderDate.isSameOrBefore(end, 'day');
          });
          setOrderDetails(filteredOrders);
        } 
      } catch (error) {
        console.error('Error filtering data with date range:', error);
        if (selectedReport === "Orders Report") {
          setOrderDetails([]);
        }
      }
    }
    handleClose();
  };

  // Add this helper function to handle date selection
  const handleDateSelect = (newDate: Dayjs | null, isStart: boolean) => {
    if (isStart) {
      setDateRange([newDate, dateRange[1]]);
    } else {
      if (dateRange[0] && newDate && newDate.isBefore(dateRange[0])) {
        // If end date is before start date, swap them
        setDateRange([newDate, dateRange[0]]);
      } else {
        setDateRange([dateRange[0], newDate]);
      }

      // If we have both dates, trigger the filter
      if (dateRange[0] && newDate) {
        handleDateRangeSelect([dateRange[0], newDate]);
      }
    }
  };

  const renderContent = () => {
    switch (selectedReport) {
      case "Orders Report":
        return (
          <>
            {/* Detailed Orders Table Header */}
            <div className="grid grid-cols-8 bg-[#f9f9f9] p-4" style={{ borderBottom: '1px solid #eaeaea' }}>
              <div className="text-[14px] leading-[22px] font-sans text-[#666]">Customer Name</div>
              <div className="text-[14px] leading-[22px] font-sans text-[#666]">Phone Number</div>
              <div className="text-[14px] leading-[22px] font-sans text-[#666]">Courier Name</div>
              <div className="text-[14px] leading-[22px] font-sans text-[#666]">Products</div>
              <div className="text-[14px] leading-[22px] font-sans text-[#666]">Order Date</div>
              <div className="text-[14px] leading-[22px] font-sans text-[#666]">
                Food Price
                <br />
                GH₵
              </div>
              <div className="text-[14px] leading-[22px] font-sans text-[#666]">
                Delivery Price
                <br />
                GH₵
              </div>
              <div className="text-[14px] leading-[22px] font-sans text-[#666]">Total Price GH₵</div>
            </div>

            {/* Detailed Orders Table Body */}
            {orderDetails.map((order, index) => (
              <div 
                key={index}
                className="grid grid-cols-8 p-4 hover:bg-[#f9f9f9]"
                style={{ borderBottom: '1px solid #eaeaea' }}
              >
                <div className="text-[14px] leading-[22px] font-sans text-[#444]">{order.customerName}</div>
                <div className="text-[14px] leading-[22px] font-sans text-[#444]">{order.customerPhone}</div>
                <div className="text-[14px] leading-[22px] font-sans text-[#444]">{order.courierName}</div>
                <div className="text-[14px] leading-[22px] font-sans text-[#444]">
                  {order.products.map((product, idx) => (
                    <div key={idx}>
                      {product.name} (x{product.quantity})
                    </div>
                  ))}
                </div>
                <div className="text-[14px] leading-[22px] font-sans text-[#444]">{order.orderDate}</div>
                <div className="text-[14px] leading-[22px] font-sans text-[#444]">{order.amount}</div>
                <div className="text-[14px] leading-[22px] font-sans text-[#444]">{order.deliveryPrice}</div>
                <div className="text-[14px] leading-[22px] font-sans text-[#444]">{order.totalPrice}</div>
                
              </div>
            ))}
          </>
        );
      case "Top Sold Items":
        return (
          <>
            {/* Most Selling Items Table Header */}
            <div className="grid grid-cols-5 bg-[#f9f9f9] p-4" style={{ borderBottom: '1px solid #eaeaea' }}>
              <div className="text-[14px] leading-[22px] font-sans text-[#666]">Item Name</div>
              <div className="text-[14px] leading-[22px] font-sans text-[#666]">Quantity Sold</div>
              <div className="text-[14px] leading-[22px] font-sans text-[#666]">Total Revenue</div>
              <div className="text-[14px] leading-[22px] font-sans text-[#666]">Average Price</div>
              <div className="text-[14px] leading-[22px] font-sans text-[#666]">Last Sold</div>
            </div>

            {/* Most Selling Items Table Body */}
            {mostSellingItems.map((item, index) => (
              <div 
                key={index}
                className="grid grid-cols-5 p-4 hover:bg-[#f9f9f9]"
                style={{ borderBottom: '1px solid #eaeaea' }}
              >
                <div className="text-[14px] leading-[22px] font-sans text-[#444]">{item.name}</div>
                <div className="text-[14px] leading-[22px] font-sans text-[#444]">{item.totalQuantitySold}</div>
                <div className="text-[14px] leading-[22px] font-sans text-[#444]">{item.totalRevenue.toFixed(2)} GHS</div>
                <div className="text-[14px] leading-[22px] font-sans text-[#444]">{item.averagePrice.toFixed(2)} GHS</div>
                <div className="text-[14px] leading-[22px] font-sans text-[#444]">{item.lastSoldDate}</div>
              </div>
            ))}
          </>
        );
      case "Customer Report":
        return (
          <>
            {/* Customer Report Table Header */}
            <div className="grid grid-cols-7 bg-[#f9f9f9] p-4" style={{ borderBottom: '1px solid #eaeaea' }}>
              <div className="text-[14px] leading-[22px] font-sans text-[#666]">Phone Number</div>
              <div className="text-[14px] leading-[22px] font-sans text-[#666]">Customer Name</div>
              <div className="text-[14px] leading-[22px] font-sans text-[#666]">Total Orders</div>
              <div className="text-[14px] leading-[22px] font-sans text-[#666]">Total Spent</div>
              <div className="text-[14px] leading-[22px] font-sans text-[#666]">Last Order</div>
              <div className="text-[14px] leading-[22px] font-sans text-[#666]">Top Sold Items</div>
            </div>

            {/* Customer Report Table Body */}
            {customerReports.map((customer, index) => (
              <div 
                key={index}
                className="grid grid-cols-7 p-4 hover:bg-[#f9f9f9]"
                style={{ borderBottom: '1px solid #eaeaea' }}
              >
                <div className="text-[14px] leading-[22px] font-sans text-[#444]">{customer.phoneNumber}</div>
                <div className="text-[14px] leading-[22px] font-sans text-[#444]">{customer.customerName}</div>
                <div className="text-[14px] leading-[22px] font-sans text-[#444]">{customer.totalOrders}</div>
                <div className="text-[14px] leading-[22px] font-sans text-[#444]">{customer.totalSpent.toFixed(2)} GHS</div>
                <div className="text-[14px] leading-[22px] font-sans text-[#444]">{customer.lastOrderDate}</div>
                <div className="text-[14px] leading-[22px] font-sans text-[#444]">
                  {customer.mostOrderedItems.map((item, i) => (
                    <span key={i}>
                      {item.name} ({item.quantity}x)
                      {i < customer.mostOrderedItems.length - 1 ? '; ' : ''}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </>
        );
      case "Delivery Report":
        return (
          <>
            <div className="grid grid-cols-6 bg-[#f9f9f9] p-4" style={{ borderBottom: '1px solid #eaeaea' }}>
              <div className="text-[14px] leading-[22px] font-sans text-[#666]">Courier Name</div>
              <div className="text-[14px] leading-[22px] font-sans text-[#666]">Total Deliveries</div>
              <div className="text-[14px] leading-[22px] font-sans text-[#666]">Total Earnings</div>
              <div className="text-[14px] leading-[22px] font-sans text-[#666]">Avg Delivery Time</div>
              <div className="text-[14px] leading-[22px] font-sans text-[#666]">Completion Rate</div>
              <div className="text-[14px] leading-[22px] font-sans text-[#666]">Last Delivery</div>
            </div>

            {deliveryReports.map((report, index) => (
              <div 
                key={index}
                className="grid grid-cols-6 p-4 hover:bg-[#f9f9f9]"
                style={{ borderBottom: '1px solid #eaeaea' }}
              >
                <div className="text-[14px] leading-[22px] font-sans text-[#444]">{report.courierName}</div>
                <div className="text-[14px] leading-[22px] font-sans text-[#444]">{report.totalDeliveries}</div>
                <div className="text-[14px] leading-[22px] font-sans text-[#444]">{report.totalEarnings.toFixed(2)} GHS</div>
                <div className="text-[14px] leading-[22px] font-sans text-[#444]">{report.averageDeliveryTime}</div>
                <div className="text-[14px] leading-[22px] font-sans text-[#444]">{report.completionRate.toFixed(1)}%</div>
                <div className="text-[14px] leading-[22px] font-sans text-[#444]">{report.lastDeliveryDate}</div>
              </div>
            ))}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full w-full bg-white m-0 p-0">
      <div className="p-3 ml-4 mr-4">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-4">
          <b className="text-[18px] font-sans">
            Reports Template
          </b>
          
          {/* Filter Controls */}
          <div className="flex items-center gap-4">
            {/* Report Type Dropdown */}
            <div className="relative">
              <select
                value={selectedReport || ''}
                onChange={(e) => handleReportClick(e.target.value)}
                className="appearance-none bg-white border border-[rgba(167,161,158,0.1)] rounded-md px-4 py-2 pr-8 text-[14px] font-sans text-[#666] cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-0 focus:border-[rgba(167,161,158,0.1)]"
              >
                <option value="">Select Report Type</option>
                {availableReports.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>

            {/* Branch Filter - Only show for Admin */}
            {userProfile?.role === 'Admin' && (
              <BranchFilter 
                restaurantId={userProfile.restaurantId || undefined}
                onBranchSelect={handleBranchSelect}
                selectedBranchId={selectedBranchId}
                hideAllBranches={true}
                className="appearance-none bg-white border border-[rgba(167,161,158,0.1)] rounded-md px-4 py-2 pr-8 text-[14px] font-sans text-[#666] cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-0 focus:border-[rgba(167,161,158,0.1)]"
              />
            )}

            {/* Date Range Picker - Only show for Orders Report */}
            {selectedReport === "Orders Report" && (
              <div className="relative">
                <div 
                  onClick={handleDateClick}
                  className="flex items-center gap-2 px-3 py-2 border border-[rgba(167,161,158,0.1)] rounded-md cursor-pointer hover:bg-gray-50"
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
                  <span className="text-[14px] font-sans text-[#666]">
                    {dateRange[0] && dateRange[1] 
                      ? `${dayjs(dateRange[0]).format('DD MMM')} - ${dayjs(dateRange[1]).format('DD MMM YYYY')}`
                      : 'Select Date Range'
                    }
                  </span>
                </div>

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
                      '& .MuiPickersDay-root.Mui-inRange': {
                        backgroundColor: '#fff3e0',
                        '&:hover': {
                          backgroundColor: '#ffe0b2',
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
                    <div className="flex p-4">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-600 mb-2">Start Date</div>
                        <DateCalendar 
                          value={dateRange[0]}
                          onChange={(newDate) => handleDateSelect(newDate, true)}
                          sx={{
                            fontFamily: 'Inter',
                            '& .MuiTypography-root': {
                              fontFamily: 'Inter',
                            },
                          }}
                        />
                      </div>
                      <div className="border-l border-gray-200" />
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-600 mb-2">End Date</div>
                        <DateCalendar 
                          value={dateRange[1]}
                          minDate={dateRange[0] || undefined}
                          onChange={(newDate) => handleDateSelect(newDate, false)}
                          sx={{
                            fontFamily: 'Inter',
                            '& .MuiTypography-root': {
                              fontFamily: 'Inter',
                            },
                          }}
                        />
                      </div>
                    </div>
                  </Popover>
                </LocalizationProvider>
              </div>
            )}

            {/* Download Button */}
            {selectedReport && (
              <>
                <div
                  className="flex items-center gap-2 px-4 py-2 rounded-[4px] bg-[#313131] border-[#737373] border-[1px] border-solid 
                            cursor-pointer text-[13px] text-[#cbcbcb]"
                  onClick={handleDownloadClick}
                >
                  <MdOutlineFileDownload className="w-[18px] h-[18px]" />
                  <span className="font-sans text-white">Download</span>
                </div>

                {/* Download Format Menu */}
                <Menu
                  anchorEl={downloadAnchorEl}
                  open={Boolean(downloadAnchorEl)}
                  onClose={handleDownloadClose}
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
                  }}
                >
                  <MenuItem 
                    onClick={() => handleDownloadFormat('PDF')}
                    sx={{ 
                      fontSize: '14px',
                      fontFamily: 'Inter',
                      '&:hover': { backgroundColor: '#fff3e0' }
                    }}
                  >
                    Download as PDF
                  </MenuItem>
                  <MenuItem 
                    onClick={() => handleDownloadFormat('CSV')}
                    sx={{ 
                      fontSize: '14px',
                      fontFamily: 'Inter',
                      '&:hover': { backgroundColor: '#fff3e0' }
                    }}
                  >
                    Download as CSV
                  </MenuItem>
                </Menu>
              </>
            )}
          </div>
        </div>

        {/* Add this conditional render */}
        {!selectedReport && (
          <div className="w-full text-center mt-8">
            <p className="text-gray-500 text-sm font-sans">
              Select a report type from the options above
            </p>
          </div>
        )}

        {/* Table Section */}
        <div className="w-full border-[1px] border-solid border-[rgba(167,161,158,0.1)] rounded-lg overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Reports;

