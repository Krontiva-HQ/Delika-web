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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[400px] max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <h2 className="text-center text-lg font-medium font-sans">Batch Order Summary</h2>
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {orders.map((order, index) => (
            <div 
              key={order.id} 
              className="bg-gray-100 rounded-lg p-4 min-h-[100px] flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-medium font-sans">Order #{index + 1}</span>
                  <span className="text-[#fd683e] font-sans">GH₵ {order.deliveryPrice}</span>
                </div>
                <div className="space-y-1">

                  <div className="flex justify-between">
                    <span className="text-gray-600 font-sans">Customer name:</span>
                    <span className="font-medium font-sans">{order.customerName}</span>
                  </div>
                  <div className="flex justify-between">

                    <span className="text-gray-600 font-sans">Phone:</span>
                    <span className="font-medium font-sans">{order.customerPhone}</span>
                  </div>
                  <div className="flex justify-between">

                    <span className="text-gray-600 font-sans">Delivery Address:</span>
                    <span className="font-medium text-sm text-right max-w-[200px] line-clamp-2 font-sans">
                      {order.dropOff[0].toAddress}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="p-4 space-y-3">
          <button
            onClick={onAddAnother}
            className="w-full py-3 px-4 bg-[#fd683e] text-white rounded-lg font-medium hover:bg-[#fd683e]/90 transition-colors"
          >
            Add another order
          </button>
          <button
            onClick={onComplete}
            className="w-full py-3 px-4 bg-[#201a18] text-white rounded-lg font-medium hover:bg-[#201a18]/90 transition-colors"
          >
            Proceed to delivery
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchSummaryModal; 