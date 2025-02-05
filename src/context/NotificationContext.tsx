import { createContext, useContext, useState, ReactNode, useEffect, FC } from 'react';

type NotificationType = 'order_created' | 'order_status' | 'inventory_update' | 'transaction_status' | 
                       'employee_update' | 'profile_update' | 'password_change' | 'user_deleted' | 
                       'user_added' | 'order_edited';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  time: string;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  markAsRead: (id: string) => void;
  removeNotification: (id: string) => void;
  addNotification: (notification: {
    type: 'order_created' | 'order_status' | 'inventory_update' | 'transaction_status' | 
          'employee_update' | 'profile_update' | 'password_change' | 'user_deleted' | 
          'user_added' | 'order_edited';
    message: string;
  }) => void;
  deleteNotification: (id: string) => void;
  unreadCount: number;
}

export const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  markAsRead: () => {},
  removeNotification: () => {},
  addNotification: () => {},
  deleteNotification: () => {},
  unreadCount: 0,
});

export const NotificationProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const savedNotifications = localStorage.getItem('notifications');
    return savedNotifications ? JSON.parse(savedNotifications) : [];
  });

  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== id)
    );
  };

  const addNotification = (notification: {
    type: 'order_created' | 'order_status' | 'inventory_update' | 'transaction_status' | 
           'employee_update' | 'profile_update' | 'password_change' | 'user_deleted' | 'user_added' | 'order_edited';
    message: string;
  }) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        markAsRead,
        removeNotification,
        addNotification,
        deleteNotification,
        unreadCount
      }}
    >
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