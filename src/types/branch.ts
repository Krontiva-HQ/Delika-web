export interface ActiveHours {
  day: string;
  closingTime: string;
  openingTime: string;
}

export interface Branch {
  active: boolean;
  branchUrl: string;
  branchCity: string;
  branchName: string;
  activeHours: ActiveHours[];
  restaurantID: string;
  branchLatitude: string;
  branchLocation: string;
  branchLongitude: string;
  branchPhoneNumber: string;
} 