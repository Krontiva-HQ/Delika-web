import { useEffect, useRef } from 'react';
import { useUserProfile } from './useUserProfile';
import { getAllMenu, getTeamMembers, getAllOrdersPerBranch, getDashboardData } from '../services/api';

// Define the refresh intervals (in milliseconds)
const REFRESH_INTERVALS = {
  MENU: 60000,         // 1 minute
  TEAM: 300000,        // 5 minutes
  TRANSACTIONS: 60000,  // 1 minute
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

  useEffect(() => {
    // Only start background refresh if we have user profile data
    if (!userProfile?.restaurantId) return;

    console.log('🔄 Setting up background refresh timers (excluding Orders)');

    // Setup refresh timers
    refreshTimers.current.menu = setInterval(refreshMenu, REFRESH_INTERVALS.MENU);
    refreshTimers.current.team = setInterval(refreshTeam, REFRESH_INTERVALS.TEAM);
    refreshTimers.current.transactions = setInterval(refreshTransactions, REFRESH_INTERVALS.TRANSACTIONS);
    refreshTimers.current.dashboard = setInterval(refreshDashboard, REFRESH_INTERVALS.DASHBOARD);

    // Initial refresh
    refreshMenu();
    refreshTeam();
    refreshTransactions();
    refreshDashboard();

    // Cleanup function
    return () => {
      console.log('🛑 Cleaning up background refresh timers');
      Object.values(refreshTimers.current).forEach(timer => clearInterval(timer));
    };
  }, [userProfile?.restaurantId]);

  // Add a listener for branch changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'selectedBranchId') {
        console.log('🔄 Branch changed, refreshing data (excluding Orders)');
        // Trigger immediate refresh when branch changes
        refreshMenu();
        refreshTeam();
        refreshTransactions();
        refreshDashboard();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
}; 