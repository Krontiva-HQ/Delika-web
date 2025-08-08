import { FunctionComponent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TWOFALoginDetails from "../components/TWOFALoginDetails";
import { useAuth } from "../hooks/useAuth";

const TWOFALogin: FunctionComponent = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  console.log('🔐 TWOFALogin: Component mounted');
  console.log('🔐 TWOFALogin: isAuthenticated =', isAuthenticated);

  useEffect(() => {
    console.log('🔐 TWOFALogin: useEffect triggered');
    
    // Check login method and requirements
    const authToken = localStorage.getItem('authToken');
    const phoneNumber = localStorage.getItem('loginPhoneNumber');
    const userProfile = localStorage.getItem('userProfile');
    const is2FAVerified = localStorage.getItem('2faVerified');

    console.log('🔐 TWOFALogin: Local storage check =', {
      authToken: !!authToken,
      phoneNumber: !!phoneNumber,
      userProfile: !!userProfile,
      is2FAVerified: is2FAVerified
    });

    if (is2FAVerified === 'true') {
      console.log('🔐 TWOFALogin: Already 2FA verified, navigating to dashboard');
      // If already 2FA verified, go to dashboard
      navigate('/dashboard');
      return;
    }

    // For email login, we need auth token
    // For phone login, we need user profile and phone number
    if (!authToken && (!userProfile || !phoneNumber)) {
      console.log('🔐 TWOFALogin: Missing required auth data, navigating to login');
      navigate('/login');
    } else {
      console.log('🔐 TWOFALogin: Auth data present, rendering 2FA component');
    }
  }, [navigate, isAuthenticated]);

  console.log('🔐 TWOFALogin: Rendering TWOFALoginDetails');
  return <TWOFALoginDetails />;
};

export default TWOFALogin;
