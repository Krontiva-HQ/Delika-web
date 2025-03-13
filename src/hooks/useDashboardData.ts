import { useState, useEffect } from 'react';
import { getDashboardData } from '../services/api';

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
      const response = await getDashboardData({ restaurantId, branchId });
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