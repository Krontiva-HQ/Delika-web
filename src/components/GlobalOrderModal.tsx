import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useTranslation } from 'react-i18next';

const GlobalOrderModal: React.FC = () => {
  const { 
    pendingOrders, 
    showGlobalOrderModal, 
    setShowGlobalOrderModal,
    acceptGlobalOrder,
    declineGlobalOrder,
    globalLoadingOrderIds
  } = useNotifications();
  
  const { t } = useTranslation();
  
  if (!showGlobalOrderModal) return null;

  // Filter orders that haven't been accepted or declined yet
  const pendingOrdersToShow = pendingOrders.filter(order => 
    order.orderAccepted === "pending" && order.paymentStatus === "Paid"
  );

  // Automatically close the modal if there are no pending orders
  if (pendingOrdersToShow.length === 0) {
    setShowGlobalOrderModal(false);
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 font-sans">
      <div className="bg-white dark:bg-black rounded-lg p-6 w-full max-w-md mx-4 sm:mx-0 font-sans relative shadow-2xl border-4 border-[#fe5b18]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-black dark:text-white">
            🔔 {t('orders.newOrderReceived', {count: pendingOrdersToShow.length})}
          </h2>
          <div className="bg-[#fe5b18] text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
            GLOBAL
          </div>
        </div>
        
        <div className="max-h-[70vh] overflow-y-auto mb-4 font-sans">
          {pendingOrdersToShow.map((order) => (
            <div key={order.id} className="mb-3 p-3 bg-orange-50 dark:bg-gray-800 rounded-lg font-sans border border-[#fe5b18]">
              <div className="text-sm font-medium text-black dark:text-white font-sans">
                {t('orders.orderNumber')} #{order.orderNumber}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-sans">
                {t('orders.customer')}: {order.customerName}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-sans">
                📞 {order.customerPhoneNumber}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-sans">
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
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#fe5b18] text-white">
                  Customer App
                </span>
              </div>

              {/* Accept/Decline buttons */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => acceptGlobalOrder(order.id)}
                  disabled={globalLoadingOrderIds.has(`accept_${order.id}`) || globalLoadingOrderIds.has(`decline_${order.id}`)}
                  className={`flex-1 px-3 py-1.5 bg-[#fe5b18] text-white rounded-md text-xs font-medium hover:bg-[#e54d0e] transition-colors
                    ${globalLoadingOrderIds.has(`accept_${order.id}`) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {globalLoadingOrderIds.has(`accept_${order.id}`) ? (
                    <span className="flex items-center justify-center gap-1">
                      <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('orders.accepting')}
                    </span>
                  ) : (
                    `✅ ${t('orders.accept')}`
                  )}
                </button>
                <button
                  onClick={() => declineGlobalOrder(order.id)}
                  disabled={globalLoadingOrderIds.has(`accept_${order.id}`) || globalLoadingOrderIds.has(`decline_${order.id}`)}
                  className={`flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                    ${globalLoadingOrderIds.has(`decline_${order.id}`) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {globalLoadingOrderIds.has(`decline_${order.id}`) ? (
                    <span className="flex items-center justify-center gap-1">
                      <svg className="animate-spin h-3 w-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('orders.declining')}
                    </span>
                  ) : (
                    `❌ ${t('orders.decline')}`
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer with instructions */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 pt-2">
          📱 This notification appears on all pages when new orders arrive
        </div>
      </div>
    </div>
  );
};

export default GlobalOrderModal; 