import { useState, useEffect } from 'react';
import { api } from '../services/api';
import dayjs from 'dayjs';

interface Order {
  orderDate: string;
  totalPrice: string;
  orderPrice: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  courierName: string;
  deliveryPrice: number;
  products: string;
  // other fields...
}

interface MonthlyOrderData {
  month: string;
  orders: number;
  totalPrice: number;
}

const useMonthlyOrderData = (restaurantId: string, branchId: string) => {
  const [monthlyOrderData, setMonthlyOrderData] = useState<MonthlyOrderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/get/all/orders/per/branch', {
          params: {
            restaurantId,
            branchId
          }
        });

        const orders: Order[] = response.data;

        const currentYear = dayjs().year();
        const currentYearOrders = orders.filter(order => 
          dayjs(order.orderDate).year() === currentYear
        ); 

        const initialData = [
          { month: 'Jan', orders: 0, orderPrice: 0 },
          { month: 'Feb', orders: 0, orderPrice: 0 },
          { month: 'Mar', orders: 0, orderPrice: 0 },
          { month: 'Apr', orders: 0, orderPrice: 0 },
          { month: 'May', orders: 0, orderPrice: 0 },

          { month: 'Jun', orders: 0, totalPrice: 0 },
          { month: 'Jul', orders: 0, totalPrice: 0 },
          { month: 'Aug', orders: 0, totalPrice: 0 },
          { month: 'Sep', orders: 0, totalPrice: 0 },
          { month: 'Oct', orders: 0, totalPrice: 0 },
          { month: 'Nov', orders: 0, totalPrice: 0 },
          { month: 'Dec', orders: 0, totalPrice: 0 },
        ];

        const ordersByMonth = currentYearOrders.reduce((acc, order) => {
          const month = dayjs(order.orderDate).format('MMM');
          acc[month] = acc[month] || { orders: 0, orderPrice: 0 };
          acc[month].orders += 1;
          acc[month].orderPrice += parseFloat(order.orderPrice) || 0;
          return acc;
        }, {} as Record<string, { orders: number; orderPrice: number }>);

        const formattedData = initialData.map((data) => ({
          month: data.month,
          orders: ordersByMonth[data.month]?.orders || 0,
          totalPrice: ordersByMonth[data.month]?.orderPrice || 0,
        }));

        setMonthlyOrderData(formattedData);
      } catch (error) {
        setMonthlyOrderData([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (restaurantId && branchId) {
      fetchData();
    }
  }, [restaurantId, branchId]);

  return { monthlyOrderData, isLoading };
};

export default useMonthlyOrderData; 