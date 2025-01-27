import { FunctionComponent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TWOFALoginDetails from "../components/TWOFALoginDetails";
import { useAuth } from "../hooks/useAuth";

const TWOFALogin: FunctionComponent = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Check if user came from login (has auth token)
    const authToken = localStorage.getItem('authToken');
    const is2FAVerified = localStorage.getItem('2faVerified');

    if (!authToken) {
      // If no auth token, redirect back to login
      navigate('/login');
    } else if (is2FAVerified === 'true') {
      // If already 2FA verified, go to dashboard
      navigate('/dashboard');
    }
  }, [navigate, isAuthenticated]);

  return <TWOFALoginDetails />;
};

export default TWOFALogin;
