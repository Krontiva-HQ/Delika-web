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
import { initGoogleMaps } from './utils/googleMaps';
import 'react-toastify/dist/ReactToastify.css';
import DocumentTitle from './components/DocumentTitle';
import { useUserProfile } from './hooks/useUserProfile';
import GlobalOrderModal from './components/GlobalOrderModal';


// Protected Route Component
const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  console.log('🔐 ProtectedRoute: Component rendered');
  console.log('🔐 ProtectedRoute: Auth state =', { isAuthenticated, isLoading });

  if (isLoading) {
    console.log('🔐 ProtectedRoute: Loading, showing spinner');
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    console.log('🔐 ProtectedRoute: Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('🔐 ProtectedRoute: Authenticated, rendering outlet');
  return <Outlet />;
};

// Protected Transactions Route Component (prevents Store Clerk access)
const ProtectedTransactionsRoute = () => {
  const { userProfile } = useUserProfile();
  
  // If user is Store Clerk, redirect to dashboard
  if (userProfile?.role === 'Store Clerk') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Outlet />;
};

// Public Route Component (redirects to dashboard if already authenticated)
const PublicRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  console.log('🔐 PublicRoute: Component rendered');
  console.log('🔐 PublicRoute: Auth state =', { isAuthenticated, isLoading });

  if (isLoading) {
    console.log('🔐 PublicRoute: Loading, showing spinner');
    return <LoadingSpinner />; // Or your loading component
  }

  if (isAuthenticated) {
    console.log('🔐 PublicRoute: Authenticated, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('🔐 PublicRoute: Not authenticated, rendering outlet');
  return <Outlet />;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        // Initialize Google Maps
        await initGoogleMaps();
        
        // Check authentication
        const authStatus = await checkAuthStatus();
        setIsAuthenticated(authStatus);
      } catch (error) {
        console.error('Initialization error:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DocumentTitle />
      <GlobalOrderModal />
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginDetails />} />
          <Route path="/forgot-password" element={<ForgotPasswordDetails />} />
          <Route path="/enter-otp" element={<EnterOTP />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* 2FA Login Route - accessible during login process */}
        <Route path="/2fa-login" element={<TWOFALogin />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard><></></Dashboard>} />
          <Route path="/orders" element={<Orders searchQuery="" onOrderDetailsView={() => {}} />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/dashboard/add-inventory" element={<AddInventory onClose={() => {/* handle close */}} branchId="" />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/orderDetails/:id" element={<OrderDetailsView orderId="" onBack={() => {/* handle back */}} orderDetails={null} isLoading={false} error={null} />} />
        </Route>

        {/* Protected Transactions Route */}
        <Route element={<ProtectedTransactionsRoute />}>
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/dashboard/transactions/:id" element={<TransactionDetailsView orderNumber="" onBack={() => {/* handle back */}} transactionDetails={null} isLoading={false} error={null} />} />
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
