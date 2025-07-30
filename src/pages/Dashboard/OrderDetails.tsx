import React from 'react';
import { FunctionComponent, useState, useEffect, useRef } from "react";
import { FaLocationDot } from "react-icons/fa6";
import { useParams, useNavigate } from 'react-router-dom';
import type { OrderDetails } from '../../services/api';
import useOrderDetails from '../../hooks/useOrderDetails';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { MdOutlineFileDownload } from 'react-icons/md';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useTranslation } from 'react-i18next';
import { formatDate, translateOrderStatus, translateKitchenStatus } from '../../i18n/i18n';
import dayjs from 'dayjs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';

// Import the Order interface from Orders component
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
}

interface InvoiceData {
  invoiceNumber: string;
  orderDate: string;
  location: string;
  pickup: Array<{
    fromAddress: string;
  }>;
  customer: {
    name: string;
    phone: string;
  };
  orders: {
    id: string;
    productName: string;
    productImage: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
    extras?: Array<{
      extrasName: string;
      extrasQuantity: number;
      extrasPrice: number;
    }>;
  }[];
  payment: {
    method: string;
    subTotal: number;
    deliveryCost: number;
    grandTotal: number;
  };
  dropOff: Array<{
    toAddress: string;
  }>;
  orderStatus: string;
  trackingUrl: string;
  courierName: string;
  courierPhoneNumber: string;
  timeline: {
    received: string | null;
    pickedUp: string | null;
    onWay: string | null;
    completed: string | null;
  };
  restaurant: {
    name: string;
    logo: string;
  };
  payNow: boolean;
  payLater: boolean;
  scheduledTime: string | null;
  branch?: {
    branchName: string;
  };
  orderComment?: string;
  Walkin: boolean;
  kitchenStatus?: string;
}

const mapApiResponseToInvoiceData = (apiResponse: any): InvoiceData => {
  const { userProfile } = useUserProfile();
  const restaurantName = userProfile._restaurantTable?.[0]?.restaurantName || 'N/A';
  const restaurantLogo = userProfile._restaurantTable?.[0]?.restaurantLogo?.url || '';

  if (!apiResponse) {
    return {
      invoiceNumber: 'N/A',
      orderDate: 'N/A',
      location: 'N/A',
      pickup: [],
      customer: {
        name: 'N/A',
        phone: 'N/A',
      },
      orders: [],
      payment: {
        method: 'N/A',
        subTotal: 0,
        deliveryCost: 0,
        grandTotal: 0,
        },
      dropOff: [],
      orderStatus: 'N/A',
      trackingUrl: '',
      courierName: 'N/A',
      courierPhoneNumber: 'N/A',
      timeline: {
        received: null,
        pickedUp: null,
        onWay: null,
        completed: null,
      },
      restaurant: {
        name: restaurantName,
        logo: restaurantLogo,
      },
      payNow: false,
      payLater: false,
      scheduledTime: null,
      Walkin: false,
    };
  }

  try {
    const {
      orderNumber = 'N/A',
      orderDate,
      pickup = [],
      dropOff = [],
      customerName = 'N/A',
      customerPhoneNumber = 'N/A',
      products = [],
      paymentStatus = 'N/A',
      orderPrice = '0',
      deliveryPrice = '0',
      totalPrice = '0',
      orderStatus = 'N/A',
      trackingUrl = '',
      courierName = 'N/A',
      courierPhoneNumber = 'N/A',
      orderReceivedTime,
      orderPickedUpTime,
      orderOnmywayTime,
      orderCompletedTime,
      scheduledTime,
      branch,
      orderComment,
      Walkin = false,
      kitchenStatus
    } = apiResponse;

    // Handle different data types between Order and OrderDetails interfaces
    const orderNumberStr = typeof orderNumber === 'number' ? orderNumber.toString() : orderNumber;
    const orderPriceNum = typeof orderPrice === 'string' ? parseFloat(orderPrice) : orderPrice;
    const deliveryPriceNum = typeof deliveryPrice === 'string' ? parseFloat(deliveryPrice) : deliveryPrice;
    const totalPriceNum = typeof totalPrice === 'string' ? parseFloat(totalPrice) : totalPrice;

    return {
      invoiceNumber: orderNumberStr,
      orderDate: orderDate ? formatDate(new Date(orderDate)) : 'N/A',
      location: pickup[0]?.fromAddress || 'N/A',
      pickup,
      dropOff,
      customer: {
        name: customerName,
        phone: customerPhoneNumber,
      },
      orders: products.map((product: any, index: number) => ({
        id: (index + 1).toString(),
        productName: product.name || 'N/A',
        productImage: product.image?.url || '',
        unitPrice: parseFloat(product.price) || 0,
        quantity: parseInt(product.quantity) || 0,
        totalPrice: (parseFloat(product.price) || 0) * (parseInt(product.quantity) || 0),
        extras: product.extras || [],
      })),
      payment: {
        method: paymentStatus,
        subTotal: orderPriceNum,
        deliveryCost: deliveryPriceNum,
        grandTotal: totalPriceNum,
      },
      orderStatus,
      trackingUrl,
      courierName,
      courierPhoneNumber,
      timeline: {
        received: orderReceivedTime ? formatDate(new Date(orderReceivedTime), 'DD MMM YYYY HH:mm') : null,
        pickedUp: orderPickedUpTime ? formatDate(new Date(orderPickedUpTime), 'DD MMM YYYY HH:mm') : null,
        onWay: orderOnmywayTime ? formatDate(new Date(orderOnmywayTime), 'DD MMM YYYY HH:mm') : null,
        completed: orderCompletedTime ? formatDate(new Date(orderCompletedTime), 'DD MMM YYYY HH:mm') : null,
      },
      restaurant: {
        name: restaurantName,
        logo: restaurantLogo,
      },
      payNow: false,
      payLater: false,
      scheduledTime: scheduledTime || null,
      branch,
      orderComment,
      Walkin,
      kitchenStatus
    };
  } catch (error) {
    throw error;
  }
};

