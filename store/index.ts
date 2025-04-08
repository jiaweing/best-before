import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { scheduleAllNotifications } from "~/services/notifications";
import { AppState, Item, ItemFormData, NotificationSettings } from "~/types";
import { generateId } from "~/utils/id";

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      items: [],
      geminiConfig: null,
      notificationSettings: {
        enabled: false,
        daysBeforeExpiry: 7,
        frequency: "daily",
      },
      notificationIds: {},
      addItem: (itemData: ItemFormData) => {
        const now = new Date().toISOString();
        const newItem: Item = {
          id: generateId(),
          ...itemData,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => {
          const updatedItems = [...state.items, newItem];

          // Reschedule notifications if enabled
          if (state.notificationSettings.enabled) {
            scheduleAllNotifications(
              updatedItems,
              state.notificationSettings.daysBeforeExpiry,
              state.notificationSettings.frequency
            ).then((ids) => {
              set({ notificationIds: ids });
            });
          }

          return { items: updatedItems };
        });
      },
      updateItem: (id: string, itemData: Partial<ItemFormData>) => {
        set((state) => {
          const updatedItems = state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  ...itemData,
                  updatedAt: new Date().toISOString(),
                }
              : item
          );

          // Reschedule notifications if enabled
          if (state.notificationSettings.enabled) {
            scheduleAllNotifications(
              updatedItems,
              state.notificationSettings.daysBeforeExpiry,
              state.notificationSettings.frequency
            ).then((ids) => {
              set({ notificationIds: ids });
            });
          }

          return { items: updatedItems };
        });
      },
      deleteItem: (id: string) => {
        set((state) => {
          const updatedItems = state.items.filter((item) => item.id !== id);

          // Reschedule notifications if enabled
          if (state.notificationSettings.enabled) {
            scheduleAllNotifications(
              updatedItems,
              state.notificationSettings.daysBeforeExpiry,
              state.notificationSettings.frequency
            ).then((ids) => {
              set({ notificationIds: ids });
            });
          }

          return { items: updatedItems };
        });
      },
      setGeminiConfig: (config) => {
        console.log(
          "Setting Gemini config in store:",
          config ? "API key provided" : "null"
        );
        set({ geminiConfig: config });
      },
      setNotificationSettings: (settings: Partial<NotificationSettings>) => {
        set((state) => {
          const updatedSettings = {
            ...state.notificationSettings,
            ...settings,
          };

          // Reschedule notifications if enabled and settings changed
          if (updatedSettings.enabled && state.items.length > 0) {
            scheduleAllNotifications(
              state.items,
              updatedSettings.daysBeforeExpiry,
              updatedSettings.frequency
            ).then((ids) => {
              set({ notificationIds: ids });
            });
          }

          return { notificationSettings: updatedSettings };
        });
      },
      setNotificationIds: (ids: Record<string, string[]>) => {
        set({ notificationIds: ids });
      },
    }),
    {
      name: "best-before-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
