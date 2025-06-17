import { FunctionComponent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TWOFALoginDetails from "../components/TWOFALoginDetails";
import { useAuth } from "../hooks/useAuth";

const TWOFALogin: FunctionComponent = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Check login method and requirements
    const authToken = localStorage.getItem('authToken');
    const phoneNumber = localStorage.getItem('loginPhoneNumber');
    const userProfile = localStorage.getItem('userProfile');
    const is2FAVerified = localStorage.getItem('2faVerified');

    if (is2FAVerified === 'true') {
      // If already 2FA verified, go to dashboard
      navigate('/dashboard');
      return;
    }

    // For email login, we need auth token
    // For phone login, we need user profile and phone number
    if (!authToken && (!userProfile || !phoneNumber)) {
      navigate('/login');
    }
  }, [navigate, isAuthenticated]);

  return <TWOFALoginDetails />;
};

export default TWOFALogin;
