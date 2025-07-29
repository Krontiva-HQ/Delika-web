import { FunctionComponent, useState, useEffect, useCallback } from "react";
import { IoMdAdd } from "react-icons/io";
import { MdOutlineFileDownload } from "react-icons/md";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import useMonthlyOrderData from '../../hooks/useMonthlyOrderData';
import { useUserProfile } from '../../hooks/useUserProfile';
import { api } from '../../services/api';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Popover, Menu, MenuItem, Pagination } from '@mui/material';
import { Dayjs } from 'dayjs';
import { useMenuCategories } from '../../hooks/useMenuCategories';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { jsPDF as JsPDFType } from 'jspdf';
import { useBranches } from '../../hooks/useBranches';
import BranchFilter from '../../components/BranchFilter';
import { getAvailableReports, hasAllSpecialPermissions } from '../../permissions/DashboardPermissions';

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
    requiresPermissions: false
  },
  {
    id: 5,
    name: "Transaction Report",
    date: "All Time",
    format: "PDF",
    status: "Active",
    requiresPermissions: false
  }
];

// Add new interface for detailed order
interface OrderDetail {
  customerName: string;
  customerPhone: string;
  amount: number;
  courierName: string;
  courierPhone: string;
  deliveryPrice: number;
  totalPrice: number;
  dropOffName: string;
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
  courierPhone: string;
  customerName: string;
  orderDate: string;
  courierName: string;
  customerPhone: string;
  deliveryPrice: number;
  deliveryLocation: string;
  totalDeliveries?: number;
  totalEarnings?: number;
  averageDeliveryTime?: string;
  completionRate?: number;
  dropOffName?: string;
}

// Update the interface
interface TransactionBreakdown {
  date: string;
  amount: number;
  orderId: string;
}

interface TransactionReport {
  paymentMethod: string;
  totalTransactions: number;
  totalAmount: number;
  averageAmount: number;
  lastTransactionDate: string;
  transactionBreakdown: TransactionBreakdown[];
}

