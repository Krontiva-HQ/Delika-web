import { FunctionComponent, ReactNode, useState, useEffect } from "react";
import { FiGrid, FiBox } from "react-icons/fi";
import { IoFastFoodOutline, IoSettingsOutline, IoNotifications } from "react-icons/io5";
import { HiOutlineUsers } from "react-icons/hi";
import { LuCircleDollarSign, LuFileSpreadsheet } from "react-icons/lu";
import { Search, Bell, User } from "lucide-react";
import Transactions from "./Transactions";
import SettingsPage from "./Settings";
import Reports from "./Reports";
import Orders from "./Orders";
import Overview from "./Overview";
import Inventory from "./Inventory";
import { Button, Menu, MenuItem } from "@mui/material";
import { IoIosHelpCircleOutline, IoMdMoon, IoMdNotificationsOutline, IoMdSunny } from "react-icons/io";
import { FaRegMoon, FaChevronDown } from "react-icons/fa";
import { CiSearch, CiMenuBurger } from "react-icons/ci";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import NotificationsModal from '../../components/NotificationsModal';
import { IoIosArrowDropdown, IoIosCloseCircleOutline } from "react-icons/io";
import { useNotifications } from '../../context/NotificationContext';
import { useUserProfile } from '../../hooks/useUserProfile';
import { IoIosClose } from "react-icons/io";

interface MainDashboardProps {
  children: ReactNode;
}

