import { useEffect, useRef } from 'react';
import { useUserProfile } from './useUserProfile';
import { filterOrdersByDate, getAllMenu, getTeamMembers, getAllOrdersPerBranch, getDashboardData, getAuditLogs } from '../services/api';

// Define the refresh intervals (in milliseconds)
const REFRESH_INTERVALS = {
  ORDERS: 30000,        // 30 seconds
  MENU: 60000,         // 1 minute
  TEAM: 300000,        // 5 minutes
  TRANSACTIONS: 60000,  // 1 minute
  AUDIT: 300000,       // 5 minutes
  DASHBOARD: 60000     // 1 minute
};

export const useBackgroundRefresh = () => {
  const { userProfile } = useUserProfile();
  const refreshTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Helper function to get the correct branch ID
  const getBranchId = (): string => {
    const selectedBranchId = localStorage.getItem('selectedBranchId');
    // If user is admin and has selected a branch, use that, otherwise use user's branch
    return userProfile?.role === 'Admin' && selectedBranchId 
      ? selectedBranchId 
      : userProfile?.branchId || '';
  };

  const refreshOrders = async () => {
    try {
      await filterOrdersByDate({
        restaurantId: userProfile?.restaurantId || '',
        branchId: getBranchId(),
        date: new Date().toISOString().split('T')[0] // Current date in YYYY-MM-DD format
      });
    } catch (error) {
      console.error('Background refresh failed for orders:', error);
    }
  };

  const refreshMenu = async () => {
    try {
      await getAllMenu({
        restaurantId: userProfile?.restaurantId || '',
        branchId: getBranchId()
      });
    } catch (error) {
      console.error('Background refresh failed for menu:', error);
    }
  };

  const refreshTeam = async () => {
    try {
      await getTeamMembers({
        restaurantId: userProfile?.restaurantId || '',
        branchId: getBranchId()
      });
    } catch (error) {
      // Silent fail for background refresh
    }
  };

  const refreshTransactions = async () => {
    try {
      await getAllOrdersPerBranch({
        restaurantId: userProfile?.restaurantId || '',
        branchId: getBranchId()
      });
    } catch (error) {
      // Silent fail for background refresh
    }
  };

  const refreshDashboard = async () => {
    try {
      await getDashboardData({
        restaurantId: userProfile?.restaurantId || '',
        branchId: getBranchId()
      });
    } catch (error) {
      // Silent fail for background refresh
    }
  };

  const refreshAudit = async () => {
    try {
      await getAuditLogs({
        restaurantId: userProfile?.restaurantId || '',
        branchId: getBranchId()
      });
    } catch (error) {
      console.error('Background refresh failed for audit:', error);
    }
  };

  useEffect(() => {
    // Only start background refresh if we have user profile data
    if (!userProfile?.restaurantId) return;

    // Setup refresh timers
    refreshTimers.current.orders = setInterval(refreshOrders, REFRESH_INTERVALS.ORDERS);
    refreshTimers.current.menu = setInterval(refreshMenu, REFRESH_INTERVALS.MENU);
    refreshTimers.current.team = setInterval(refreshTeam, REFRESH_INTERVALS.TEAM);
    refreshTimers.current.transactions = setInterval(refreshTransactions, REFRESH_INTERVALS.TRANSACTIONS);
    refreshTimers.current.dashboard = setInterval(refreshDashboard, REFRESH_INTERVALS.DASHBOARD);
    refreshTimers.current.audit = setInterval(refreshAudit, REFRESH_INTERVALS.AUDIT);

    // Initial refresh
    refreshOrders();
    refreshMenu();
    refreshTeam();
    refreshTransactions();
    refreshDashboard();
    refreshAudit();

    // Cleanup function
    return () => {
      Object.values(refreshTimers.current).forEach(timer => clearInterval(timer));
    };
  }, [userProfile?.restaurantId]);

  // Add a listener for branch changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'selectedBranchId') {
        // Trigger immediate refresh when branch changes
        refreshOrders();
        refreshMenu();
        refreshTeam();
        refreshTransactions();
        refreshDashboard();
        refreshAudit();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
}; 