interface OrderDetailsViewProps {
  orderId: string;
  onBack: () => void;
  orderDetails: OrderDetails | null;
  isLoading: boolean;
  error: string | null;
  orderData?: Order | null; // Add this new prop
}

const OrderDetailsView: FunctionComponent<OrderDetailsViewProps> = ({ orderId, onBack, orderData }) => {
  const { t } = useTranslation();
  const { id: orderIdFromUrl } = useParams();
  const navigate = useNavigate();
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { userProfile } = useUserProfile();

  // Use orderData if available, otherwise fall back to the hook
  const { orderDetails, isLoading, error } = useOrderDetails(
    orderData ? null : (orderId || orderIdFromUrl || null)
  );

  // Use orderData if available, otherwise use orderDetails from the hook
  const finalOrderDetails = orderData || orderDetails;

  useEffect(() => {
    if (finalOrderDetails) {
      try {
        const data = mapApiResponseToInvoiceData(finalOrderDetails);
        setInvoiceData(data);
      } catch (error) {
        // Handle error silently
      }
    }
  }, [finalOrderDetails]);

  const generatePDF = async () => {
    if (!invoiceData) return;

    try {
      const pdf = new jsPDF({
        unit: 'mm',
        format: [80, 200]
      });

      // Set font to Inter (Note: Using Helvetica as fallback since jsPDF doesn't support Inter directly)
      pdf.setFont("Helvetica");
      pdf.setFontSize(7);

      let yPos = 10;
      const leftMargin = 5;
      const width = 70;

      // Restaurant name and location - centered
      pdf.setFontSize(10);
      pdf.text(invoiceData.restaurant.name, 40, yPos, { align: 'center' });
      yPos += 6;
      
      // Branch name with smaller font
      pdf.setFontSize(7);
      const pickupLocation = invoiceData.pickup?.[0]?.fromAddress || 'N/A';
      pdf.text(pickupLocation, 40, yPos, { align: 'center' });
      yPos += 6;

      // Order details on the right
      pdf.text(`Order #: ${invoiceData.invoiceNumber}`, 75, yPos, { align: 'right' });
      yPos += 4;
      pdf.text(`Date: ${invoiceData.orderDate}`, 75, yPos, { align: 'right' });
      yPos += 6;

      // Customer details (left-aligned)
      pdf.text(`Customer's name: ${invoiceData.customer.name}`, leftMargin, yPos);
      yPos += 4;
      pdf.text(`Phone number: ${invoiceData.customer.phone}`, leftMargin, yPos);
      yPos += 6;

      // Courier details (left-aligned)
      pdf.text(`Courier's name: ${invoiceData.courierName || 'Not assigned'}`, leftMargin, yPos);
      yPos += 4;
      pdf.text(`Phone number: ${invoiceData.courierPhoneNumber || 'Not assigned'}`, leftMargin, yPos);
      yPos += 6;

      // Separator line
      pdf.line(leftMargin, yPos, 75, yPos);
      yPos += 5;

      // Only add items section if there are orders
      if (invoiceData.orders.length > 0) {
        // Items table header
        pdf.text("Item", leftMargin, yPos);
        pdf.text("Qty", 35, yPos);
        pdf.text("Price", 45, yPos);
        pdf.text("Total", 60, yPos);
        yPos += 4;

        // Separator line
        pdf.line(leftMargin, yPos, 75, yPos);
        yPos += 4;

        // Items
        invoiceData.orders.forEach(order => {
          // Product name with wrapping if needed
          const nameLines = pdf.splitTextToSize(order.productName, 30);
          pdf.text(nameLines, leftMargin, yPos);
          
          // Quantity, unit price, and total aligned in columns
          pdf.text(order.quantity.toString(), 35, yPos);
          pdf.text(`₵${Number(order.unitPrice).toFixed(2)}`, 45, yPos);
          pdf.text(`₵${Number(order.totalPrice).toFixed(2)}`, 60, yPos);
          
          yPos += (nameLines.length * 4) + 2;
        });

        // Separator line
        pdf.line(leftMargin, yPos, 75, yPos);
        yPos += 5;
      }

      // Totals
      pdf.text('Subtotal:', leftMargin, yPos);
      pdf.text(`₵${invoiceData.payment.subTotal.toFixed(2)}`, 75, yPos, { align: 'right' });
      yPos += 4;
      
      pdf.text('Delivery:', leftMargin, yPos);
      pdf.text(`₵${invoiceData.payment.deliveryCost.toFixed(2)}`, 75, yPos, { align: 'right' });
      yPos += 4;
      
      // Grand total
      pdf.setFontSize(8);
      pdf.text('Total:', leftMargin, yPos);
      pdf.text(`₵${invoiceData.payment.grandTotal.toFixed(2)}`, 75, yPos, { align: 'right' });
      yPos += 6;

      // Payment method
      pdf.setFontSize(7);
      pdf.text(`Payment Status: ${invoiceData.payment.method}`, leftMargin, yPos);
      yPos += 8;

      // Order Comment
      pdf.text(`Order Comment: ${invoiceData.orderComment || 'No comment available'}`, leftMargin, yPos);
      yPos += 4;

      // Footer
      pdf.text('Thank you for your order!', 40, yPos, { align: 'center' });
      yPos += 4;
      pdf.text('Powered by Krontiva Africa', 40, yPos, { align: 'center' });

      return pdf;
    } catch (error) {
      return null;
    }
  };

  const handlePrint = async () => {
    const pdf = await generatePDF();
    if (pdf) {
      pdf.autoPrint();
      pdf.output('dataurlnewwindow');
    }
  };

  if (isLoading && !orderData) {
    return <div>{t('common.loading')}</div>;
  }

  if (error && !orderData) {
    return <div>{t('common.error')}: {error}</div>;
  }

  if (!invoiceData) {
    return <div>{t('orders.noOrderDetails')}</div>;
  }

  return (
    <main>
      <div className="pl-8 pt-4 bg-transparent">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 bg-transparent"
        >
          <img
            className="w-[20px] h-[20px]"
            alt=""
            src="/vuesaxlineararrowleft.svg"
          />
          <div className="relative text-sm">{t('common.back')}</div>
        </button>
      </div>

      <div className="h-full p-4 pl-8 pr-8 bg-white">
        <div ref={contentRef} className="mt-[-10px] border-[2px] border-solid border-[#CACACA] rounded-lg bg-[#FBFBFB] overflow-y-auto">
          <div className="p-4">
            {/* Invoice Header */}
            <div className="flex justify-between items-start mb-6 pb-2 mt-[-5px]">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  {invoiceData.restaurant.logo && (
                    <img 
                      src={invoiceData.restaurant.logo} 
                      alt={invoiceData.restaurant.name}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <h2 className="text-lg font-semibold font-sans leading-none mb-0">
                      {invoiceData.restaurant.name}
                    </h2>
                    <p className="text-gray-500 text-xs font-sans mt-[1px]">
                      {t('orders.orderNumber')} #{invoiceData.invoiceNumber || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col text-gray-500 text-xs mt-2 font-sans">
                  <span>{t('orders.date')}: {invoiceData.orderDate}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600 font-medium text-xs">{t('orders.orderStatus')}:</span>
                    <span className="text-xs font-bold">{translateOrderStatus(invoiceData.orderStatus) || 'N/A'}</span>
                  </div>
                  {invoiceData.Walkin && (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600 font-medium">{t('orders.detail.serviceType')}:</span>
                      <span className="text-xs font-bold">{t('orders.walkIn')}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600 font-medium">{t('orders.detail.scheduledTime')}:</span>
                    <span>
                      {invoiceData.scheduledTime 
                        ? formatDate(new Date(invoiceData.scheduledTime), 'DD MMM YYYY HH:mm') 
                        : t('orders.detail.noScheduledTime')}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                      <FaLocationDot className="w-4 h-4 text-green-600" />
                      <div className="flex gap-1">
                        <span className="text-gray-600 font-medium">{t('orders.detail.pickup')}:</span>
                        <span>{invoiceData.pickup?.[0]?.fromAddress || 'N/A'}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <FaLocationDot className="w-4 h-4 text-red-600" />
                      <div className="flex gap-1">
                        <span className="text-gray-600 font-medium">{t('orders.detail.dropoff')}:</span>
                        <span>{invoiceData.dropOff?.[0]?.toAddress || 'N/A'}</span>
                      </div>  
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button 
                  onClick={handlePrint}
                  data-pdf-hide
                  className="bg-[#201a18] text-white px-3 py-1 rounded-md flex items-center gap-2 font-sans text-xs"
                >
                  <MdOutlineFileDownload className="w-4 h-4" />
                  {t('orders.detail.print')}
                </button>
              </div>
            </div>

            {/* Customer and Orders Info */}
            <div className="flex-1 border-[2px] border-[rgba(167,161,158,0.1)] bg-[#FFFFFF] rounded-lg p-4 pb-1 mb-6">
              <div className="flex flex-row gap-8 mb-6">
                {/* Customer Info */}
                <div className="flex-1 bg-white rounded-lg p-4 border">
                  <h3 className="text-lg font-semibold mb-4">Customer Info</h3>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-gray-500">Name:</span>
                    <span>{invoiceData.customer.name}</span>
                    <span className="text-gray-500">Phone:</span>
                    <span>{invoiceData.customer.phone}</span>
                  </div>
                </div>
                {/* Courier Info */}
                <div className="flex-1 bg-white rounded-lg p-4 border">
                  <h3 className="text-lg font-semibold mb-4">Courier Info</h3>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-gray-500">Name:</span>
                    <span>{invoiceData.courierName}</span>
                    <span className="text-gray-500">Phone:</span>
                    <span>{invoiceData.courierPhoneNumber}</span>
                  </div>
                </div>
                {/* Order Status */}
                <div className="flex-1 bg-white rounded-lg p-4 border">
                  <h3 className="text-lg font-semibold mb-4">Order Status</h3>
                  <ul className="list-none text-sm">
                    <li>Order Received | <strong>{invoiceData.timeline.received || 'Pending'}</strong></li>
                    <li>Order Picked Up | <strong>{invoiceData.timeline.pickedUp || 'Pending'}</strong></li>
                    <li>Order On Way | <strong>{invoiceData.timeline.onWay || 'Pending'}</strong></li>
                    <li>Order Complete | <strong>{invoiceData.timeline.completed || 'Pending'}</strong></li>
                  </ul>
                </div>
              </div>

            
              {/* Order Table */}
              {invoiceData.orders.length > 0 && (
                <div className="mb-6 w-full border-[1px] border-solid border-[rgba(167,161,158,0.1)] rounded-lg overflow-hidden bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Unit Price ₵</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead className="text-right">Total ₵</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoiceData.orders.map((order, idx) => (
                        <React.Fragment key={order.id}>
                          <TableRow>
                            <TableCell className="font-sans align-top">{idx + 1}</TableCell>
                            <TableCell className="font-sans font-semibold align-top">{order.productName}</TableCell>
                            <TableCell className="font-sans align-top">{Number(order.unitPrice).toFixed(2)}</TableCell>
                            <TableCell className="font-sans align-top">{order.quantity}</TableCell>
                            <TableCell className="font-sans align-top text-right">{Number(order.totalPrice).toFixed(2)}</TableCell>
                          </TableRow>
                          {order.extras && order.extras.length > 0 && order.extras.map((extra, eIdx) => (
                            <TableRow key={eIdx}>
                              <TableCell className="font-sans"></TableCell>
                              <TableCell className="font-sans pl-8 text-xs text-gray-500">• {extra.extrasName}</TableCell>
                              <TableCell className="font-sans text-xs text-gray-500">{Number(extra.extrasPrice).toFixed(2)}</TableCell>
                              <TableCell className="font-sans text-xs text-gray-500">{extra.extrasQuantity}</TableCell>
                              <TableCell className="font-sans text-xs text-gray-500 text-right">{(Number(extra.extrasPrice) * Number(extra.extrasQuantity)).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Payment Summary */}
              <div className="flex justify-between items-start bg-white rounded-lg">
                <div className="flex gap-8">
                  <div>
                    <p className="text-[12px] leading-[20px] font-sans text-[#666] mb-2 ml-4 font-bold">
                      {t('orders.detail.transactionStatus')}
                    </p>
                    <p className="text-[12px] leading-[20px] font-sans text-[#444] ml-4">
                      {invoiceData.payment.method}
                    </p>
                  </div>
                  <div>
                    <p className="text-[12px] leading-[20px] font-sans text-[#666] mb-2 font-bold">
                      {t('orders.kitchenStatus')}
                    </p>
                    <span className={`px-2 py-1 rounded-full text-[10px] leading-[20px] font-sans
                      ${invoiceData.kitchenStatus === 'preparing' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : invoiceData.kitchenStatus === 'prepared'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'}`}
                    >
                      {translateKitchenStatus(invoiceData.kitchenStatus || '')}
                    </span>
                  </div>
                </div>
                <div className="flex gap-8">
                  {invoiceData.orders.length > 0 && (
                    <div className="text-[12px] leading-[20px] font-sans">
                      <p className="text-[#666] mb-2 font-bold">{t('orders.detail.subTotal')}</p>
                      <p className="text-[#444]">₵{invoiceData.payment.subTotal}</p>
                    </div>
                  )}
                  <div className="text-[12px] leading-[20px] font-sans">
                    <p className="text-[#666] mb-2 font-bold">{t('orders.detail.deliveryCost')}</p>
                    <p className="text-[#444]">₵{invoiceData.payment.deliveryCost}</p>
                  </div>
                  <div className="text-[12px] leading-[20px] font-sans">
                    <p className="text-[#666] mb-2 font-bold">{t('orders.detail.grandTotal')}</p>
                    <p className="text-[#444] font-medium">₵{invoiceData.payment.grandTotal}</p>
                  </div>
                </div>
              </div>

              {/* Order Comment */}
              <div className="mt-4 ml-4 text-[12px] leading-[20px] font-sans">
                <span className="text-[#666] font-bold mr-2">{t('orders.detail.orderComment')}:</span>
                <span className="text-[#444]">{invoiceData.orderComment || t('orders.detail.noCommentAvailable')}</span>
              </div>

              {/* Krontiva Footer Logo */}
              <div className="mt-6 text-center border-t pt-4">
                <p className="text-gray-500 text-xs mb-2 font-sans">{t('common.poweredBy')}</p>
                <img
                  src="/Krontiva-Black.png"
                  alt="Powered by Krontiva"
                  className="h-6 mx-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default OrderDetailsView; 