const MainDashboard: FunctionComponent<MainDashboardProps> = ({ children }) => {
  const navigate = useNavigate();
  const { fetchUserProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [vuesaxlineararrowDownAnchorEl, setVuesaxlineararrowDownAnchorEl] =
    useState<HTMLElement | null>(null);
  const vuesaxlineararrowDownOpen = Boolean(vuesaxlineararrowDownAnchorEl);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTheme, setActiveTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { notifications } = useNotifications();
  const { userProfile } = useUserProfile();
  const restaurantData = userProfile._restaurantTable?.[0] || {};
  const [isViewingOrderDetails, setIsViewingOrderDetails] = useState(false);
  
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(activeTheme);
    localStorage.setItem('theme', activeTheme);
  }, [activeTheme]);

  const handleVuesaxlineararrowDownClick = (event: React.MouseEvent<HTMLElement>) => {
    setVuesaxlineararrowDownAnchorEl(event.currentTarget);
  };
  
  const handleVuesaxlineararrowDownClose = () => {
    setVuesaxlineararrowDownAnchorEl(null);
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userProfile');
    handleVuesaxlineararrowDownClose();
    navigate('/login');
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleViewChange = (view: string) => {
    setActiveView(view);
    setSearchQuery('');
  };

  // Filter menu items based on restaurant permissions
  const menuItems = [
    // Only show Overview if permissions are true
    { name: "Overview", icon: <FiBox size={24} />, id: "dashboard" },
    { name: "My Orders", icon: <FiBox size={24} />, id: "orders" },
    // Only show these items if the corresponding permission is false
    ...(!restaurantData.Inventory ? [{ name: "Menu Items", icon: <IoFastFoodOutline size={24} />, id: "inventory" }] : []),
    ...(!restaurantData.Transactions ? [{ name: "Transactions", icon: <LuCircleDollarSign size={24} />, id: "transactions" }] : []),
    {name : "Reports", icon: <LuFileSpreadsheet size={24} />, id: "reports"},
    { name: "Settings", icon: <IoSettingsOutline size={24} style={{ fontWeight: 'bold', strokeWidth: '1.5' }}/>, id: "settings" },
  ];

  useEffect(() => {
    const initializeDashboard = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        await fetchUserProfile();
        setIsLoading(false);
        // Set default view based on permissions
        if (!restaurantData.Inventory && !restaurantData.Transactions) {
          setActiveView('dashboard');
        } else {
          setActiveView('orders'); // Set to 'orders' as default when Overview should be hidden
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        localStorage.removeItem('authToken');
        navigate('/login');
      }
    };

    initializeDashboard();
  }, [navigate, fetchUserProfile]);

  const renderContent = () => {
    if (!restaurantData.Inventory && !restaurantData.Transactions && activeView === 'dashboard') {
      return <Overview setActiveView={setActiveView} />;
    }

    switch (activeView) {
      case 'orders':
        return <Orders 
          searchQuery={searchQuery} 
          onOrderDetailsView={(viewing: boolean) => setIsViewingOrderDetails(viewing)} 
        />;
      case 'inventory':
        return <Inventory />;
      case 'transactions':
        return <Transactions />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Orders 
          searchQuery={searchQuery} 
          onOrderDetailsView={(viewing: boolean) => setIsViewingOrderDetails(viewing)} 
        />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden">
      {/* Side Menu - Hide on screens smaller than 1024px */}
      <aside className="hidden lg:block w-[240px] bg-white border-r-[1px] border-solid border-[rgba(167,161,158,0.2)]">
        <div className="p-[10px] flex flex-col h-full justify-between">
          {/* Top Section with Logo and Main Menu */}
          <div className="flex flex-col gap-[10px]">
            {/* Logo */}
            <div className="w-[180px] h-[70px] flex items-center justify-center">
              <img
                className="w-[180px] h-[70px] object-contain"
                alt="Delika Dashboard Logo"
                src="/DashboardLogo.png"
              />
            </div>

            {/* Menu Items */}
            <div className="flex flex-col items-start justify-start gap-[8px]">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleViewChange(item.id)}
                  className={`cursor-pointer border-none p-0 w-[200px] h-[40px] flex flex-row items-center justify-start gap-[12px] rounded-tr-[8px] rounded-br-[8px] relative ${
                    activeView === item.id 
                      ? 'bg-[rgba(254,91,24,0.05)]'
                      : 'bg-transparent'
                  }`}
                >
                  {/* Orange vertical line */}
                  <div className={`w-[2px] rounded-[8px] bg-[#fe5b18] h-[40px] absolute left-0 transition-opacity duration-200 ${
                    activeView === item.id 
                      ? 'opacity-100'
                      : 'opacity-0'
                  }`} />

                  {/* Icon */}
                  <span className={`pl-[12px] ${
                    activeView === item.id 
                      ? 'text-[#fe5b18]'
                      : 'text-[#201a18]'
                  }`}>
                    {item.icon}
                  </span>

                  {/* Text */}
                  <span className={`text-[14px] font-sans text-left ${
                    activeView === item.id 
                      ? 'text-[#fe5b18]'
                      : 'text-[#201a18]'
                  }`}>
                    {item.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Section with Settings and Theme Toggle */}
          <div className="flex flex-col gap-1 mb-4">
            
            {/* Krontiva Footer Logo */}
            <div className="text-center border-t mr-[100px] mt-4">
                <p className="text-gray-500 text-xs mb-1 font-sans"> Powered By</p>
                <img
                  src="/Krontiva-Black.png"
                  alt="Powered by Krontiva"
                  className="h-6 mx-auto"
                />
              </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="bg-white border-b border-gray-200 px-4 py-2">
          <div className="flex items-center justify-between">
            {/* Hamburger Menu - Show on screens smaller than 1024px */}
            <button 
              onClick={handleMobileMenuToggle}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <CiMenuBurger className="w-6 h-6 text-gray-700" />
            </button>

            {/* Search Bar */}
            <div className={`hidden lg:flex flex-1 max-w-[200px] px-2 py-1 border-[1px] border-solid 
              border-[rgba(167,161,158,0.1)] rounded-[8px] ml-[10px] relative ${
                activeView === 'dashboard' || 
                activeView === 'settings' || 
                activeView === 'reports' ||
                isViewingOrderDetails
                  ? 'opacity-0 pointer-events-none' 
                  : ''
              }`}>
              <div className="flex items-center w-full">
                <CiSearch className="w-4 h-4 text-[#a7a19e]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search"
                  className="flex-1 ml-2 bg-transparent border-none outline-none text-sm text-[#201a18] placeholder-[#a7a19e]"
                />
                {searchQuery && (
                 <button
                 onClick={() => setSearchQuery('')}
                 className="flex items-center justify-center rounded-full bg-transparent p-0 m-0 border-none"
               >
                 <IoIosCloseCircleOutline className="w-4 h-4 text-[#201a18]" />
               </button>
               
                
                )}
              </div>
            </div>

            {/* Right Section */}
            <div className="flex flex-1 lg:flex-none flex-row items-center justify-end gap-[8px] mr-[10px]">
              <summary className="w-[160px] relative h-[40px]">
                <div className="absolute top-[0px] left-[0px] rounded-[8px] border-[rgba(167,161,158,0.1)] border-[1px] border-solid box-border w-[160px] h-[40px]" />
                <img
                  className="absolute top-[5px] left-[5px] rounded-[20px] w-[30px] h-[30px] object-cover"
                  alt={`${userProfile.userName || 'User'}'s profile`}
                  src={userProfile.image?.url || '/default-profile.jpg'}
                />
                <div className="absolute top-[5px] left-[40px] font-sans text-[14px]">
                  {`${userProfile.userName || userProfile.fullName || 'User'}`}
                  <div className="text-[10px] text-gray-500 font-sans">
                    {userProfile.role || 'Role not specified'}
                  </div>
                </div>
                <div className="absolute top-[10px] left-[130px] relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setVuesaxlineararrowDownAnchorEl(vuesaxlineararrowDownAnchorEl ? null : e.currentTarget);
                    }}
                    className="flex items-center font-sans bg-transparent"
                  >
                    <IoIosArrowDropdown className="w-[18px] h-[18px] text-[#201a18]" />
                  </button>
                  {/* Dropdown menu */}
                  {vuesaxlineararrowDownOpen && (
                    <div className="absolute right-0 mt-2 w-40 rounded-md shadow-lg z-20 border">
                      <button
                        onClick={handleLogout}
                        className="w-[70px] text-left px-2 py-1 text-[12px] font-sans-serif bg-white"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </summary>
              <div className="relative">
                <div 
                  className="w-[40px] rounded-[8px] bg-[rgba(167,161,158,0.1)] h-[40px] flex flex-row items-center justify-center p-[5px] box-border cursor-pointer"
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                >
                  <IoMdNotificationsOutline className="w-[24px] h-[24px] text-[#201a18]" />
                  {notifications.length > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-[20px] h-[20px] rounded-full flex items-center justify-center font-['Inter']">
                      {notifications.length > 9 ? '9+' : notifications.length}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Section */}
        <div className="flex-1 overflow-auto">
          {renderContent()}
        </div>
      </div>

      {/* Mobile/Tablet Menu with Animation - Show on screens smaller than 1024px */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            {/* Overlay with fade animation */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50" 
              onClick={handleMobileMenuToggle}
            />
            {/* Side Menu with slide animation */}
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-[240px] bg-white shadow-xl overflow-y-auto"
            >
              <div className="p-[10px] flex flex-col h-full">
                {/* Close button */}
                <button
                  onClick={handleMobileMenuToggle}
                  className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
                >
                  <IoIosCloseCircleOutline size={24} className="text-gray-500" />
                </button>

                {/* Logo */}
                <div className="w-[180px] h-[70px] flex items-center justify-center">
                  <img
                    className="w-[180px] h-[70px] object-contain"
                    alt="Delika Dashboard Logo"
                    src="/DashboardLogo.png"
                  />
                </div>

                {/* Menu Items */}
                <div className="flex flex-col items-start justify-start gap-[8px] mt-4">
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        handleViewChange(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`cursor-pointer border-none p-0 w-full h-[40px] flex flex-row items-center justify-start gap-[12px] rounded-tr-[8px] rounded-br-[8px] relative ${
                        activeView === item.id 
                          ? 'bg-[rgba(254,91,24,0.05)]'
                          : 'bg-transparent'
                      }`}
                    >
                      {/* Orange vertical line */}
                      <div className={`w-[2px] rounded-[8px] bg-[#fe5b18] h-[40px] absolute left-0 transition-opacity duration-200 ${
                        activeView === item.id 
                          ? 'opacity-100'
                          : 'opacity-0'
                      }`} />

                      {/* Icon */}
                      <span className={`pl-[12px] ${
                        activeView === item.id 
                          ? 'text-[#fe5b18]'
                          : 'text-[#201a18]'
                      }`}>
                        {item.icon}
                      </span>

                      {/* Text */}
                      <span className={`text-[14px] font-sans text-left ${
                        activeView === item.id 
                          ? 'text-[#fe5b18]'
                          : 'text-[#201a18]'
                      }`}>
                        {item.name}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Footer */}
                <div className="mt-auto pb-4">
                  <div className="text-center border-t pt-4">
                    <p className="text-gray-500 text-xs mb-1 font-sans">Powered By</p>
                    <img
                      src="/Krontiva-Black.png"
                      alt="Powered by Krontiva"
                      className="h-6 mx-auto"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <NotificationsModal 
        isOpen={isNotificationsOpen} 
        onClose={() => setIsNotificationsOpen(false)} 
      />
    </div>
  );
};

export default MainDashboard;