import { useState, useEffect } from 'react';
import { api } from '../services/api';

export interface TransactionDetails {
  id: string;
  orderNumber: string;
  orderDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryType: string;
  paymentStatus: string;
  products: {
    id: string;
    name: string;
    image: { url: string };
    price: string;
    quantity: string;
  }[];
  orderPrice: string;
  deliveryPrice: string;
  totalPrice: string;
  pickup: {
    fromAddress: string;
  }[];
}

const useTransactionDetails = (orderNumber: string | null) => {
  const [transactionDetails, setTransactionDetails] = useState<TransactionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactionDetails = async () => {
      if (!orderNumber) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await api.get(`${import.meta.env.VITE_API_URL}/get/order/id/${orderNumber}`);
        setTransactionDetails(response.data);
      } catch (err) {
        setError('Failed to fetch transaction details');
        console.error('Error fetching transaction details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactionDetails();
  }, [orderNumber]);

  return { transactionDetails, isLoading, error };
};

export default useTransactionDetails;