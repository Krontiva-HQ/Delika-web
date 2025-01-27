import { FunctionComponent, useEffect } from "react";
import LoginDetails from "../components/LoginDetails";
import { EmailProvider } from '../context/EmailContext';

const Login: FunctionComponent = () => {
  useEffect(() => {
    // Remove any existing theme classes when entering login page
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('theme');
    
    return () => {
      // Restore the theme when component unmounts
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        document.documentElement.classList.add(savedTheme);
      }
    };
  }, []);

  return (
    <EmailProvider>
      <div className="min-h-screen bg-white">
        <LoginDetails />
      </div>
    </EmailProvider>
  );
};

export default Login;
