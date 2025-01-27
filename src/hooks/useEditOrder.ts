import { useState } from 'react';

interface EditOrderParams {
  dropOff: {
    toAddress: string;
    toLatitude: string;
    toLongitude: string;
  }[];
  orderNumber: number;
  deliveryDistance: string;
  trackingUrl: string;
  orderStatus: string;
  deliveryPrice: string;
  totalPrice: string;
  paymentStatus: string;
  dropOffCity: string;
}

export const useEditOrder = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editOrder = async (params: EditOrderParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/edit/order`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Failed to edit order');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { editOrder, isLoading, error };
}; 