export const useUserProfile = () => {
  const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
  
  // Extract restaurant data from _restaurantTable array
  const restaurantData = userProfile._restaurantTable?.[0] || {};
  
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
    isAdmin 
  };
}; 