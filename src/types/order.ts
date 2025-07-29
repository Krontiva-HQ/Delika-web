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