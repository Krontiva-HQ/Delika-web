import { FC } from 'react';
import { IoIosCloseCircleOutline } from "react-icons/io";
import { FiPackage, FiUser, FiDollarSign, FiBox, FiLock, FiEdit } from 'react-icons/fi';
import { useNotifications } from '../context/NotificationContext';

type NotificationType = 'order_created' | 'order_status' | 'inventory_update' | 'transaction_status' | 
                       'employee_update' | 'profile_update' | 'password_change' | 'user_deleted' | 
                       'user_added' | 'order_edited';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationsModal: FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const { notifications, markAsRead, removeNotification } = useNotifications();

  if (!isOpen) return null;

  const handleNotificationClick = (notificationId: string) => {
    markAsRead(notificationId);
    // Optional: Add a small delay before removing the notification
    setTimeout(() => {
      removeNotification(notificationId);
    }, 500);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order_created':
      case 'order_status':
        return <FiPackage />;
      case 'order_edited':
        return <FiEdit />;
      case 'inventory_update':
        return <FiBox />;
      case 'transaction_status':
        return <FiDollarSign />;
      case 'employee_update':
      case 'profile_update':
      case 'user_deleted':
      case 'user_added':
        return <FiUser />;
      case 'password_change':
        return <FiLock />;
      default:
        return <FiPackage />;
    }
  };

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div 
        className="absolute top-16 right-4 w-[400px] bg-white dark:bg-black rounded-lg shadow-lg border border-gray-100 dark:border-gray-800"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h2 className="font-['Inter'] text-lg font-semibold text-gray-900 dark:text-white">Notifications</h2>
          <button onClick={onClose} className="bg-transparent">
            <IoIosCloseCircleOutline className="w-6 h-6 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
          </button>
        </div>
        <div className="max-h-[500px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400 font-['Inter']">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer font-['Inter']
                  ${notification.read ? 'opacity-70' : ''}`}
                onClick={() => handleNotificationClick(notification.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    notification.type === 'order_edited' 
                      ? 'bg-[#fd683e] bg-opacity-10' 
                      : 'bg-[#00B087] bg-opacity-10'
                  }`}>
                    <div className={`w-8 h-8 flex items-center justify-center ${
                      notification.type === 'order_edited'
                        ? 'text-[#fd683e]'
                        : 'text-[#00B087]'
                    }`}>
                      {getIcon(notification.type)}
                    </div>
                  </div>
                  <div className="flex-1 -mt-4">
                    <h3 className="font-['Inter'] text-sm text-gray-900 dark:text-white font-medium">
                      {notification.message.split('**').map((part, index) => 
                        index % 2 === 1 ? (
                          <span key={index} className={
                            notification.type === 'order_edited'
                              ? 'text-[#fd683e]'
                              : 'text-[#00B087]'
                          }>
                            {part}
                          </span>
                        ) : (
                          part
                        )
                      )}
                    </h3>
                    <span className="text-xs text-gray-400 font-['Inter']">{notification.time}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal; 