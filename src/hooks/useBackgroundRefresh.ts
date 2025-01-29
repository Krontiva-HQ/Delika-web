import { useEffect, useRef } from 'react';
import { useUserProfile } from './useUserProfile';
import { api } from '../services/api';

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

  const refreshOrders = async () => {
    try {
      const params = new URLSearchParams({
        restaurantId: userProfile.restaurantId || '',
        branchId: userProfile.branchId || ''
      });
      await api.get(`/filter/orders/by/date?${params.toString()}`);
    } catch (error) {
      console.error('Background refresh orders error:', error);
    }
  };

  const refreshMenu = async () => {
    try {
      await api.post('/get/all/menu', {
        restaurantId: userProfile.restaurantId,
        branchId: userProfile.branchId
      });
    } catch (error) {
      console.error('Background refresh menu error:', error);
    }
  };

  const refreshTeam = async () => {
    try {
      await api.post('/get/team/members', {
        restaurantId: userProfile.restaurantId,
        branchId: userProfile.branchId
      });
    } catch (error) {
      console.error('Background refresh team error:', error);
    }
  };

  const refreshTransactions = async () => {
    try {
      const params = new URLSearchParams({
        restaurantId: userProfile.restaurantId || '',
        branchId: userProfile.branchId || ''
      });
      await api.get(`/get/all/orders/per/branch?${params.toString()}`);
    } catch (error) {
      console.error('Background refresh transactions error:', error);
    }
  };

  const refreshDashboard = async () => {
    try {
      await api.post('/get/dashboard/data', {
        restaurantId: userProfile.restaurantId,
        branchId: userProfile.branchId
      });
    } catch (error) {
      console.error('Background refresh dashboard error:', error);
    }
  };

  const refreshAudit = async () => {
    try {
      await api.get('/delikaquickshipper_audit_table', {
        params: {
          restaurantId: userProfile.restaurantId,
          branchId: userProfile.branchId
        }
      });
    } catch (error) {
      console.error('Background refresh audit error:', error);
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
  }, [userProfile?.restaurantId, userProfile?.branchId]);
}; 