import { FiGrid, FiBox } from "react-icons/fi";
import { IoFastFoodOutline, IoSettingsOutline, IoAddCircleOutline } from "react-icons/io5";
import { LuCircleDollarSign, LuFileSpreadsheet } from "react-icons/lu";
import { IconType } from 'react-icons';

// Interface for restaurant permissions
export interface DashboardPermissions {
  Inventory?: boolean;      // Access to inventory management
  Extras?: boolean;         // Access to extras/modifiers management
  Transactions?: boolean;   // Access to transaction details
  Reports?: boolean;        // Access to reports functionality
  Overview?: boolean;       // Access to overview dashboard
  DeliveryReport?: boolean; // Access to delivery reports
  WalkIn?: boolean;        // Access to walk-in orders
  OnDemand?: boolean;      // Access to on-demand delivery
  Batch?: boolean;         // Access to batch orders
  Schedule?: boolean;      // Access to scheduled orders
  AutoAssign?: boolean;    // Whether to auto-assign riders
  AutoCalculatePrice?: boolean; // Whether to auto-calculate delivery prices
  FullService?: boolean;   // Access to full service delivery
  language?: string;       // Language preference
}

// Helper functions to check permissions
export const hasInventoryAccess = (permissions: DashboardPermissions): boolean => {
  return !!permissions.Inventory;
};

export const hasExtrasAccess = (permissions: DashboardPermissions): boolean => {
  return !!permissions.Extras;
};

export const hasTransactionsAccess = (permissions: DashboardPermissions): boolean => {
  return !!permissions.Transactions;
};

export const hasReportsAccess = (permissions: DashboardPermissions): boolean => {
  return !!permissions.Reports;
};

export const hasOverviewAccess = (permissions: DashboardPermissions): boolean => {
  return !!permissions.Overview;
};

export const hasDeliveryReportAccess = (permissions: DashboardPermissions): boolean => {
  return !!permissions.DeliveryReport;
};

export const hasWalkInAccess = (permissions: DashboardPermissions): boolean => {
  return !!permissions.WalkIn;
};

export const hasOnDemandAccess = (permissions: DashboardPermissions): boolean => {
  return !!permissions.OnDemand;
};

export const hasBatchAccess = (permissions: DashboardPermissions): boolean => {
  return !!permissions.Batch;
};

export const hasScheduleAccess = (permissions: DashboardPermissions): boolean => {
  return !!permissions.Schedule;
};

export const hasFullServiceAccess = (permissions: DashboardPermissions): boolean => {
  return !!permissions.FullService;
};

export const hasAutoAssign = (permissions: DashboardPermissions): boolean => {
  return !!permissions.AutoAssign;
};

export const hasAutoCalculatePrice = (permissions: DashboardPermissions): boolean => {
  return !!permissions.AutoCalculatePrice;
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
         !!permissions.Extras &&
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
      requiredPermission: "Overview"
    },
    { 
      name: "My Orders", 
      icon: FiBox,
      id: "orders", 
      requiredPermission: null 
    }
  ];

  // Only add Menu Items if Inventory permission is granted
  if (permissions.Inventory) {
    menuItems.push({ 
      name: "Menu Items", 
      icon: IoFastFoodOutline,
      id: "inventory", 
      requiredPermission: "Inventory"
    });
  }

  // Add Extras - always available
  menuItems.push({ 
    name: "Extras", 
    icon: IoAddCircleOutline,
    id: "extras", 
    requiredPermission: null
  });

  // Only add Transactions if Transactions permission is granted
  if (permissions.Transactions) {
    menuItems.push({ 
      name: "Transactions", 
      icon: LuCircleDollarSign,
      id: "transactions", 
      requiredPermission: "Transactions"
    });
  }

  // Only add Reports if Reports permission is granted
  if (permissions.Reports) {
    menuItems.push({ 
      name: "Reports", 
      icon: LuFileSpreadsheet,
      id: "reports", 
      requiredPermission: "Reports"
    });
  }

  // Settings is always available
  menuItems.push({ 
    name: "Settings", 
    icon: IoSettingsOutline,
    id: "settings", 
    requiredPermission: null 
  });

  return menuItems;
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
      requiresDeliveryReport: true
    },
    {
      id: 5,
      name: "Transaction Report",
      date: "All Time",
      format: "PDF",
      status: "Active",
      requiresTransactions: true
    }
  ];

  return allReports.filter(report => {
    if (report.requiresDeliveryReport && !permissions.DeliveryReport) return false;
    if (report.requiresTransactions && !permissions.Transactions) return false;
    return true;
  });
};

// Function to determine available delivery methods based on permissions
export const getAvailableDeliveryMethods = (permissions: DashboardPermissions) => {
  return {
    onDemand: permissions.OnDemand,
    fullService: permissions.FullService,
    schedule: permissions.Schedule,
    batchDelivery: permissions.Batch,
    walkIn: permissions.WalkIn
  };
};

// Function to determine if overview stats should show revenue
export const shouldShowRevenue = (permissions: DashboardPermissions): boolean => {
  // Show revenue if FullService OR WalkIn is true
  return !!(permissions.FullService || permissions.WalkIn);
};

// Function to determine if overview stats should show inventory
export const shouldShowInventory = (permissions: DashboardPermissions): boolean => {
  // Show inventory if FullService OR WalkIn is true
  return !!(permissions.FullService || permissions.WalkIn);
}; 