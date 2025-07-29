export interface SelectedItemExtra {
  delika_extras_table_id: string;
  extrasDetails: {
    id: string;
    extrasTitle: string;
    extrasType: string;
    required: boolean;
    extrasDetails: Array<{
      delika_inventory_table_id: string;
      minSelection?: number;
      maxSelection?: number;
      inventoryDetails: Array<{
        id: string;
        foodName: string;
        foodPrice: number;
        foodDescription: string;
      }>;
    }>;
  };
}

export interface SelectedItem {
  name: string;
  quantity: number;
  price: number;
  image: string;
  extras?: SelectedItemExtra[];
}

export interface MenuItemData {
  name: string;
  price: string | number;
  available: boolean;
  image?: string;
  foodImage?: {
    url: string;
    filename: string;
    type: string;
    size: number;
  };
  extras?: SelectedItemExtra[];
}

export interface Order {
  id: string;
  orderNumber: string | number;
  customerName: string;
  customerPhone: string;
  customerPhoneNumber: string;
  customerEmail: string;
  deliveryAddress: string;
  orderItems: SelectedItem[];
  products: any[];
  totalAmount: number;
  totalPrice: string;
  orderPrice: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  orderStatus: string;
  orderDate: string;
  deliveryTime?: string;
  deliveryPrice: string;
  deliveryDistance: string;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'Pending' | 'Paid';
  orderComment?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  Walkin: boolean;
  pickup: any[];
  dropOff: any[];
  pickupName: string;
  dropoffName: string;
  payNow: boolean;
  payLater: boolean;
  payVisaCard: boolean;
  orderReceivedTime?: string;
  orderChannel?: string;
  orderAccepted?: "pending" | "accepted" | "declined";
  kitchenStatus?: string;
  customerImage?: string;
  trackingUrl?: string;
  courierName?: string;
  courierPhoneNumber?: string;
  transactionStatus?: string;
} 