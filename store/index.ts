import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { AppState, Item, ItemFormData } from "~/types";
import { generateId } from "~/utils/id";

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      items: [],
      geminiConfig: null,
      addItem: (itemData: ItemFormData) => {
        const now = new Date().toISOString();
        const newItem: Item = {
          id: generateId(),
          ...itemData,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          items: [...state.items, newItem],
        }));
      },
      updateItem: (id: string, itemData: Partial<ItemFormData>) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  ...itemData,
                  updatedAt: new Date().toISOString(),
                }
              : item
          ),
        }));
      },
      deleteItem: (id: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },
      setGeminiConfig: (config) => {
        console.log(
          "Setting Gemini config in store:",
          config ? "API key provided" : "null"
        );
        set({ geminiConfig: config });
      },
    }),
    {
      name: "best-before-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
