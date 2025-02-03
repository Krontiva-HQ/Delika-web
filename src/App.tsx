import { Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import ForgotPasswordDetails from './components/ForgotPasswordDetails';
import LoginDetails from './components/LoginDetails';
import EnterOTP from './components/EnterOTPDetails';
import ResetPassword from './components/ResetPasswordDetails';
import Dashboard from './pages/Dashboard/Dashboard';
import Orders from './pages/Dashboard/Orders';
import Inventory from './pages/Dashboard/Inventory';
import Transactions from './pages/Dashboard/Transactions';
import Reports from './pages/Dashboard/Reports';
import Settings from './pages/Dashboard/Settings';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import AddInventory from './pages/Dashboard/AddInventory';
import TWOFALogin from './pages/TWOFALogin';
import { useEffect, useState } from 'react';
import TransactionDetailsView from './pages/Dashboard/TransactionDetails';
import OrderDetailsView from './pages/Dashboard/OrderDetails';
import LoadingSpinner from './components/LoadingSpinner';
import { checkAuthStatus } from './services/auth';
import 'react-toastify/dist/ReactToastify.css';


// Protected Route Component
const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    const is2FAVerified = localStorage.getItem('2faVerified');

    if (!isLoading) {
      if (!authToken) {
        navigate('/login');
      } else if (!is2FAVerified) {
        navigate('/2fa-login');
      }
    }
  }, [isLoading, navigate]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return null; // Let the useEffect handle the navigation
  }

  return <Outlet />;
};

// Public Route Component (redirects to dashboard if already authenticated)
const PublicRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />; // Or your loading component
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authStatus = await checkAuthStatus();
        setIsAuthenticated(authStatus);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginDetails />} />
          <Route path="/forgot-password" element={<ForgotPasswordDetails />} />
          <Route path="/enter-otp" element={<EnterOTP />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/2fa-login" element={<TWOFALogin />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard><></></Dashboard>} />
          <Route path="/orders" element={<Orders searchQuery="" onOrderDetailsView={() => {}} />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/dashboard/add-inventory" element={<AddInventory onClose={() => {/* handle close */}} branchId="" />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/dashboard/transactions/:id" element={<TransactionDetailsView orderNumber="" onBack={() => {/* handle back */}} transactionDetails={null} isLoading={false} error={null} />} />
          <Route path="/orderDetails/:id" element={<OrderDetailsView orderId="" onBack={() => {/* handle back */}} orderDetails={null} isLoading={false} error={null} />} />
        </Route>

        {/* Root redirect */}
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </LocalizationProvider>
  );
}

export default App;
