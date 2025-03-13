import { useState, useEffect } from 'react';
import { getOrderDetails, type OrderDetails } from '../services/api';

export interface TransactionDetails extends OrderDetails {}

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
        const response = await getOrderDetails(orderNumber);
        setTransactionDetails(response.data);
      } catch (err) {
        setError('Failed to fetch transaction details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactionDetails();
  }, [orderNumber]);

  return { transactionDetails, isLoading, error };
};

export default useTransactionDetails;