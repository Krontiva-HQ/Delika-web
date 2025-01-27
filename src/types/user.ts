export interface UserResponse {
  restaurantName: string;
  restaurantEmail: string;
  restaurantPhoneNumber: string;
  restaurantAddress: string;
  restaurantLogo?: {
    url: string;
  };
  dateOfBirth: Date | null;
} 