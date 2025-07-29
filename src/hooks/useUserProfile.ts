// Define the interface for restaurant data
interface RestaurantData {
  id: string; // uuid
  created_at: number;
  restaurantName: string;
  restaurantEmail: string;
  restaurantPhoneNumber: string;
  restaurantAddress: string;
  restaurantLogo: { 
    access: string;
    path: string;
    name: string;
    type: string;
    size: number;
    mime: string;
    meta: { 
      width: number;
      height: number;
    };
    url: string;
  };
  delika_onboarding_id: string; // uuid
  Inventory: boolean;
  Transactions: boolean;
  Reports: boolean;
  Overview: boolean;
  DeliveryReport: boolean;
  WalkIn: boolean;
  OnDemand: boolean;
  Batch: boolean;
  Schedule: boolean;
  language: string;
  AutoAssign: boolean;
  AutoCalculatePrice: boolean;
  FullService: boolean;
}

// Define the interface for branch data
interface BranchData {
  id: string;
  slug: string;
  branchName: string;
  activeHours: Array<{
    day: string;
    closingTime: string;
    openingTime: string;
  }>;
  restaurantID: string;
  branchLatitude: string;
  branchLocation: string;
  branchLongitude: string;
  branchPhoneNumber: string;
}

export const useUserProfile = () => {
  const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
  
  // Extract restaurant data from _restaurantTable array
  const restaurantData = userProfile._restaurantTable?.[0] || {} as RestaurantData;
  
  // Extract branch data from branchesTable
  const branchData = userProfile.branchesTable || {} as BranchData;
  
  // Check if user is admin
  const isAdmin = userProfile.role === 'Admin';

  // For Admin users, don't return branchId from auth/me
  const userData = {
    ...userProfile,
    // Remove branchId for Admin users
    branchId: isAdmin ? null : userProfile.branchId
  };
  
  return { 
    userProfile: userData,
    restaurantData,
    branchData,
    isAdmin 
  };
}; 