import { useOrderNotifications } from '../hooks/useOrderNotifications';

// Add this at the top of the file
interface Order {
  id: string;
  customerName: string;
  orderNumber: number;
  orderStatus: string;
  pickupName: string;
  dropoffName: string;
  status: string;
  transactionStatus: string;
  paymentStatus: string;
  // ... add other properties your Order type needs
}

interface OrderItem {
  quantity: number;
  name: string;
}

// Then use it in your component props
interface OrderProcessingProps {
  order: Order;
  // ... other props
}

// Inside your component:
const { isSending, error } = useOrderNotifications();

// When an order is placed:
const handleOrderPlaced = async (order: Order) => {
  // ... your existing order processing logic ...
}; 