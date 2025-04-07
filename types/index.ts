export interface Item {
  id: string;
  name: string;
  description: string;
  category: string;
  expiryDate: string; // ISO date string
  purchaseDate: string; // ISO date string
  imageUri: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface ItemFormData {
  name: string;
  description: string;
  category: string;
  expiryDate: string;
  purchaseDate: string;
  imageUri: string;
}

export interface GeminiConfig {
  apiKey: string;
}

export type PhotoType = "product" | "expiry";

export interface AppState {
  items: Item[];
  geminiConfig: GeminiConfig | null;
  addItem: (item: ItemFormData) => void;
  updateItem: (id: string, item: Partial<ItemFormData>) => void;
  deleteItem: (id: string) => void;
  setGeminiConfig: (config: GeminiConfig | null) => void;
}
