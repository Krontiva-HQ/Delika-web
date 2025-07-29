import { useEffect } from 'react';
import { useUserProfile } from '../hooks/useUserProfile';

const DocumentTitle = () => {
  const { userProfile, restaurantData } = useUserProfile();

  useEffect(() => {
    const baseTitle = 'Delika';
    const token = localStorage.getItem('authToken');
    
    if (token && restaurantData?.restaurantName) {
      document.title = `${baseTitle} - ${restaurantData.restaurantName}`;
    } else {
      document.title = `${baseTitle} - Driven by you`;
    }
  }, [restaurantData?.restaurantName]);

  return null;
};

export default DocumentTitle; 