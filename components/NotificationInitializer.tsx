import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { AppState } from "react-native";
import {
  checkNotificationsAvailability,
  registerForPushNotificationsAsync,
  scheduleAllNotifications,
} from "~/services/notifications";
import { useStore } from "~/store";

export function NotificationInitializer() {
  const {
    items,
    notificationSettings,
    setNotificationIds,
    setNotificationSettings,
  } = useStore();

  // Initialize notifications when the app starts
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        // Check if notifications are available
        if (!checkNotificationsAvailability()) {
          // If notifications aren't supported, disable them in settings
          if (notificationSettings.enabled) {
            setNotificationSettings({ enabled: false });
          }
          return;
        }

        // Register for push notifications
        await registerForPushNotificationsAsync();

        // Schedule notifications if enabled
        if (notificationSettings.enabled && items.length > 0) {
          const ids = await scheduleAllNotifications(
            items,
            notificationSettings.daysBeforeExpiry,
            notificationSettings.frequency
          );

          // Store notification IDs in the store
          setNotificationIds(ids);
        }
      } catch (error) {
        console.error("Error initializing notifications:", error);
        // If there's an error, disable notifications
        if (notificationSettings.enabled) {
          setNotificationSettings({ enabled: false });
        }
      }
    };

    initializeNotifications();
  }, []);

  // Listen for app state changes to reschedule notifications when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        // Check if notifications are available
        if (!checkNotificationsAvailability()) {
          // If notifications aren't supported, disable them in settings
          if (notificationSettings.enabled) {
            setNotificationSettings({ enabled: false });
          }
          return;
        }

        // Reschedule notifications when app comes to foreground
        if (notificationSettings.enabled && items.length > 0) {
          scheduleAllNotifications(
            items,
            notificationSettings.daysBeforeExpiry,
            notificationSettings.frequency
          ).then((ids) => {
            setNotificationIds(ids);
          });
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [items, notificationSettings]);

  // Reschedule notifications when items or settings change
  useEffect(() => {
    // Check if notifications are available
    if (!checkNotificationsAvailability() && notificationSettings.enabled) {
      // If notifications aren't supported, disable them in settings
      setNotificationSettings({ enabled: false });
      return;
    }

    if (notificationSettings.enabled && items.length > 0) {
      scheduleAllNotifications(
        items,
        notificationSettings.daysBeforeExpiry,
        notificationSettings.frequency
      ).then((ids) => {
        setNotificationIds(ids);
      });
    } else if (!notificationSettings.enabled) {
      // Cancel all notifications if disabled
      try {
        Notifications.cancelAllScheduledNotificationsAsync();
      } catch (error) {
        console.log("Error canceling all notifications:", error);
      }
      setNotificationIds({});
    }
  }, [items, notificationSettings]);

  // This component doesn't render anything
  return null;
}
