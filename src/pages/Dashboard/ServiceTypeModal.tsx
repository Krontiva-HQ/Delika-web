import React from 'react';

// Define DeliveryMethod type to match PlaceOrder
export type DeliveryMethod = 'on-demand' | 'full-service' | 'schedule' | 'batch-delivery' | 'walk-in' | null;

interface ServiceTypeModalProps {
  onSelect: (type: DeliveryMethod) => void;
  onClose: () => void;
  deliveryMethods: {
    onDemand: boolean;
    fullService: boolean;
    schedule: boolean;
    batchDelivery: boolean;
    walkIn: boolean;
  };
}

const ServiceTypeModal: React.FC<ServiceTypeModalProps> = ({ onSelect, onClose, deliveryMethods }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-10 rounded-lg relative flex flex-col overflow-y-auto max-h-[90vh] w-full sm:w-[900px] mx-4 sm:mx-0">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 bg-transparent z-50"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <h2 className="text-3xl mb-6 text-center font-sans">Select Service Type</h2>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center w-full font-sans">
          {deliveryMethods.onDemand && (
            <div
              onClick={() => onSelect('on-demand')}
              className="flex flex-col items-center justify-center w-[220px] h-[220px] bg-[#FFF5F3] rounded-xl cursor-pointer hover:bg-[#FFE5E0] transition-colors shadow"
            >
              <img src="/on-demand-delivery.svg" alt="On-Demand" className="w-16 h-16 mb-6" />
              <span className="text-center text-lg font-sans">On Demand<br/>Delivery</span>
            </div>
          )}
          {deliveryMethods.fullService && (
            <div
              onClick={() => onSelect('full-service')}
              className="flex flex-col items-center justify-center w-[220px] h-[220px] bg-[#FFF5F3] rounded-xl cursor-pointer hover:bg-[#FFE5E0] transition-colors shadow"
            >
              <img src="/full-service.svg" alt="Full-service" className="w-16 h-16 mb-6" />
              <span className="text-center text-lg font-sans">Full-service<br/>Delivery</span>
            </div>
          )}
          {deliveryMethods.schedule && (
            <div
              onClick={() => onSelect('schedule')}
              className="flex flex-col items-center justify-center w-[220px] h-[220px] bg-[#FFF5F3] rounded-xl cursor-pointer hover:bg-[#FFE5E0] transition-colors shadow"
            >
              <img src="/schedule-delivery.svg" alt="Schedule" className="w-16 h-16 mb-6" />
              <span className="text-center text-lg font-sans">Schedule<br/>Delivery</span>
            </div>
          )}
          {deliveryMethods.batchDelivery && (
            <div
              onClick={() => onSelect('batch-delivery')}
              className="flex flex-col items-center justify-center w-[220px] h-[220px] bg-[#FFF5F3] rounded-xl cursor-pointer hover:bg-[#FFE5E0] transition-colors shadow"
            >
              <img src="/batch-delivery.svg" alt="Batch" className="w-16 h-16 mb-6" />
              <span className="text-center text-lg font-sans">Batch<br/>Delivery</span>
            </div>
          )}
          {deliveryMethods.walkIn && (
            <div
              onClick={() => onSelect('walk-in')}
              className="flex flex-col items-center justify-center w-[220px] h-[220px] bg-[#FFF5F3] rounded-xl cursor-pointer hover:bg-[#FFE5E0] transition-colors shadow"
            >
              <img src="/dining-out.png" alt="Walk-In" className="w-16 h-16 mb-6" />
              <span className="text-center text-lg font-sans">Walk-In<br/>Service</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceTypeModal; 