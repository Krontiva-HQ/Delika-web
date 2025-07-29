export interface InventoryDetail {
  id: string;
  foodName: string;
  foodPrice: number;
  foodDescription: string;
}

export interface ExtraDetail {
  delika_inventory_table_id: string;
  minSelection?: number;
  maxSelection?: number;
  inventoryDetails: InventoryDetail[];
}

export interface ExtraGroup {
  delika_extras_table_id: string;
  extrasDetails: {
    id: string;
    extrasTitle: string;
    extrasType: string;
    required: boolean;
    extrasDetails: ExtraDetail[];
  };
}

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