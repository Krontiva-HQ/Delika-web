import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { api } from '../services/api';
import { useUserProfile } from '../hooks/useUserProfile';
import dayjs from 'dayjs';

interface Notification {
  id: string;
  type: 'order_created' | 'order_updated' | 'order_status' | 'inventory_alert' | 'system' | 
        'order_edited' | 'batch_completed' | 'employee_update' | 'profile_update' | 
        'password_change' | 'user_deleted';
  message: string;
  timestamp: Date;
  read: boolean;
  orderId?: string;
  time?: string;
}

interface Order {
  id: string;
  customerName: string;
  customerPhoneNumber: string;
  orderNumber: number;
  deliveryDistance: string;
  orderPrice: string;
  trackingUrl: string;
  courierName: string;
  courierPhoneNumber: string;
  orderStatus: string;
  totalPrice: string;
  orderDate: string;
  deliveryPrice: string;
  dropOff: {
    toLatitude: string;
    toLongitude: string;
    toAddress: string;
  }[];
  pickup: {
    fromLatitude: string;
    fromLongitude: string;
    fromAddress: string;
  }[];
  products: any[];
  customerImage?: string;
  pickupName: string;
  dropoffName: string;
  status: string;
  transactionStatus: string;
  paymentStatus: string;
  orderComment?: string;
  orderReceivedTime: string;
  Walkin?: boolean;
  payLater: boolean;
  payNow: boolean;
  payVisaCard: boolean;
  kitchenStatus: string;
  orderAccepted: "pending" | "accepted" | "declined";
  orderChannel: string;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  unreadCount: number;
  // Global order monitoring
  pendingOrders: Order[];
  showGlobalOrderModal: boolean;
  setShowGlobalOrderModal: (show: boolean) => void;
  acceptGlobalOrder: (orderId: string) => Promise<void>;
  declineGlobalOrder: (orderId: string) => Promise<void>;
  globalLoadingOrderIds: Set<string>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { userProfile } = useUserProfile();
  
  // Global order monitoring states
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [showGlobalOrderModal, setShowGlobalOrderModal] = useState(false);
  const [globalLoadingOrderIds, setGlobalLoadingOrderIds] = useState<Set<string>>(new Set());
  
  // Use ref instead of state for lastCheckedOrderIds to prevent re-renders
  const lastCheckedOrderIdsRef = React.useRef<Set<string>>(new Set());

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep last 50
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Global order monitoring function - memoized with stable dependencies
  const checkForGlobalNewOrders = useCallback(async () => {
    if (!userProfile?.restaurantId) return;

    try {
      let params = new URLSearchParams();
      const today = dayjs().format('YYYY-MM-DD');
      
      if (userProfile?.role === 'Store Clerk' || userProfile?.role === 'Manager') {
        params = new URLSearchParams({
          restaurantId: userProfile?.restaurantId || '',
          branchId: userProfile?.branchId || '',
          date: today
        });
      } else if (userProfile?.role === 'Admin') {
        params = new URLSearchParams({
          restaurantId: userProfile?.restaurantId || '',
          date: today
        });
      }

      const response = await api.get(`/filter/orders/by/date?${params.toString()}`);
      const latestOrders = response.data.sort((a: Order, b: Order) => 
        new Date(b.orderReceivedTime).getTime() - new Date(a.orderReceivedTime).getTime()
      );

      // Find new pending orders that need decisions
      const newPendingOrders = latestOrders.filter((order: Order) => 
        order.orderChannel === 'customerApp' && 
        order.paymentStatus === 'Paid' &&
        order.orderAccepted === 'pending'
      );

      // Check for truly new orders (not seen before)
      const newIncomingOrders = newPendingOrders.filter((order: Order) => 
        !lastCheckedOrderIdsRef.current.has(order.id)
      );

      console.log('🌍 Global order check:', {
        totalOrders: latestOrders.length,
        pendingOrders: newPendingOrders.length,
        newIncomingOrders: newIncomingOrders.length,
        lastCheckedSize: lastCheckedOrderIdsRef.current.size
      });

      // Update pending orders only if there's a change
      if (JSON.stringify(pendingOrders) !== JSON.stringify(newPendingOrders)) {
        setPendingOrders(newPendingOrders);
      }

      // If there are new orders, show modal and play sound
      if (newIncomingOrders.length > 0) {
        console.log('🔔 New orders detected globally! Playing sound...');
        
        setShowGlobalOrderModal(true);
        
        // Play audio with better error handling
        const audio = new Audio('/orderRinging.mp3');
        audio.volume = 0.8;
        
        audio.play()
          .then(() => {
            console.log('✅ Global audio played successfully');
          })
          .catch((error) => {
            console.error('❌ Global audio play failed:', error);
            
            // Show visual notification if audio fails
            addNotification({
              type: 'order_created',
              message: `🔔 New order received! #${newIncomingOrders[0].orderNumber} (Audio blocked)`
            });
          });

        // Add notification for each new order
        newIncomingOrders.forEach((order: Order) => {
          addNotification({
            type: 'order_created',
            message: `New order #${order.orderNumber} from ${order.customerName}`,
            orderId: order.id
          });
        });
      }

      // Update the last checked order IDs using ref
      lastCheckedOrderIdsRef.current = new Set(latestOrders.map((order: Order) => order.id));

    } catch (error) {
      console.error('Error in global order check:', error);
    }
  }, [userProfile?.restaurantId, userProfile?.role, userProfile?.branchId, addNotification]);

