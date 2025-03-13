import { useState, useEffect } from 'react';
import { getOrderDetails } from '../services/api';
import type { OrderDetails } from '../services/api'; // Move interface to separate file

const useOrderDetails = (orderNumber: string | null) => {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderNumber) return;

    const fetchOrderDetails = async () => {
      setIsLoading(true);
      try {
        const response = await getOrderDetails(orderNumber);
        setOrderDetails(response.data);
      } catch (err) {
        setError('Failed to fetch order details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderNumber]);

  return { orderDetails, isLoading, error };
};

export default useOrderDetails; 