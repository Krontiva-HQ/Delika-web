import { useState, useEffect } from 'react';
import { api } from '../services/api';
import dayjs, { Dayjs } from 'dayjs';

interface Order {
  id: string;
  customerName: string;
  customerImage: string;
  address: string;
  date: string;
  price: number;
  status: string;
  paymentStatus: string;
  orderNumber: number;
  orderPrice: string;
  orderDate: string;
  dropOff: Array<{
    toAddress: string;
  }>;
}

const useFetchOrders = (selectedDate: Dayjs | null) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        const params = new URLSearchParams({
          restaurantId: userProfile.restaurantId || '',
          branchId: userProfile.branchId || '',
          date: selectedDate ? selectedDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
        });

        const response = await api.get(`/filter/orders/by/date?${params.toString()}`);
        setOrders(response.data);
      } catch (error) {
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [selectedDate]);

  return { orders, isLoading };
};

export default useFetchOrders; 