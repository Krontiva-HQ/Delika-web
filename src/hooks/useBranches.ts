import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface Branch {
  id: string;
  created_at: number;
  branchName: string;
  restaurantID: string;
  branchLocation: string;
  branchPhoneNumber: string;
  branchCity: string;
  branchLongitude: string;
  branchLatitude: string;
}

export const useBranches = (restaurantId: string | null) => {
  const [branches, setBranches] = useState<Branch[]>(() => {
    // Initialize from localStorage if available
    const cachedBranches = localStorage.getItem(`branches_${restaurantId}`);
    return cachedBranches ? JSON.parse(cachedBranches) : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number>(() => {
    return parseInt(localStorage.getItem(`branches_lastFetched_${restaurantId}`) || '0');
  });

  const fetchBranches = async (force: boolean = false) => {
    if (!restaurantId) return;

    // Check if we have cached data and it's less than 1 hour old
    const now = Date.now();
    const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
    
    if (!force && branches.length > 0 && (now - lastFetched) < oneHour) {
      return;
    }
    


    setIsLoading(true);
    
    try {
      const response = await api.get(
        `/delikaquickshipper_branches_table/${restaurantId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );
      
      // Update state and cache
      setBranches(response.data);
      setLastFetched(now);
      
      // Store in localStorage
      localStorage.setItem(`branches_${restaurantId}`, JSON.stringify(response.data));
      localStorage.setItem(`branches_lastFetched_${restaurantId}`, now.toString());
      
      // Store branch IDs separately for quick access
      const branchIds = response.data.reduce((acc: Record<string, string>, branch: Branch) => {
        acc[branch.id] = branch.branchName;
        return acc;
      }, {});
      localStorage.setItem(`branchIds_${restaurantId}`, JSON.stringify(branchIds));
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch branches');
      
      // If fetch fails and we have cached data, use that
      const cachedBranches = localStorage.getItem(`branches_${restaurantId}`);
      if (cachedBranches) {
        setBranches(JSON.parse(cachedBranches));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get a branch name by ID from cache
  const getBranchName = (branchId: string): string => {
    if (!restaurantId) return '';
    const branchIds = JSON.parse(localStorage.getItem(`branchIds_${restaurantId}`) || '{}');
    return branchIds[branchId] || '';
  };

  // Initial fetch
  useEffect(() => {
    fetchBranches();
  }, [restaurantId]);

  return { 
    branches, 
    isLoading, 
    error,
    refetch: () => fetchBranches(true), // Force refresh
    getBranchName // Expose function to get branch name by ID
  };
}; 