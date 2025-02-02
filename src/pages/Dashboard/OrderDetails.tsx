import { FunctionComponent, useState, useEffect, useRef } from "react";
import { FaLocationDot } from "react-icons/fa6";
import { useParams, useNavigate } from 'react-router-dom';
import { OrderDetails as OrderDetailsType } from '../../hooks/useOrderDetails';
import useOrderDetails from '../../hooks/useOrderDetails';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { MdOutlineFileDownload } from 'react-icons/md';
import { useUserProfile } from '../../hooks/useUserProfile';

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
      scheduledTime
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
    };
  } catch (error) {
    throw error;
  }
};

interface OrderDetailsViewProps {
  orderId: string;
  onBack: () => void;
  orderDetails: OrderDetailsType | null;
  isLoading: boolean;
  error: string | null;
}

const OrderDetailsView: FunctionComponent<OrderDetailsViewProps> = ({ orderId, onBack }) => {
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

  const handleDownload = async () => {
    if (!contentRef.current) return;

    try {
      // Temporarily hide the download button
      const downloadButton = contentRef.current.querySelector('[data-pdf-hide]') as HTMLElement;
      if (downloadButton) {
        downloadButton.style.display = 'none';
      }

      // Create a canvas from the content
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      // Restore the download button visibility
      if (downloadButton) {
        downloadButton.style.display = 'flex';
      }

      // Calculate dimensions to fit A4 page
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0,
        0,
        imgWidth,
        imgHeight
      );

      // Download the PDF
      pdf.save(`order-${invoiceData?.invoiceNumber || 'details'}.pdf`);
    } catch (error) {
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!invoiceData) {
    return <div>No order details available.</div>;
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
          <div className="relative text-sm">Back</div>
        </button>
      </div>

      <div className="h-full p-4 pl-8 pr-8 bg-white">
        <div ref={contentRef} className="mt-[-10px] border-[2px] border-solid border-[#CACACA] rounded-lg bg-[#FBFBFB] overflow-y-auto">
          <div className="p-4">
            {/* Invoice Header */}
            <div className="flex justify-between items-start mb-6 pb-2 mt-[-10px]">
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
                      Order Number #{invoiceData.invoiceNumber || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col text-gray-500 text-xs mt-2 font-sans">
                  <span>Order Date: {invoiceData.orderDate}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600 font-medium text-xs">Order Status:</span>
                    <span className="text-xs font-bold">{invoiceData.orderStatus || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600 font-medium">Scheduled Time:</span>
                    <span>{invoiceData.scheduledTime ? new Date(invoiceData.scheduledTime).toLocaleString() : 'no scheduled time'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                      <FaLocationDot className="w-4 h-4 text-green-600" />
                      <div className="flex gap-1">
                        <span className="text-gray-600 font-medium">Pickup:</span>
                        <span>{invoiceData.pickup?.[0]?.fromAddress || 'N/A'}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <FaLocationDot className="w-4 h-4 text-red-600" />
                      <div className="flex gap-1">
                        <span className="text-gray-600 font-medium">Dropoff:</span>
                        <span>{invoiceData.dropOff?.[0]?.toAddress || 'N/A'}</span>
                      </div>  
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button 
                  onClick={handleDownload}
                  data-pdf-hide
                  className="bg-[#201a18] text-white px-3 py-1 rounded-md flex items-center gap-2 font-sans text-xs"
                >
                  <MdOutlineFileDownload className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>

            {/* Customer and Orders Info */}
            <div className="flex-1 border-[2px] border-[rgba(167,161,158,0.1)] bg-[#FFFFFF] rounded-lg p-4 pb-1 mb-6">
              <div className="flex gap-4">
                {/* Customer Info */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-4 font-sans">Customer Info</h3>
                  <div className="flex flex-col gap-2 font-sans text-xs">
                    <div className="flex">
                      <span className="text-gray-500 w-11">Name:</span>
                      <span>{invoiceData.customer.name}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-11">Phone:</span>
                      <span>{invoiceData.customer.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Courier Info */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-4 font-sans">Courier Info</h3>
                  <div className="flex flex-col gap-2 font-sans text-xs">
                    <div className="flex">
                      <span className="text-gray-500 w-11">Name:</span>
                      <span>{invoiceData.courierName || 'not assigned'}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-11">Phone:</span>
                      <span>{invoiceData.courierPhoneNumber || 'not assigned'}</span>
                    </div>
                  </div>
                </div>

                {/* Order Status Info */}
                <div className="flex-1 -ml-24">
                  <h3 className="text-lg font-semibold mb-2 font-sans mr-24">Order Status</h3>
                  <ul className="list-none font-sans text-xs -ml-10">
                    <li className="flex items-center mb-[2px]">
                      <span className={`${invoiceData.timeline.received ? 'text-red-500' : 'text-gray-400'} mr-1 w-2`}>•</span>
                      <span>Order Received | <strong>{invoiceData.timeline.received || ''}</strong></span>
                    </li>
                    <li className="flex items-center mb-[2px]">
                      <span className={`${invoiceData.timeline.pickedUp ? 'text-red-500' : 'text-gray-400'} mr-1 w-2`}>•</span>
                      <span>Order Picked Up | <strong>{invoiceData.timeline.pickedUp || 'pending'}</strong></span>
                    </li>
                    <li className="flex items-center mb-[2px]">
                      <span className={`${invoiceData.timeline.onWay ? 'text-red-500' : 'text-gray-400'} mr-1 w-2`}>•</span>
                      <span>Order On Way | <strong>{invoiceData.timeline.onWay || 'pending'}</strong></span>
                    </li>
                    <li className="flex items-center">
                      <span className={`${invoiceData.timeline.completed ? 'text-red-500' : 'text-gray-400'} mr-1 w-2`}>•</span>
                      <span>Order Complete | <strong>{invoiceData.timeline.completed || 'pending'}</strong></span>
                    </li>
                  </ul>
                </div>
              </div>

            
              {/* Order Table */}
              {!userProfile._restaurantTable?.[0]?.Inventory && !userProfile._restaurantTable?.[0]?.Transactions && (
                <div className="mb-6 w-full border-[1px] border-solid border-[rgba(167,161,158,0.1)] rounded-lg overflow-hidden bg-white">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#ffffff]" style={{ borderBottom: '1px solid #eaeaea' }}>
                        <th className="text-left p-2 text-[12px] leading-[20px] font-sans text-[#666] font-bold">S/L</th>
                        <th className="text-left p-2 text-[12px] leading-[20px] font-sans text-[#666] font-bold">Product</th>
                        <th className="text-left p-2 text-[12px] leading-[20px] font-sans text-[#666] font-bold">Unit price</th>
                        <th className="text-left p-2 text-[12px] leading-[20px] font-sans text-[#666] font-bold">QTY</th>
                        <th className="text-right p-2 text-[12px] leading-[20px] font-sans text-[#666] font-bold">Total price</th>
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
                            GH₵{order.unitPrice}
                          </td>
                          <td className="p-2 text-[12px] leading-[20px] font-sans text-[#666]">
                            {order.quantity}
                          </td>
                          <td className="p-2 text-right text-[12px] leading-[20px] font-sans text-[#444]">
                            GH₵{order.totalPrice}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Payment Summary */}
              <div className="flex justify-between items-start bg-white rounded-lg">
                <div>
                  <p className="text-[12px] leading-[20px] font-sans text-[#666] mb-2 ml-4 font-bold">
                    Transaction Status
                  </p>
                  <p className="text-[12px] leading-[20px] font-sans text-[#444] ml-4">
                    {invoiceData.payment.method}
                  </p>
                </div>
                <div className="flex gap-8">
                  {/*<div className="text-[12px] leading-[20px] font-sans">
                    <p className="text-[#666] mb-2 font-bold">Payment Method</p>
                    <p className="text-[#444]">
                      {Boolean(invoiceData?.payNow) ? 'Momo' : 
                       Boolean(invoiceData?.payLater) ? 'Cash' : 
                       ''}
                    </p>
                  </div> */}
                  <div className="text-[12px] leading-[20px] font-sans">
                    <p className="text-[#666] mb-2 font-bold">Sub Total</p>
                    <p className="text-[#444]">GH₵{invoiceData.payment.subTotal}</p>
                  </div>
                  <div className="text-[12px] leading-[20px] font-sans">
                    <p className="text-[#666] mb-2 font-bold">Delivery Cost</p>
                    <p className="text-[#444]">GH₵{invoiceData.payment.deliveryCost}</p>
                  </div>
                  <div className="text-[12px] leading-[20px] font-sans">
                    <p className="text-[#666] mb-2 font-bold">Grand Total</p>
                    <p className="text-[#444] font-medium">GH₵{invoiceData.payment.grandTotal}</p>
                  </div>
                </div>
              </div>

              {/* Krontiva Footer Logo */}
              <div className="mt-6 text-center border-t pt-4">
                <p className="text-gray-500 text-xs mb-2 font-sans">Powered By</p>
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