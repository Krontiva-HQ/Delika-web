import { FiGrid, FiBox } from "react-icons/fi";
import { IoFastFoodOutline, IoSettingsOutline } from "react-icons/io5";
import { LuCircleDollarSign, LuFileSpreadsheet } from "react-icons/lu";
import { IconType } from 'react-icons';

// Interface for restaurant permissions
export interface DashboardPermissions {
  Reports?: boolean;      // Access to reports functionality
  Inventory?: boolean;    // Access to inventory management
  Transactions?: boolean; // Access to transaction details
  WalkIn?: boolean;      // Access to walk-in orders
  AutoCalculatePrice?: boolean; // Whether to auto-calculate delivery prices
}

// Helper functions to check permissions
export const hasReportsAccess = (permissions: DashboardPermissions): boolean => {
  return !!permissions.Reports;
};

export const hasInventoryAccess = (permissions: DashboardPermissions): boolean => {
  return !!permissions.Inventory;
};

export const hasTransactionsAccess = (permissions: DashboardPermissions): boolean => {
  return !!permissions.Transactions;
};

export const hasWalkInAccess = (permissions: DashboardPermissions): boolean => {
  return permissions.WalkIn !== false; // Default to true if undefined
};

export const hasAutoCalculatePrice = (permissions: DashboardPermissions): boolean => {
  return permissions.AutoCalculatePrice ?? true; // Default to true if undefined
};

// Function to calculate delivery fee
export const calculateDeliveryFee = (distance: number): number => {
  if (distance <= 1) {
    return 15; // Fixed fee for distances up to 1km
  } else if (distance <= 2) {
    return 20; // Fixed fee for distances between 1km and 2km
  } else if (distance <= 10) {
    // For distances > 2km and <= 10km: 17 cedis base price + 2.5 cedis per km beyond 2km
    return 17 + ((distance - 2) * 2.5);
  } else {
    // For distances above 10km: 3.5 * distance + 20
    return (3.5 * distance) + 20;
  }
};

// Function to get delivery price info
export const getDeliveryPriceInfo = (permissions: DashboardPermissions, distance: number | null) => {
  const autoCalculate = hasAutoCalculatePrice(permissions);
  const suggestedPrice = distance ? Math.round(calculateDeliveryFee(distance)) : null;

  return {
    autoCalculate,
    suggestedPrice: suggestedPrice ? `${suggestedPrice}.00` : '',
    showSuggestedPrice: !autoCalculate && suggestedPrice !== null
  };
};

// Function to check if all special permissions are granted
export const hasAllSpecialPermissions = (permissions: DashboardPermissions): boolean => {
  return !!permissions.Reports && 
         !!permissions.Inventory && 
         !!permissions.Transactions;
};

interface MenuItem {
  name: string;
  icon: IconType;
  id: string;
  requiredPermission: string | null;
}

// Function to determine available menu items based on permissions
export const getAvailableMenuItems = (permissions: DashboardPermissions): MenuItem[] => {
  const menuItems: MenuItem[] = [
    { 
      name: "Overview", 
      icon: FiGrid,
      id: "dashboard", 
      requiredPermission: null 
    },
    { 
      name: "My Orders", 
      icon: FiBox,
      id: "orders", 
      requiredPermission: null 
    },
    { 
      name: "Menu Items", 
      icon: IoFastFoodOutline,
      id: "inventory", 
      requiredPermission: "Inventory" 
    },
    { 
      name: "Transactions", 
      icon: LuCircleDollarSign,
      id: "transactions", 
      requiredPermission: "Transactions" 
    },
    { 
      name: "Reports", 
      icon: LuFileSpreadsheet,
      id: "reports", 
      requiredPermission: null 
    },
    { 
      name: "Settings", 
      icon: IoSettingsOutline,
      id: "settings", 
      requiredPermission: null 
    }
  ];

  return menuItems.filter(item => {
    if (!item.requiredPermission) return true;
    return !permissions[item.requiredPermission as keyof DashboardPermissions];
  });
};

// Function to determine available reports based on permissions
export const getAvailableReports = (permissions: DashboardPermissions) => {
  const allReports = [
    {
      id: 1,
      name: "Orders Report",
      date: "All Time",
      format: "PDF",
      status: "Active",
      requiresPermissions: false
    },
    {
      id: 2,
      name: "Top Sold Items",
      date: "All Time",
      format: "PDF",
      status: "Active",
      requiresPermissions: false
    },
    {
      id: 3,
      name: "Customer Report",
      date: "All Time",
      format: "PDF",
      status: "Active",
      requiresPermissions: false
    },
    {
      id: 4,
      name: "Delivery Report",
      date: "All Time",
      format: "PDF",
      status: "Active",
      requiresPermissions: false
    },
    {
      id: 5,
      name: "Transaction Report",
      date: "All Time",
      format: "PDF",
      status: "Active",
      requiresPermissions: false
    }
  ];

  if (hasAllSpecialPermissions(permissions)) {
    return allReports.filter(report => report.requiresPermissions === true);
  }
  
  return allReports.filter(report => {
    // Always show Delivery Report
    if (report.name === "Delivery Report") return true;
    return report.requiresPermissions === false;
  });
};

// Function to determine available delivery methods based on permissions
export const getAvailableDeliveryMethods = (permissions: DashboardPermissions) => {
  return {
    onDemand: hasWalkInAccess(permissions),
    fullService: !hasInventoryAccess(permissions) && !hasTransactionsAccess(permissions),
    schedule: true, // Always available
    batchDelivery: true, // Always available
    walkIn: true // Always available
  };
}; 