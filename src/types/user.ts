// Business type definitions
export type BusinessType = 'restaurant' | 'grocery' | 'pharmacy';

// Base user response interface
export interface UserResponse {
  id: string;
  OTP: number;
  role: string;
  email: string;
  businessType?: 'restaurant' | 'grocery' | 'pharmacy';
  image: {
    url: string;
    meta: {
      width: number;
      height: number;
    };
    mime: string;
    name: string;
    path: string;
    size: number;
    type: string;
    access: string;
  };
  city: string;
  address: string;
  country: string;
  userName: string;
  postalCode: string;
  dateOfBirth: number | null;
  branchId: string;
  fullName: string;
  created_at: number;
  phoneNumber: string;
  restaurantId: string;
  groceryShopId?: string;
  groceryBranchId?: string;
  branchesTable: {
    id: string;
    branchName: string;
    branchLocation: string;
  };
  _restaurantTable: Array<{
    id: string;
    restaurantName: string;
    language: string;
    AutoAssign: boolean;
    AutoCalculatePrice: boolean;
  }>;
  password?: string;
}

// Business type specific interfaces
export interface RestaurantUser extends UserResponse {
  businessType: 'restaurant';
  restaurantName: string;
  restaurantEmail: string;
  restaurantPhoneNumber: string;
  restaurantAddress: string;
  restaurantLogo?: {
    url: string;
  };
}

export interface GroceryUser extends UserResponse {
  businessType: 'grocery';
  groceryName: string;
  groceryEmail: string;
  groceryPhoneNumber: string;
  groceryAddress: string;
  groceryLogo?: {
    url: string;
  };
}

export interface PharmacyUser extends UserResponse {
  businessType: 'pharmacy';
  pharmacyName: string;
  pharmacyEmail: string;
  pharmacyPhoneNumber: string;
  pharmacyAddress: string;
  pharmacyLogo?: {
    url: string;
  };
}

// Union type for all business types
export type BusinessUser = RestaurantUser | GroceryUser | PharmacyUser;

// Helper functions to determine business type from role
export const getBusinessTypeFromRole = (role: string): BusinessType => {
  if (role.startsWith('Grocery-')) {
    return 'grocery';
  } else if (role.startsWith('Pharmacy-')) {
    return 'pharmacy';
  } else {
    return 'restaurant';
  }
}; 