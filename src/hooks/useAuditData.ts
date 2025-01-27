import { useState, useEffect } from 'react';
import { api } from '../services/api';
import dayjs from 'dayjs';

interface AuditResponse {
  id: string;
  created_at: number;
  userId: string;
  branchId: string;
  restaurantId: string;
  action: string;
  createdDateAndTime: number;
  branchTable: {
    branchName: string;
  };
  _restaurantTable: Array<{
    restaurantName: string;
    restaurantEmail: string;
    restaurantPhoneNumber: string;
  }>;
  users: {
    fullName: string;
  };
}

interface FormattedAuditData {
  id: string;
  created_at: string; // Formatted date
  userId: string;
  branchId: string;
  restaurantId: string;
  action: string;
  createdDateAndTime: string; // Formatted date
  branchTable: {
    branchName: string;
  };
  _restaurantTable: Array<{
    restaurantName: string;
    restaurantEmail: string;
    restaurantPhoneNumber: string;
  }>;
  users: {
    fullName: string;
  };
}

interface UseAuditDataProps {
  restaurantId: string;
  branchId: string;
}

export const useAuditData = ({ restaurantId, branchId }: UseAuditDataProps) => {
  const [data, setData] = useState<FormattedAuditData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (timestamp: number): string => {
    return dayjs(timestamp).format('MMM D, YYYY h:mm A');
  };

  const fetchAuditData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(
        `${import.meta.env.VITE_API_URL}/delikaquickshipper_audit_table`,
        {
          params: { restaurantId, branchId }
        }
      );
      
      // Format the dates in the response data
      const formattedData = response.data.map((audit: AuditResponse) => ({
        ...audit,
        created_at: formatDate(audit.created_at),
        createdDateAndTime: formatDate(audit.createdDateAndTime)
      }));

      setData(formattedData);
    } catch (err) {
      setError('Failed to fetch audit data');
      console.error('Error fetching audit data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (restaurantId && branchId) {
      fetchAuditData();
    }
  }, [restaurantId, branchId]);

  return { data, isLoading, error };
}; 