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

    return {
      invoiceNumber: orderNumber.toString(),
      orderDate: orderDate ? new Date(orderDate).toLocaleDateString() : 'N/A',
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
      })),
      payment: {
        method: paymentStatus,
        subTotal: parseFloat(orderPrice),
        deliveryCost: parseFloat(deliveryPrice),
        grandTotal: parseFloat(totalPrice),
      },
      orderStatus,
      trackingUrl,
      courierName,
      courierPhoneNumber,
      timeline: {
        received: orderReceivedTime ? new Date(orderReceivedTime).toLocaleString() : null,
        pickedUp: orderPickedUpTime ? new Date(orderPickedUpTime).toLocaleString() : null,
        onWay: orderOnmywayTime ? new Date(orderOnmywayTime).toLocaleString() : null,
        completed: orderCompletedTime ? new Date(orderCompletedTime).toLocaleString() : null,
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
}

const OrderDetailsView: FunctionComponent<OrderDetailsViewProps> = ({ orderId, onBack }) => {
  const { t } = useTranslation();
  const { id: orderIdFromUrl } = useParams();
  const navigate = useNavigate();
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { userProfile } = useUserProfile();

  const { orderDetails, isLoading, error } = useOrderDetails(orderId || orderIdFromUrl || null);

  useEffect(() => {
    if (orderDetails) {
      try {
        const data = mapApiResponseToInvoiceData(orderDetails);
        setInvoiceData(data);
      } catch (error) {
      }
    }
  }, [orderDetails]);

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
          pdf.text(`GHS ${order.unitPrice.toFixed(2)}`, 45, yPos);
          pdf.text(`GHS ${order.totalPrice.toFixed(2)}`, 60, yPos);
          
          yPos += (nameLines.length * 4) + 2;
        });

        // Separator line
        pdf.line(leftMargin, yPos, 75, yPos);
        yPos += 5;
      }

      // Totals
      pdf.text('Subtotal:', leftMargin, yPos);
      pdf.text(`GHS ${invoiceData.payment.subTotal.toFixed(2)}`, 75, yPos, { align: 'right' });
      yPos += 4;
      
      pdf.text('Delivery:', leftMargin, yPos);
      pdf.text(`GHS ${invoiceData.payment.deliveryCost.toFixed(2)}`, 75, yPos, { align: 'right' });
      yPos += 4;
      
      // Grand total
      pdf.setFontSize(8);
      pdf.text('Total:', leftMargin, yPos);
      pdf.text(`GHS ${invoiceData.payment.grandTotal.toFixed(2)}`, 75, yPos, { align: 'right' });
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
      console.error('Error generating receipt:', error);
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

  if (isLoading) {
    return <div>{t('common.loading')}</div>;
  }

  if (error) {
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
                    <span className="text-xs font-bold">{invoiceData.orderStatus || 'N/A'}</span>
                  </div>
                  {invoiceData.Walkin && (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600 font-medium">{t('orders.detail.serviceType')}:</span>
                      <span className="text-xs font-bold">{t('orders.walkIn')}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600 font-medium">{t('orders.detail.scheduledTime')}:</span>
                    <span>{invoiceData.scheduledTime ? new Date(invoiceData.scheduledTime).toLocaleString() : t('orders.detail.noScheduledTime')}</span>
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
              <div className="flex gap-4">
                {/* Customer Info */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-4 font-sans">{t('orders.detail.customerInfo')}</h3>
                  <div className="flex flex-col gap-2 font-sans text-xs">
                    <div className="flex">
                      <span className="text-gray-500 w-11">{t('orders.detail.name')}:</span>
                      <span>{invoiceData.customer.name}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-11">{t('orders.detail.phone')}:</span>
                      <span>{invoiceData.customer.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Courier Info */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-4 font-sans">{t('orders.detail.courierInfo')}</h3>
                  <div className="flex flex-col gap-2 font-sans text-xs">
                    <div className="flex">
                      <span className="text-gray-500 w-11">{t('orders.detail.name')}:</span>
                      <span>{invoiceData.courierName || t('orders.detail.notAssigned')}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-11">{t('orders.detail.phone')}:</span>
                      <span>{invoiceData.courierPhoneNumber || t('orders.detail.notAssigned')}</span>
                    </div>
                  </div>
                </div>

                {/* Order Status Info */}
                <div className="flex-1 -ml-24">
                  <h3 className="text-lg font-semibold mb-2 font-sans mr-24">{t('orders.orderStatus')}</h3>
                  <ul className="list-none font-sans text-xs -ml-10">
                    <li className="flex items-center mb-[2px]">
                      <span className={`${invoiceData.timeline.received ? 'text-red-500' : 'text-gray-400'} mr-1 w-2`}>•</span>
                      <span>{t('orders.detail.orderReceived')} | <strong>{invoiceData.timeline.received || ''}</strong></span>
                    </li>
                    <li className="flex items-center mb-[2px]">
                      <span className={`${invoiceData.timeline.pickedUp ? 'text-red-500' : 'text-gray-400'} mr-1 w-2`}>•</span>
                      <span>{t('orders.detail.orderPickedUp')} | <strong>{invoiceData.timeline.pickedUp || t('orders.detail.pending')}</strong></span>
                    </li>
                    <li className="flex items-center mb-[2px]">
                      <span className={`${invoiceData.timeline.onWay ? 'text-red-500' : 'text-gray-400'} mr-1 w-2`}>•</span>
                      <span>{t('orders.detail.orderOnWay')} | <strong>{invoiceData.timeline.onWay || t('orders.detail.pending')}</strong></span>
                    </li>
                    <li className="flex items-center">
                      <span className={`${invoiceData.timeline.completed ? 'text-red-500' : 'text-gray-400'} mr-1 w-2`}>•</span>
                      <span>{t('orders.detail.orderComplete')} | <strong>{invoiceData.timeline.completed || t('orders.detail.pending')}</strong></span>
                    </li>
                  </ul>
                </div>
              </div>

            
              {/* Order Table */}
              {!userProfile._restaurantTable?.[0]?.Inventory && 
               !userProfile._restaurantTable?.[0]?.Transactions && 
               invoiceData.orders.length > 0 && (
                <div className="mb-6 w-full border-[1px] border-solid border-[rgba(167,161,158,0.1)] rounded-lg overflow-hidden bg-white">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#ffffff]" style={{ borderBottom: '1px solid #eaeaea' }}>
                        <th className="text-left p-2 text-[12px] leading-[20px] font-sans text-[#666] font-bold">{t('orders.detail.serialNumber')}</th>
                        <th className="text-left p-2 text-[12px] leading-[20px] font-sans text-[#666] font-bold">{t('orders.detail.product')}</th>
                        <th className="text-left p-2 text-[12px] leading-[20px] font-sans text-[#666] font-bold">{t('orders.detail.unitPrice')}</th>
                        <th className="text-left p-2 text-[12px] leading-[20px] font-sans text-[#666] font-bold">{t('orders.detail.quantity')}</th>
                        <th className="text-right p-2 text-[12px] leading-[20px] font-sans text-[#666] font-bold">{t('orders.detail.totalPrice')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceData.orders.map((order) => (
                        <tr key={order.id} className="hover:bg-[#f9f9f9]" style={{ borderBottom: '1px solid #eaeaea' }}>
                          <td className="p-2 text-[12px] leading-[20px] font-sans text-[#444]">{order.id}</td>
                          <td className="p-2">
                            <span className="text-[12px] leading-[20px] font-sans text-[#444]">
                              {order.productName}
                            </span>
                          </td>
                          <td className="p-2 text-[12px] leading-[20px] font-sans text-[#666]">
                            GHS{order.unitPrice}
                          </td>
                          <td className="p-2 text-[12px] leading-[20px] font-sans text-[#666]">
                            {order.quantity}
                          </td>
                          <td className="p-2 text-right text-[12px] leading-[20px] font-sans text-[#444]">
                            GHS{order.totalPrice}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                      {invoiceData.kitchenStatus ? invoiceData.kitchenStatus.charAt(0).toUpperCase() + invoiceData.kitchenStatus.slice(1) : t('orders.orderReceived')}
                    </span>
                  </div>
                </div>
                <div className="flex gap-8">
                  {invoiceData.orders.length > 0 && (
                    <div className="text-[12px] leading-[20px] font-sans">
                      <p className="text-[#666] mb-2 font-bold">{t('orders.detail.subTotal')}</p>
                      <p className="text-[#444]">GHS{invoiceData.payment.subTotal}</p>
                    </div>
                  )}
                  <div className="text-[12px] leading-[20px] font-sans">
                    <p className="text-[#666] mb-2 font-bold">{t('orders.detail.deliveryCost')}</p>
                    <p className="text-[#444]">GHS{invoiceData.payment.deliveryCost}</p>
                  </div>
                  <div className="text-[12px] leading-[20px] font-sans">
                    <p className="text-[#666] mb-2 font-bold">{t('orders.detail.grandTotal')}</p>
                    <p className="text-[#444] font-medium">GHS{invoiceData.payment.grandTotal}</p>
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