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
  nutritionFacts?: string; // Optional nutrition facts
  ingredients?: string; // Optional ingredients list
}

export interface ItemFormData {
  name: string;
  description: string;
  category: string;
  expiryDate: string;
  purchaseDate: string;
  imageUri: string;
  nutritionFacts?: string; // Optional nutrition facts
  ingredients?: string; // Optional ingredients list
}

export interface GeminiConfig {
  apiKey: string;
}

export interface NotificationSettings {
  enabled: boolean;
  daysBeforeExpiry: number;
  frequency: "daily" | "weekly" | "once";
}

export type PhotoType = "product" | "expiry" | "nutrition";

export interface AppState {
  items: Item[];
  geminiConfig: GeminiConfig | null;
  notificationSettings: NotificationSettings;
  notificationIds: Record<string, string[]>;
  addItem: (item: ItemFormData) => void;
  updateItem: (id: string, item: Partial<ItemFormData>) => void;
  deleteItem: (id: string) => void;
  setGeminiConfig: (config: GeminiConfig | null) => void;
  setNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  setNotificationIds: (ids: Record<string, string[]>) => void;
}
