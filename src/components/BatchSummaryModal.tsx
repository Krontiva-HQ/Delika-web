import React from 'react';

interface BatchSummaryModalProps {
  open: boolean;
  orders: any[];
  batchId: string;
  onAddAnother: () => void;
  onComplete: () => void;
}

const BatchSummaryModal: React.FC<BatchSummaryModalProps> = ({
  open,
  orders,
  batchId,
  onAddAnother,
  onComplete,
}) => {
  if (!open) return null;

  const isMaxOrdersReached = orders.length >= 5;

  const handleProceedToDelivery = () => {
    onComplete(); // This will trigger the refresh through handleOrderPlaced
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[400px] max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-3 border-b">
          <h2 className="text-center text-[14px] font-medium font-sans">Batch Order Summary</h2>
          <p className="text-center text-[12px] text-gray-600 mt-1 font-sans">
            {orders.length}/5 orders in batch
          </p>
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {orders.map((order, index) => (
            <div 
              key={order.id || index} 
              className="bg-gray-100 rounded-lg p-3 flex flex-col gap-2"
            >
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-[12px] font-medium font-sans">Order #{index + 1}</span>
                <span className="text-[12px] text-[#fd683e] font-sans">GH₵ {order.totalPrice}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[11px] text-gray-600 font-sans">Customer name:</span>
                  <span className="text-[11px] font-medium font-sans">{order.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] text-gray-600 font-sans">Phone:</span>
                  <span className="text-[11px] font-medium font-sans">{order.customerPhoneNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] text-gray-600 font-sans">Delivery Address:</span>
                  <span className="text-[11px] font-medium text-right max-w-[200px] line-clamp-2 font-sans">
                    {order.dropOff[0].toAddress}
                  </span>
                </div>
              </div>

              {/* Food Items Section */}
              <div className="mt-2 border-t pt-2">
                <div className="text-[11px] font-medium font-sans mb-1">Food Items:</div>
                <div className="space-y-1">
                  {order.products.map((product: any, pIndex: number) => (
                    <div key={pIndex} className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-medium font-sans">{product.quantity}x</span>
                        <span className="text-[11px] text-gray-600 font-sans">{product.name}</span>
                      </div>
                      <span className="text-[11px] text-gray-600 font-sans">
                        GH₵ {(Number(product.price) * Number(product.quantity)).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Summary */}
              <div className="mt-2 border-t pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-gray-600 font-sans">Delivery Fee:</span>
                  <span className="text-[11px] font-medium font-sans">GH₵ {order.deliveryPrice}</span>
                </div>
                <div className="flex justify-between items-center font-medium">
                  <span className="text-[11px] text-gray-600 font-sans">Total:</span>
                  <span className="text-[11px] text-[#fd683e] font-sans">GH₵ {order.totalPrice}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="p-3 space-y-2 border-t">
          {!isMaxOrdersReached ? (
            <button
              onClick={onAddAnother}
              className="w-full py-2 px-3 bg-[#fd683e] text-white rounded-lg text-[12px] font-medium hover:bg-[#fd683e]/90 transition-colors"
            >
              Add another order
            </button>
          ) : (
            <div className="text-center text-[11px] text-red-500 mb-1 font-sans">
              Maximum limit of 5 orders reached
            </div>
          )}
          <button
            onClick={handleProceedToDelivery}
            className="w-full py-2 px-3 bg-[#201a18] text-white rounded-lg text-[12px] font-medium hover:bg-[#201a18]/90 transition-colors"
          >
            Proceed to delivery
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchSummaryModal; 