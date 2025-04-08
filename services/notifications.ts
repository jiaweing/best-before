import { differenceInDays, parseISO } from "date-fns";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Alert, Platform } from "react-native";
import { Item } from "~/types";

// Flag to track if notifications are supported
let notificationsSupported = true;

// Check if we're in Expo Go or a development build
const isExpoGo = Constants.appOwnership === "expo";

// Fallback projectId for testing in Expo Go
// In a real app, this should be your actual Expo project ID
const FALLBACK_PROJECT_ID = "your-expo-project-id";

// Get the projectId from app.json or use fallback
const getProjectId = () => {
  // Try to get from app.json via Constants
  const configProjectId = Constants.expoConfig?.extra?.eas?.projectId;

  // If we have a projectId in the config, use it
  if (configProjectId) {
    return configProjectId;
  }

  // Otherwise use the fallback
  return FALLBACK_PROJECT_ID;
};

// Helper function to check if notifications are supported
const checkNotificationsSupport = () => {
  if (!notificationsSupported) {
    return false;
  }

  // In Expo Go, notifications have limitations
  if (isExpoGo) {
    console.log("Using limited notification support in Expo Go");
  }

  return true;
};

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Request permission for notifications
export async function registerForPushNotificationsAsync() {
  try {
    if (!checkNotificationsSupport()) {
      return null;
    }

    let token;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Failed to get push token for push notification!");
        return null;
      }

      // Try to get push token with project ID
      try {
        const projectId = getProjectId();
        token = (
          await Notifications.getExpoPushTokenAsync({
            projectId: projectId,
          })
        ).data;

        console.log("Successfully got push token with projectId:", projectId);
      } catch (error) {
        console.log("Error getting push token:", error);
        // Mark notifications as not supported if we can't get a token
        notificationsSupported = false;
        return null;
      }
    } else {
      console.log("Must use physical device for Push Notifications");
    }

    return token;
  } catch (error) {
    console.log("Error in registerForPushNotificationsAsync:", error);
    notificationsSupported = false;
    return null;
  }
}

// Schedule a notification for an item
export async function scheduleNotificationForItem(
  item: Item,
  daysBeforeExpiry: number,
  notificationId?: string
) {
  try {
    if (!checkNotificationsSupport()) {
      return null;
    }

    // Calculate when to send the notification
    const expiryDate = parseISO(item.expiryDate);
    const now = new Date();
    const daysUntilExpiry = differenceInDays(expiryDate, now);

    // Only schedule if the item hasn't expired yet and notification should be sent in the future
    if (daysUntilExpiry <= 0 || daysUntilExpiry < daysBeforeExpiry) {
      return null;
    }

    // Calculate the trigger date (X days before expiry)
    const triggerDate = new Date(expiryDate);
    triggerDate.setDate(triggerDate.getDate() - daysBeforeExpiry);

    // Cancel existing notification if ID is provided
    if (notificationId) {
      try {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
      } catch (error) {
        console.log("Error canceling notification:", error);
        // Continue anyway
      }
    }

    // Schedule the notification
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${item.name} expires soon!`,
          body: `${
            item.name
          } will expire in ${daysBeforeExpiry} days (on ${expiryDate.toLocaleDateString()})`,
          data: { itemId: item.id },
        },
        trigger: triggerDate,
      });

      return id;
    } catch (error) {
      console.error("Error scheduling notification:", error);
      // If we get an error here, mark notifications as not supported
      notificationsSupported = false;
      return null;
    }
  } catch (error) {
    console.error("Error in scheduleNotificationForItem:", error);
    return null;
  }
}

// Schedule notifications for all items based on settings
export async function scheduleAllNotifications(
  items: Item[],
  daysBeforeExpiry: number,
  notificationFrequency: "daily" | "weekly" | "once"
) {
  try {
    if (!checkNotificationsSupport()) {
      return {};
    }

    // Cancel all existing notifications first
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.log("Error canceling all notifications:", error);
      // If we can't cancel notifications, mark as not supported
      notificationsSupported = false;
      return {};
    }

    const notificationIds: Record<string, string[]> = {};

    for (const item of items) {
      try {
        const expiryDate = parseISO(item.expiryDate);
        const now = new Date();
        const daysUntilExpiry = differenceInDays(expiryDate, now);

        // Skip expired items
        if (daysUntilExpiry <= 0) continue;

        // For "once" frequency, just schedule one notification X days before expiry
        if (notificationFrequency === "once") {
          const id = await scheduleNotificationForItem(item, daysBeforeExpiry);
          if (id) {
            notificationIds[item.id] = [id];
          }
        }
        // For "daily" frequency, schedule notifications for each day from daysBeforeExpiry to expiry
        else if (notificationFrequency === "daily") {
          const ids: string[] = [];
          // Limit to a reasonable number of notifications (max 30)
          const daysToSchedule = Math.min(daysBeforeExpiry, 30);
          for (let i = daysToSchedule; i > 0; i--) {
            const id = await scheduleNotificationForItem(item, i);
            if (id) ids.push(id);
          }
          if (ids.length > 0) {
            notificationIds[item.id] = ids;
          }
        }
        // For "weekly" frequency, schedule notifications weekly starting from daysBeforeExpiry
        else if (notificationFrequency === "weekly") {
          const ids: string[] = [];
          for (let i = daysBeforeExpiry; i > 0; i -= 7) {
            const id = await scheduleNotificationForItem(item, i);
            if (id) ids.push(id);
          }
          if (ids.length > 0) {
            notificationIds[item.id] = ids;
          }
        }
      } catch (error) {
        console.error(
          `Error scheduling notifications for item ${item.id}:`,
          error
        );
      }
    }

    return notificationIds;
  } catch (error) {
    console.error("Error in scheduleAllNotifications:", error);
    notificationsSupported = false;
    return {};
  }
}

// Cancel all notifications for an item
export async function cancelNotificationsForItem(
  itemId: string,
  notificationIds: string[]
) {
  try {
    if (!checkNotificationsSupport()) {
      return false;
    }

    for (const id of notificationIds) {
      try {
        await Notifications.cancelScheduledNotificationAsync(id);
      } catch (error) {
        console.log(`Error canceling notification ${id}:`, error);
        // Continue with other notifications
      }
    }
    return true;
  } catch (error) {
    console.error(`Error canceling notifications for item ${itemId}:`, error);
    return false;
  }
}

// Check if notifications are available and show a message if not
export function checkNotificationsAvailability() {
  if (!notificationsSupported) {
    Alert.alert(
      "Notification Limitations",
      "Full notification support requires a development build. Some notification features may be limited in Expo Go.",
      [{ text: "OK" }]
    );
    return false;
  }
  return true;
}

// Send a test notification immediately
export async function sendTestNotification() {
  try {
    if (!checkNotificationsSupport()) {
      return false;
    }

    // Request permissions if needed
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      const { status: newStatus } =
        await Notifications.requestPermissionsAsync();
      if (newStatus !== "granted") {
        Alert.alert(
          "Permission Required",
          "You need to grant notification permissions to receive notifications."
        );
        return false;
      }
    }

    // Send an immediate notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Test Notification",
        body: "This is a test notification from Best Before app!",
        data: { test: true },
      },
      trigger: null, // null means send immediately
    });

    Alert.alert(
      "Success",
      "Test notification sent! Check your notification center."
    );
    return true;
  } catch (error) {
    console.error("Error sending test notification:", error);
    Alert.alert(
      "Error",
      "Failed to send test notification. Notifications may not be fully supported in this environment."
    );
    notificationsSupported = false;
    return false;
  }
}
