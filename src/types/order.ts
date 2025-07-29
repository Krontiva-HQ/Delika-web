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
  orderNumber: string;
  customerName: string;
  customerPhoneNumber: string;
  orderStatus: string;
  paymentStatus: string;
  orderPrice: string;
  deliveryPrice: string;
  totalPrice: string;
  deliveryDistance: string;
  orderReceivedTime: string;
  orderDate: string;
  pickupName: string;
  dropoffName: string;
  orderComment?: string;
  payNow: boolean;
  payLater: boolean;
  payVisaCard: boolean;
  Walkin: boolean;
  pickup: Array<{
    fromLatitude: string;
    fromLongitude: string;
    fromAddress: string;
  }>;
  dropOff: Array<{
    toLatitude: string;
    toLongitude: string;
    toAddress: string;
  }>;
  products: Array<{
    name: string;
    price: string;
    quantity: string;
    foodImage: {
      url: string;
      filename: string;
      type: string;
      size: number;
    };
    extras?: Array<{
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
    }>;
  }>;
} 