  // Global order polling - runs every 5 seconds regardless of current page
  useEffect(() => {
    if (!userProfile?.restaurantId) return;

    console.log('🌍 Starting global order monitoring... (Every 5 seconds from any page)');
    
    // Initial check
    checkForGlobalNewOrders();

    // Set up polling every 5 seconds (faster than the Orders page)
    const pollInterval = setInterval(checkForGlobalNewOrders, 5000);

    return () => {
      console.log('🌍 Stopping global order monitoring');
      clearInterval(pollInterval);
    };
  }, [userProfile?.restaurantId, checkForGlobalNewOrders]);

  // Accept order function
  const acceptGlobalOrder = useCallback(async (orderId: string) => {
    const order = pendingOrders.find(o => o.id === orderId);
    if (!order) return;

    setGlobalLoadingOrderIds(prev => new Set(prev).add(`accept_${orderId}`));

    try {
      await api.patch('/accept/decline/orders', {
        orderNumber: order.orderNumber,
        orderAccepted: "accepted"
      });

      // Remove from pending orders
      setPendingOrders(prev => prev.filter(o => o.id !== orderId));

      addNotification({
        type: 'order_created',
        message: `✅ Accepted order #${order.orderNumber}`
      });

      // If no more pending orders, close modal
      const remainingPending = pendingOrders.filter(o => o.id !== orderId);
      if (remainingPending.length === 0) {
        setShowGlobalOrderModal(false);
      }

    } catch (error) {
      console.error('Failed to accept order globally:', error);
      addNotification({
        type: 'order_status',
        message: 'Failed to accept order. Please try again.'
      });
    } finally {
      setGlobalLoadingOrderIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(`accept_${orderId}`);
        return newSet;
      });
    }
  }, [pendingOrders, addNotification]);

  // Decline order function
  const declineGlobalOrder = useCallback(async (orderId: string) => {
    const order = pendingOrders.find(o => o.id === orderId);
    if (!order) return;

    setGlobalLoadingOrderIds(prev => new Set(prev).add(`decline_${orderId}`));

    try {
      await api.patch('/accept/decline/orders', {
        orderNumber: order.orderNumber,
        orderAccepted: "declined"
      });

      // Remove from pending orders
      setPendingOrders(prev => prev.filter(o => o.id !== orderId));

      addNotification({
        type: 'order_status',
        message: `❌ Declined order #${order.orderNumber}`
      });

      // If no more pending orders, close modal
      const remainingPending = pendingOrders.filter(o => o.id !== orderId);
      if (remainingPending.length === 0) {
        setShowGlobalOrderModal(false);
      }

    } catch (error) {
      console.error('Failed to decline order globally:', error);
      addNotification({
        type: 'order_status',
        message: 'Failed to decline order. Please try again.'
      });
    } finally {
      setGlobalLoadingOrderIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(`decline_${orderId}`);
        return newSet;
      });
    }
  }, [pendingOrders, addNotification]);

  const value: NotificationContextType = {
    notifications,
    addNotification,
    markAsRead,
    clearAll,
    removeNotification,
    clearAllNotifications,
    unreadCount,
    pendingOrders,
    showGlobalOrderModal,
    setShowGlobalOrderModal,
    acceptGlobalOrder,
    declineGlobalOrder,
    globalLoadingOrderIds
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}; 