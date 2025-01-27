import { FC } from 'react';
import { IoIosCheckmarkCircle } from "react-icons/io";

interface PaymentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PaymentRequestModal: FC<PaymentRequestModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl transform transition-all">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <IoIosCheckmarkCircle className="text-[#00B087] w-16 h-16" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2 font-['Inter']">
            Payment Request Sent
          </h3>
          <p className="text-gray-500 font-['Inter']">
            An SMS has been sent to the customer to make payment
          </p>
        </div>
        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full bg-[#fd683e] text-white rounded-md py-2 font-['Inter'] text-sm hover:bg-opacity-90 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentRequestModal; 