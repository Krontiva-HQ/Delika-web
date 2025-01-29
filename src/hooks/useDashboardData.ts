import { useState, useEffect } from 'react';
import axios from 'axios';

interface DashboardDataResponse {
  totalOrders: number;
  totalRevenue: number;
  totalMenu: number;
  totalStaff: number;
}

interface UseDashboardDataProps {
  restaurantId: string;
  branchId: string;
}

export const useDashboardData = ({ restaurantId, branchId }: UseDashboardDataProps) => {
  const [data, setData] = useState<DashboardDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        'https://api-server.krontiva.africa/api:uEBBwbSs/get/dashboard/data',
        { restaurantId, branchId }
      );
      setData(response.data);
    } catch (err) {
      setError('Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (restaurantId && branchId) {
      fetchDashboardData();
    }
  }, [restaurantId, branchId]);

  return { data, isLoading, error };
}; 