// First, add this interface for transaction summary
interface TransactionSummary {
  totalTransactions: number;
  totalRevenue: number;
  cashTransactions: number;
  momoTransactions: number;
  cardTransactions: number;
  cashAmount: number;
  momoAmount: number;
  cardAmount: number;
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
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [transactionReports, setTransactionReports] = useState<TransactionReport[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [calendarMode, setCalendarMode] = useState<'start' | 'end'>('start');

  const { userProfile, restaurantData } = useUserProfile();
  const { branches, isLoading: branchesLoading } = useBranches(userProfile?.restaurantId ?? null);
  const { categories } = useMenuCategories();

  // Replace the manual report filtering with the one from permissions
  const availableReports = getAvailableReports(restaurantData);

  // Remove the manual permission check and use the helper function
  const hasAllPermissions = hasAllSpecialPermissions(restaurantData);

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
    if (selectedReport && userProfile && selectedBranchId) {
      setIsLoading(true);
      const branchId = selectedBranchId || userProfile?.branchId;
      fetchReportData(selectedReport, branchId, dateRange[0], dateRange[1]);
    }
  }, [selectedBranchId]);

  const fetchReportData = useCallback(async (
    reportType: string, 
    branchId: string, 
    startDate: Dayjs | null, 
    endDate: Dayjs | null
  ) => {
    setIsLoading(true);
    
    try {
      const params = {
        restaurantId: userProfile?.restaurantId,
        branchId: branchId,
        ...(startDate && endDate ? {
          startDate: startDate.format('YYYY-MM-DD'),
          endDate: endDate.format('YYYY-MM-DD')
        } : {})
      };

      const response = await api.get('/get/all/orders/per/branch', { params });
      
      // If we have a date range, filter the response data
      let filteredData = response.data;
      if (startDate && endDate) {
        filteredData = response.data.filter((order: any) => {
          const orderDate = dayjs(order.orderDate);
          return orderDate.isSameOrAfter(startDate, 'day') && 
                 orderDate.isSameOrBefore(endDate, 'day');
        });
      }

      switch (reportType) {
        case "Orders Report":
          const formattedOrders: OrderDetail[] = filteredData.map((order: any) => ({
            customerName: order.customerName,
            customerPhone: order.customerPhoneNumber,
            amount: parseFloat(order.orderPrice || '0'),
            courierName: order.courierName,
            deliveryPrice: parseFloat(order.deliveryPrice || '0'),
            totalPrice: parseFloat(order.totalPrice || '0'),
            orderDate: order.orderDate,
            products: order.products
          }));
          setOrderDetails(formattedOrders);
          break;

        case "Top Sold Items":
          // Process orders to get most selling items
          const itemsMap = new Map<string, {
            totalQuantity: number;
            totalRevenue: number;
            lastSoldDate: string;
            averagePrice: number;
          }>();

          filteredData.forEach((order: any) => {
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
          break;

        case "Customer Report":
          // Process customer data with the filtered orders
          const customersMap = new Map<string, {
            name: string;
            orders: number;
            totalSpent: number;
            lastOrderDate: string;
            items: Map<string, number>;
          }>();

          filteredData.forEach((order: any) => {
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
          break;

        case "Delivery Report":
          // Process orders to get delivery statistics
          const deliveryStats = filteredData.map((order: any) => ({
            courierPhone: order.courierPhoneNumber || 'N/A',
            customerName: order.customerName,
            orderDate: new Date(order.orderDate).toLocaleDateString(),
            courierName: order.courierName || 'N/A',
            deliveryPrice: parseFloat(order.deliveryPrice || 0),
            deliveryLocation: order.dropOff?.[0]?.toAddress || order.dropoffName || 'N/A'
          }));

          setDeliveryReports(deliveryStats);
          break;

        case "Transaction Report":
          // Process orders to get transaction statistics
          const transactionMap = new Map<string, {
            totalTransactions: number;
            totalAmount: number;
            lastTransactionDate: string;
            transactions: TransactionBreakdown[];
          }>();

          filteredData.forEach((order: {
            orderDate: string;
            orderPrice: string;
            orderNumber: number;
            payNow: boolean;
            payLater: boolean;
            payVisaCard: boolean;
          }) => {
            let paymentMethod = 'Unknown';
            if (order.payNow) {
              paymentMethod = 'Cash';
            } else if (order.payLater) {
              paymentMethod = 'Momo';
            } else if (order.payVisaCard) {
              paymentMethod = 'Visa Card';
            }

            const existing = transactionMap.get(paymentMethod) || {
              totalTransactions: 0,
              totalAmount: 0,
              lastTransactionDate: order.orderDate,
              transactions: [] as TransactionBreakdown[]
            };

            const amount = parseFloat(order.orderPrice || '0');
            
            existing.totalTransactions += 1;
            existing.totalAmount += amount;
            existing.lastTransactionDate = new Date(order.orderDate) > new Date(existing.lastTransactionDate)
              ? order.orderDate
              : existing.lastTransactionDate;
            
            const transaction: TransactionBreakdown = {
              date: order.orderDate,
              amount: amount,
              orderId: order.orderNumber?.toString() || 'N/A'
            };
            
            existing.transactions.push(transaction);

            transactionMap.set(paymentMethod, existing);
          });

          const transactionStats: TransactionReport[] = Array.from(transactionMap.entries())
            .map(([paymentMethod, data]) => ({
              paymentMethod,
              totalTransactions: data.totalTransactions,
              totalAmount: data.totalAmount,
              averageAmount: data.totalAmount / data.totalTransactions,
              lastTransactionDate: new Date(data.lastTransactionDate).toLocaleDateString(),
              transactionBreakdown: data.transactions.sort((a, b) => 
                new Date(b.date).getTime() - new Date(a.date).getTime()
              )
            }));

          setTransactionReports(transactionStats);
          break;
      }
    } catch (error) {
      setOrderDetails([]);
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.restaurantId]);

  // Update handleBranchSelect to properly use existing date range
  const handleBranchSelect = useCallback((branchId: string) => {
    setSelectedBranchId(branchId);
    if (selectedReport) {
      // Always use the current dateRange, whether it's set or not
      fetchReportData(
        selectedReport, 
        branchId, 
        dateRange[0],  // Use existing date range even if null
        dateRange[1]   // Use existing date range even if null
      );
    }
  }, [selectedReport, dateRange, fetchReportData]);

  // Update date range handler
  const handleDateRangeChange = useCallback((newDateRange: [Dayjs | null, Dayjs | null]) => {
    setDateRange(newDateRange);
    if (selectedReport && selectedBranchId && newDateRange[0] && newDateRange[1]) {
      fetchReportData(selectedReport, selectedBranchId, newDateRange[0], newDateRange[1]);
    }
  }, [selectedReport, selectedBranchId, fetchReportData]);

  // Update handleReportClick
  const handleReportClick = async (reportName: string) => {
    // Always reset date range and payment method filter when switching reports
    if (reportName !== selectedReport) {
      setDateRange([null, null]);
      setSelectedPaymentMethod('all');
    }
    
    setSelectedReport(reportName);
    
    // Immediately fetch data for the new report without date range
    const branchId = selectedBranchId || userProfile?.branchId;
    await fetchReportData(reportName, branchId, null, null);
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

    // For Orders Report, only allow CSV download
    if (selectedReport === "Orders Report") {
      format = 'CSV';
    }

    if (format === 'CSV') {
      let headers: string[] = [];
      let csvData: any[][] = [];

      switch (selectedReport) {
        case "Orders Report":
          headers = ["Customer Name", "Phone", "Amount", "Total", "Date", "Products"];
          csvData = orderDetails.map(order => [
            order.customerName,
            order.customerPhone,
            `GH₵${order.amount?.toFixed(2)}`,
            `GH₵${order.totalPrice?.toFixed(2)}`,
            order.orderDate,
            order.products.map(p => 
              `${p.name} (x${p.quantity}) - GH₵${Number(p.price).toFixed(2)}`
            ).join('; ')
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
          headers = ["Courier Phone", "Customer Name", "Order Date", "Courier Name", "Delivery Price", "Delivery Location"];
          csvData = deliveryReports.map(report => [
            report.courierPhone,
            report.customerName,
            report.orderDate,
            report.courierName,
            report.deliveryPrice.toFixed(2),
            report.deliveryLocation
          ]);
          break;

        case "Transaction Report":
          headers = ["Payment Method", "Total Transactions", "Total Amount GH₵", "Average Amount GH₵", "Last Transaction"];
          csvData = transactionReports.map(report => [
            report.paymentMethod,
            report.totalTransactions,
            report.totalAmount.toFixed(2),
            report.averageAmount.toFixed(2),
            report.lastTransactionDate
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
      // Only show PDF option for non-Orders Reports
      if (selectedReport !== "Orders Report") {
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
              headers = ["Customer", "Phone", "Amount", "Total", "Date", "Products"];
              data = orderDetails.map(order => [
                order.customerName,
                order.customerPhone,
                order.amount,
                order.totalPrice,
                order.orderDate,
                order.products.map(p => 
                  `${p.name} (x${p.quantity}) - GH₵${Number(p.price).toFixed(2)}`
                ).join('\n')
              ]);
              break;

            case "Top Sold Items":
              headers = ["Item", "Qty Sold", "Revenue", "Avg Price"];
              data = mostSellingItems.map(item => [
                item.name,
                item.totalQuantitySold,
                `${item.totalRevenue.toFixed(2)} GH₵`,
                `${item.averagePrice.toFixed(2)} GH₵`
              ]);
              break;

            case "Customer Report":
              headers = ["Customer", "Orders", "Total Spent", "Avg Order"];
              data = customerReports.map(customer => [
                `${customer.customerName}\n${customer.phoneNumber}`,
                customer.totalOrders,
                `${customer.totalSpent.toFixed(2)} GH₵`,
                `${customer.averageOrderValue.toFixed(2)} GH₵`
              ]);
              break;

            case "Delivery Report":
              headers = ["Courier Name", "Courier Phone", "Customer Name", "Order Date", "Delivery Price", "Delivery Location"];
              data = deliveryReports.map(report => [
                report.courierName,
                report.courierPhone,
                report.customerName,
                report.orderDate,
                report.deliveryPrice.toFixed(2),
                report.deliveryLocation
              ]);
              break;

            case "Transaction Report":
              headers = ["Payment Method", "Total Transactions", "Total Amount GH₵", "Average Amount GH₵", "Last Transaction"];
              data = transactionReports.map(report => [
                report.paymentMethod,
                report.totalTransactions,
                `${report.totalAmount.toFixed(2)} GH₵`,
                `${report.averageAmount.toFixed(2)} GH₵`,
                report.lastTransactionDate
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
                overflow: 'linebreak',
                cellWidth: 'wrap',
                lineHeight: 1.2
              },
              columnStyles: {
                5: { 
                  cellWidth: 'auto',
                  whiteSpace: 'pre-line'
                }
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
          // You might want to show an error message to the user here
        }
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

  const handleDateSelect = (newDate: Dayjs | null, isStart: boolean) => {
    let newDateRange: [Dayjs | null, Dayjs | null];
    
    if (isStart) {
      newDateRange = [newDate, dateRange[1]];
    } else {
      if (dateRange[0] && newDate && newDate.isBefore(dateRange[0])) {
        newDateRange = [newDate, dateRange[0]];
      } else {
        newDateRange = [dateRange[0], newDate];
      }
    }
    
    setDateRange(newDateRange);
    
    // Immediately fetch data if we have both dates and a selected report
    if (newDateRange[0] && newDateRange[1] && selectedReport) {
      const branchId = selectedBranchId || userProfile?.branchId;
      fetchReportData(selectedReport, branchId, newDateRange[0], newDateRange[1]);
      handleClose();
    }
  };

  // Update handleDateRangeSelect to also fetch immediately
  const handleDateRangeSelect = async ([start, end]: [Dayjs | null, Dayjs | null]) => {
    setDateRange([start, end]);
    
    if (start && end && selectedReport) {
      const branchId = selectedBranchId || userProfile?.branchId;
      fetchReportData(selectedReport, branchId, start, end);
    }
    handleClose();
  };

  const renderDateFilter = () => {
    if (selectedReport === "Orders Report" || selectedReport === "Delivery Report") {
      return (
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
            <span className="text-[14px] font-sans text-[#666] whitespace-nowrap">
              {dateRange[0] && dateRange[1] 
                ? `${dayjs(dateRange[0]).format('DD MMM')} - ${dayjs(dateRange[1]).format('DD MMM YYYY')}`
                : dateRange[0]
                ? `${dayjs(dateRange[0]).format('DD MMM YYYY')} - Select End`
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
                  width: 'fit-content',
                },
              }}
            >
              <div className="p-4">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm font-medium text-gray-600">
                      {calendarMode === 'start' ? 'Select Start Date' : 'Select End Date'}
                    </div>
                    {dateRange[0] && calendarMode === 'end' && (
                      <button
                        onClick={() => setCalendarMode('start')}
                        className="text-xs text-[#fe5b18] hover:text-[#e54d0e] font-sans"
                      >
                        Change Start Date
                      </button>
                    )}
                  </div>

                  {calendarMode === 'start' ? (
                    <DateCalendar 
                      value={dateRange[0]}
                      onChange={(newDate) => {
                        handleDateSelect(newDate, true);
                        setCalendarMode('end');
                      }}
                      sx={{
                        width: '100%',
                        maxWidth: '320px',
                        '& .MuiPickersDay-root.Mui-selected': {
                          backgroundColor: '#fe5b18',
                          '&:hover': { backgroundColor: '#fe5b18' }
                        },
                        '& .MuiTypography-root': {
                          fontFamily: 'Inter',
                        },
                      }}
                    />
                  ) : (
                    <DateCalendar 
                      value={dateRange[1]}
                      minDate={dateRange[0] || undefined}
                      onChange={(newDate) => {
                        handleDateSelect(newDate, false);
                        handleClose();
                        setCalendarMode('start'); // Reset for next time
                      }}
                      sx={{
                        width: '100%',
                        maxWidth: '320px',
                        '& .MuiPickersDay-root.Mui-selected': {
                          backgroundColor: '#fe5b18',
                          '&:hover': { backgroundColor: '#fe5b18' }
                        },
                        '& .MuiTypography-root': {
                          fontFamily: 'Inter',
                        },
                      }}
                    />
                  )}
                </div>
              </div>
            </Popover>
          </LocalizationProvider>
        </div>
      );
    } else if (selectedReport === "Transaction Report") {
      return (
        <div className="flex items-center gap-4">
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
              <span className="text-[14px] font-sans text-[#666] whitespace-nowrap">
                {selectedDate ? selectedDate.format('DD MMM YYYY') : 'Select Date'}
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
                    width: 'fit-content',
                  },
                }}
              >
                <div className="p-4">
                  <DateCalendar
                    value={selectedDate}
                    onChange={(newDate) => {
                      setSelectedDate(newDate);
                      if (newDate) {
                        handleDateRangeSelect([newDate, newDate]);
                      }
                      handleClose();
                    }}
                    sx={{
                      width: '100%',
                      maxWidth: '320px',
                      '& .MuiPickersDay-root.Mui-selected': {
                        backgroundColor: '#fe5b18',
                        '&:hover': { backgroundColor: '#fe5b18' }
                      },
                      '& .MuiTypography-root': {
                        fontFamily: 'Inter',
                      },
                    }}
                  />
                </div>
              </Popover>
            </LocalizationProvider>
          </div>
        </div>
      );
    }
    return null;
  };

  // Pagination helper function
  const paginateData = <T extends any>(data: T[]): T[] => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  // Handle page change
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const renderPagination = (totalItems: number) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    return totalPages > 1 ? (
      <div className="flex justify-center py-4">
        <Pagination 
          count={totalPages} 
          page={page} 
          onChange={handlePageChange}
          color="primary"
          sx={{
            '& .MuiPaginationItem-root': {
              fontFamily: 'Inter',
            },
            '& .Mui-selected': {
              backgroundColor: '#fe5b18 !important',
              color: 'white',
            },
          }}
        />
      </div>
    ) : null;
  };

  const toggleRowExpansion = (index: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(index)) {
      newExpandedRows.delete(index);
    } else {
      newExpandedRows.add(index);
    }
    setExpandedRows(newExpandedRows);
  };

  // Add payment method filter handler
  const handlePaymentMethodChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPaymentMethod(event.target.value);
  };

  const renderContent = () => {
    switch (selectedReport) {
      case "Orders Report":
        return (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Orders</div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">{orderDetails.length}</div>
                <div className="text-sm text-[#fe5b18] mt-1">
                  View Details
                </div>
              </div>
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Revenue</div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  GH₵ {orderDetails.reduce((sum, order) => sum + (order.totalPrice || 0), 0).toFixed(2)}
                </div>
                <div className="text-sm text-[#fe5b18] mt-1">
                  View Details
                </div>
              </div>
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Average Order Value</div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  GH₵ {(orderDetails.reduce((sum, order) => sum + (order.totalPrice || 0), 0) / (orderDetails.length || 1)).toFixed(2)}
                </div>
                <div className="text-sm text-[#fe5b18] mt-1">
                  View Details
                </div>
              </div>
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Delivery Revenue</div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  GH₵ {orderDetails.reduce((sum, order) => sum + (order.deliveryPrice || 0), 0).toFixed(2)}
                </div>
                <div className="text-sm text-[#fe5b18] mt-1">
                  View Details
                </div>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="grid grid-cols-7 bg-gray-50 dark:bg-[#2a2a2a] p-4">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Customer Name</div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Phone Number</div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Courier Name</div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Order Date</div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Food Price GH₵</div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Delivery Price GH₵</div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Price GH₵</div>
              </div>

              {paginateData(orderDetails).map((order, index) => (
                <div key={index} className="border-t border-gray-100 dark:border-gray-800">
                  <div 
                    className="grid grid-cols-7 p-4 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] cursor-pointer transition-colors"
                    onClick={() => toggleRowExpansion(index)}
                  >
                    <div className="text-sm text-gray-900 dark:text-gray-100">{order.customerName}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{order.customerPhone}</div>
                    <div className="text-sm text-gray-900 dark:text-gray-100">{order.courierName}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{order.orderDate}</div>
                    <div className="text-sm text-gray-900 dark:text-gray-100">{order.amount?.toFixed(2) || '0.00'}</div>
                    <div className="text-sm text-gray-900 dark:text-gray-100">{order.deliveryPrice?.toFixed(2) || '0.00'}</div>
                    <div className="text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      {order.totalPrice?.toFixed(2) || '0.00'}
                      <svg 
                        className={`w-4 h-4 transition-transform ${expandedRows.has(index) ? 'transform rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {expandedRows.has(index) && (
                    <div className="bg-gray-50 dark:bg-[#2a2a2a] p-4 border-t border-gray-100 dark:border-gray-800">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Products:</div>
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-4 bg-white dark:bg-[#1a1a1a] p-2 rounded-md">
                          <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Product Name</div>
                          <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Quantity</div>
                          <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Unit Price (GH₵)</div>
                        </div>

                        {order.products.map((product, idx) => (
                          <div 
                            key={idx} 
                            className="grid grid-cols-3 gap-4 bg-white dark:bg-[#1a1a1a] p-2 rounded-md items-center"
                          >
                            <div className="text-sm text-gray-900 dark:text-gray-100">{product.name}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded w-fit">
                              x{product.quantity}
                            </div>
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                              {Number(product.price).toFixed(2) || '0.00'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {renderPagination(orderDetails.length)}
          </>
        );
      case "Top Sold Items":
        const totalQuantitySold = mostSellingItems.reduce((sum, item) => sum + item.totalQuantitySold, 0);
        const totalRevenue = mostSellingItems.reduce((sum, item) => sum + item.totalRevenue, 0);
        const averagePrice = totalQuantitySold > 0 ? totalRevenue / totalQuantitySold : 0;

        return (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Items Sold</div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">{totalQuantitySold}</div>
                <div className="text-sm text-[#fe5b18] mt-1">
                  View Details
                </div>
              </div>
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Revenue</div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  GH₵ {totalRevenue.toFixed(2)}
                </div>
                <div className="text-sm text-[#fe5b18] mt-1">
                  View Details
                </div>
              </div>
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Average Price</div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  GH₵ {averagePrice.toFixed(2)}
                </div>
                <div className="text-sm text-[#fe5b18] mt-1">
                  View Details
                </div>
              </div>
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Unique Items</div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {mostSellingItems.length}
                </div>
                <div className="text-sm text-[#fe5b18] mt-1">
                  View Details
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="grid grid-cols-4 bg-gray-50 dark:bg-[#2a2a2a] p-4">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Item Name</div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Quantity Sold</div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Revenue GH₵</div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Last Sold</div>
              </div>

              {paginateData(mostSellingItems).map((item, index) => (
                <div 
                  key={index}
                  className="grid grid-cols-4 p-4 border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"
                >
                  <div className="text-sm text-gray-900 dark:text-gray-100">{item.name}</div>
                  <div className="text-sm text-gray-900 dark:text-gray-100">{item.totalQuantitySold}</div>
                  <div className="text-sm text-gray-900 dark:text-gray-100">{item.totalRevenue.toFixed(2)}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{item.lastSoldDate}</div>
                </div>
              ))}
            </div>

            {renderPagination(mostSellingItems.length)}
          </>
        );
      case "Customer Report":
        const totalCustomers = customerReports.length;
        const totalCustomerOrders = customerReports.reduce((sum, customer) => sum + customer.totalOrders, 0);
        const totalCustomerSpent = customerReports.reduce((sum, customer) => sum + customer.totalSpent, 0);
        const averageOrderValue = totalCustomerOrders > 0 ? totalCustomerSpent / totalCustomerOrders : 0;

        return (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Customers</div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">{totalCustomers}</div>
                <div className="text-sm text-[#fe5b18] mt-1">
                  View Details
                </div>
              </div>
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Orders</div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">{totalCustomerOrders}</div>
                <div className="text-sm text-[#fe5b18] mt-1">
                  View Details
                </div>
              </div>
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Revenue</div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  GH₵ {totalCustomerSpent.toFixed(2)}
                </div>
                <div className="text-sm text-[#fe5b18] mt-1">
                  View Details
                </div>
              </div>
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Average Order Value</div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  GH₵ {averageOrderValue.toFixed(2)}
                </div>
                <div className="text-sm text-[#fe5b18] mt-1">
                  View Details
                </div>
              </div>
            </div>

            {/* Customers Table */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="grid grid-cols-5 bg-gray-50 dark:bg-[#2a2a2a] p-4">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Customer Name</div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Phone Number</div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Orders</div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Spent GH₵</div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Last Order</div>
              </div>

              {paginateData(customerReports).map((customer, index) => (
                <div 
                  key={index}
                  className="grid grid-cols-5 p-4 border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"
                >
                  <div className="text-sm text-gray-900 dark:text-gray-100">{customer.customerName}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{customer.phoneNumber}</div>
                  <div className="text-sm text-gray-900 dark:text-gray-100">{customer.totalOrders}</div>
                  <div className="text-sm text-gray-900 dark:text-gray-100">{customer.totalSpent.toFixed(2)}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{customer.lastOrderDate}</div>
                </div>
              ))}
            </div>

            {renderPagination(customerReports.length)}
          </>
        );
      case "Delivery Report":
        const totalDeliveries = deliveryReports.length;
        const totalDeliveryRevenue = deliveryReports.reduce((sum, report) => sum + report.deliveryPrice, 0);
        const averageDeliveryPrice = totalDeliveries > 0 ? totalDeliveryRevenue / totalDeliveries : 0;
        const uniqueRiders = new Set(deliveryReports.map(report => report.courierPhone)).size;

        return (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Deliveries</div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">{totalDeliveries}</div>
                <div className="text-sm text-[#fe5b18] mt-1">
                  View Details
                </div>
              </div>
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Revenue</div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  GH₵ {totalDeliveryRevenue.toFixed(2)}
                </div>
                <div className="text-sm text-[#fe5b18] mt-1">
                  View Details
                </div>
              </div>
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Average Delivery Price</div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  GH₵ {averageDeliveryPrice.toFixed(2)}
                </div>
                <div className="text-sm text-[#fe5b18] mt-1">
                  View Details
                </div>
              </div>
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Active Riders</div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">{uniqueRiders}</div>
                <div className="text-sm text-[#fe5b18] mt-1">
                  View Details
                </div>
              </div>
            </div>

            {/* Delivery Table */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="grid grid-cols-6 bg-gray-50 dark:bg-[#2a2a2a] p-4">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Courier Name</div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Courier Phone</div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Customer Name</div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Order Date</div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Delivery Price GH₵</div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Delivery Location</div>
              </div>

              {paginateData(deliveryReports).map((report, index) => (
                <div 
                  key={index}
                  className="grid grid-cols-6 p-4 border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"
                >
                  <div className="text-sm text-gray-900 dark:text-gray-100">{report.courierName}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{report.courierPhone}</div>
                  <div className="text-sm text-gray-900 dark:text-gray-100">{report.customerName}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{report.orderDate}</div>
                  <div className="text-sm text-gray-900 dark:text-gray-100">{report.deliveryPrice.toFixed(2)}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{report.deliveryLocation}</div>
                </div>
              ))}
            </div>

            {renderPagination(deliveryReports.length)}
          </>
        );
      case "Transaction Report":
        // Calculate summary statistics
        const summary: TransactionSummary = transactionReports.reduce((acc, report) => {
          acc.totalTransactions += report.totalTransactions;
          acc.totalRevenue += report.totalAmount;
          
          switch (report.paymentMethod) {
            case 'Cash':
              acc.cashTransactions += report.totalTransactions;
              acc.cashAmount += report.totalAmount;
              break;
            case 'Momo':
              acc.momoTransactions += report.totalTransactions;
              acc.momoAmount += report.totalAmount;
              break;
            case 'Visa Card':
              acc.cardTransactions += report.totalTransactions;
              acc.cardAmount += report.totalAmount;
              break;
          }
          
          return acc;
        }, {
          totalTransactions: 0,
          totalRevenue: 0,
          cashTransactions: 0,
          momoTransactions: 0,
          cardTransactions: 0,
          cashAmount: 0,
          momoAmount: 0,
          cardAmount: 0
        });

        return (
          <>
            {/* Summary Statistics Cards */}
            <div className="grid grid-cols-5 gap-4 p-4 border-b border-gray-200">
              <div className="bg-white rounded-lg p-4 border border-[rgba(167,161,158,0.1)] shadow-sm">
                <div className="text-[12px] font-sans text-gray-500 mb-1">Total Transactions</div>
                <div className="text-[18px] font-sans font-semibold">{summary.totalTransactions}</div>
                <div className="text-[14px] font-sans text-[#fe5b18] mt-1">
                  GH₵ {summary.totalRevenue.toFixed(2)}
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-[rgba(167,161,158,0.1)] shadow-sm">
                <div className="text-[12px] font-sans text-gray-500 mb-1">Cash Transactions</div>
                <div className="text-[18px] font-sans font-semibold">{summary.cashTransactions}</div>
                <div className="text-[14px] font-sans text-yellow-600 mt-1">
                  GH₵ {summary.cashAmount.toFixed(2)}
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-[rgba(167,161,158,0.1)] shadow-sm">
                <div className="text-[12px] font-sans text-gray-500 mb-1">Momo Transactions</div>
                <div className="text-[18px] font-sans font-semibold">{summary.momoTransactions}</div>
                <div className="text-[14px] font-sans text-green-600 mt-1">
                  GH₵ {summary.momoAmount.toFixed(2)}
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-[rgba(167,161,158,0.1)] shadow-sm">
                <div className="text-[12px] font-sans text-gray-500 mb-1">Card Transactions</div>
                <div className="text-[18px] font-sans font-semibold">{summary.cardTransactions}</div>
                <div className="text-[14px] font-sans text-blue-600 mt-1">
                  GH₵ {summary.cardAmount.toFixed(2)}
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-[rgba(167,161,158,0.1)] shadow-sm">
                <div className="text-[12px] font-sans text-gray-500 mb-1">Total Revenue</div>
                <div className="text-[18px] font-sans font-semibold">GH₵ {summary.totalRevenue.toFixed(2)}</div>
                <div className="text-[14px] font-sans text-[#fe5b18] mt-1">
                  {summary.totalTransactions} transactions
                </div>
              </div>
            </div>

           

            {renderPagination(
              selectedPaymentMethod === 'all' 
                ? transactionReports.length 
                : transactionReports.filter(report => report.paymentMethod === selectedPaymentMethod).length
            )}
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
          <b className="text-[18px] font-sans whitespace-nowrap">
            Reports Template
          </b>
          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
            <div className="flex flex-wrap items-center gap-4">
              {/* Report Type Dropdown */}
              <div className="relative">
                <select
                  value={selectedReport || ''}
                  onChange={(e) => handleReportClick(e.target.value)}
                  className="appearance-none bg-white border border-[rgba(167,161,158,0.1)] rounded-md px-4 py-2 pr-8 text-[14px] font-sans text-[#666] cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-0 focus:border-[rgba(167,161,158,0.1)] min-w-[180px]"
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
                  className="appearance-none bg-white border border-[rgba(167,161,158,0.1)] rounded-md px-4 py-2 pr-8 text-[14px] font-sans text-[#666] cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-0 focus:border-[rgba(167,161,158,0.1)] min-w-[150px]"
                />
              )}

              {/* Date Range Picker */}
              {renderDateFilter()}

              {/* Download Button - Only show when report is selected */}
              {selectedReport && (
                <>
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-[4px] border-[1px] border-solid 
                              ${(!dateRange[0] || !dateRange[1]) && selectedReport !== "Transaction Report"
                                ? 'bg-gray-300 border-gray-300 cursor-not-allowed opacity-50'
                                : 'bg-[#313131] border-[#737373] cursor-pointer hover:bg-[#404040]'} 
                              text-[13px] text-[#cbcbcb] whitespace-nowrap order-last sm:order-none`}
                    onClick={(e) => {
                      if (selectedReport === "Transaction Report" || (dateRange[0] && dateRange[1])) {
                        handleDownloadClick(e);
                      }
                    }}
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
                    {selectedReport !== "Orders Report" && (
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
                    )}
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
          {selectedReport === "Orders Report" && (
            <div className="w-full overflow-x-auto">
              <div className="min-w-[1000px]">
                {renderContent()}
              </div>
            </div>
          )}
          {selectedReport === "Top Sold Items" && (
            <div className="w-full overflow-x-auto">
              <div className="min-w-[800px]">
                {renderContent()}
              </div>
            </div>
          )}
          {selectedReport === "Customer Report" && (
            <div className="w-full overflow-x-auto">
              <div className="min-w-[900px]">
                {renderContent()}
              </div>
            </div>
          )}
          {selectedReport === "Delivery Report" && (
            <div className="w-full overflow-x-auto">
              <div className="min-w-[1000px]">
                {renderContent()}
              </div>
            </div>
          )}
          {selectedReport === "Transaction Report" && (
            <div className="w-full overflow-x-auto">
              <div className="min-w-[1000px]">
                {renderContent()}
              </div>
            </div>
          )}
          {!selectedReport && renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Reports;