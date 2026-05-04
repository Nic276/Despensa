export interface ExpirationBatch {
  date: string;
  quantity: number;
}

export interface PantryItem {
  id: string;
  name: string;
  stock: number;
  unit: string;
  minStock: number;
  expirationDate?: string; // Kept for backward compatibility, will be the earliest date from batches
  imageUrl?: string;
  batches?: ExpirationBatch[];
  createdAt: any;
  updatedAt: any;
}

export interface Movement {
  id: string;
  itemId: string;
  type: 'ingreso' | 'retiro';
  quantity: number;
  timestamp: any;
  previousStock: number;
  newStock: number;
}

export interface ShoppingItem {
  id: string;
  name: string;
  requiredQuantity: number;
  isChecked: boolean;
  createdAt: any;
}

export type AppView = 'Inventory' | 'ShoppingList' | 'Add' | 'Details' | 'Settings';
