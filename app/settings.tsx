import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { ThemeToggle } from "~/components/ThemeToggle";
import { GlassButton } from "~/components/ui/glass-button";
import { GlassCard } from "~/components/ui/glass-card";
import { Switch } from "~/components/ui/switch";
import { Text } from "~/components/ui/text";
import { ArrowLeft } from "~/lib/icons/ArrowLeft";
import { Bell } from "~/lib/icons/Bell";
import { Calendar } from "~/lib/icons/Calendar";
import { Export } from "~/lib/icons/Export";
import { Import } from "~/lib/icons/Import";
import { Info } from "~/lib/icons/Info";
import { Key } from "~/lib/icons/Key";
import { Repeat } from "~/lib/icons/Repeat";
import { useColorScheme } from "~/lib/useColorScheme";
import {
  exportItemsToJson,
  importItemsFromJson,
} from "~/services/import-export";
import {
  checkNotificationsAvailability,
  sendTestNotification,
} from "~/services/notifications";
import { deleteApiKey, getApiKey, saveApiKey } from "~/services/storage";
import { useStore } from "~/store";

export default function SettingsScreen() {
  console.log("SettingsScreen rendered");
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();
  const geminiConfig = useStore((state) => state.geminiConfig);
  console.log("Current geminiConfig:", geminiConfig ? "exists" : "null");
  const setGeminiConfig = useStore((state) => state.setGeminiConfig);
  const notificationSettings = useStore((state) => state.notificationSettings);
  const setNotificationSettings = useStore(
    (state) => state.setNotificationSettings
  );
  const items = useStore((state) => state.items);
  const addItem = useStore((state) => state.addItem);

  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Local state for notification settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [daysBeforeExpiry, setDaysBeforeExpiry] = useState("7");
  const [notificationFrequency, setNotificationFrequency] = useState<
    "daily" | "weekly" | "once"
  >("daily");

  useEffect(() => {
    // Initialize local notification settings from store
    setNotificationsEnabled(notificationSettings.enabled);
    setDaysBeforeExpiry(notificationSettings.daysBeforeExpiry.toString());
    setNotificationFrequency(notificationSettings.frequency);

    const loadApiKey = async () => {
      try {
        console.log("Loading API key in settings screen...");

        // First check if we have it in the store
        if (geminiConfig && geminiConfig.apiKey) {
          console.log("Found API key in store");
          setApiKey(geminiConfig.apiKey);
          setHasApiKey(true);
          setIsLoading(false);
          return;
        }

        // Otherwise try to get from secure storage
        console.log("Checking secure storage for API key...");
        const storedApiKey = await getApiKey();
        if (storedApiKey) {
          console.log("Found API key in secure storage");
          setApiKey(storedApiKey);
          setHasApiKey(true);

          // Also update the store
          setGeminiConfig({ apiKey: storedApiKey });
        } else {
          console.log("No API key found in either location");
        }
      } catch (error) {
        console.error("Error loading API key:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadApiKey();
  }, [geminiConfig, notificationSettings]);

  const handleSave = async () => {
    console.log("Save button pressed");

    if (!apiKey || !apiKey.trim()) {
      console.log("API key is empty or invalid");
      Alert.alert("Error", "Please enter a valid API key");
      return;
    }

    console.log("Starting to save API key...");
    setIsSaving(true);

    try {
      const trimmedKey = apiKey.trim();
      console.log("Saving API key to secure storage...");
      await saveApiKey(trimmedKey);

      console.log("Setting API key in global store...");
      setGeminiConfig({ apiKey: trimmedKey });

      setHasApiKey(true);
      console.log(
        "API key saved successfully:",
        trimmedKey.substring(0, 5) + "..."
      );
      Alert.alert("Success", "API key saved successfully");
    } catch (error) {
      console.error("Error saving API key:", error);
      Alert.alert("Error", "Failed to save API key");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    Alert.alert("Confirm", "Are you sure you want to remove your API key?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          setIsLoading(true);
          try {
            await deleteApiKey();
            setApiKey("");
            setGeminiConfig(null);
            setHasApiKey(false);
          } catch (error) {
            console.error("Error deleting API key:", error);
            Alert.alert("Error", "Failed to delete API key");
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  const handleBack = () => {
    router.back();
  };

  // Handle notification settings changes
  const handleToggleNotifications = (value: boolean) => {
    // If enabling notifications, check if they're supported
    if (value && !checkNotificationsAvailability()) {
      // If not supported, don't enable
      return;
    }

    setNotificationsEnabled(value);
    setNotificationSettings({ enabled: value });
  };

  const handleDaysBeforeExpiryChange = (value: string) => {
    // Only allow numbers
    if (value === "" || /^\d+$/.test(value)) {
      setDaysBeforeExpiry(value);
      if (value !== "") {
        setNotificationSettings({ daysBeforeExpiry: parseInt(value, 10) });
      }
    }
  };

  const handleFrequencyChange = (value: "daily" | "weekly" | "once") => {
    setNotificationFrequency(value);
    setNotificationSettings({ frequency: value });
  };

  // Handle test notification button press
  const handleTestNotification = async () => {
    await sendTestNotification();
  };

  // Handle export data
  const handleExportData = async () => {
    try {
      if (items.length === 0) {
        Alert.alert("No Data", "There are no items to export.");
        return;
      }
      await exportItemsToJson(items);
    } catch (error) {
      console.error("Error exporting data:", error);
      Alert.alert("Export Error", "Failed to export data. Please try again.");
    }
  };

  // Handle import data
  const handleImportData = async () => {
    try {
      Alert.alert(
        "Import Data",
        "This will import items from a JSON file. Do you want to replace all existing items or merge with current items?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Replace All",
            onPress: async () => {
              const importedItems = await importItemsFromJson();
              if (importedItems && importedItems.length > 0) {
                // Clear existing items first by setting an empty array in the store
                useStore.setState({ items: [] });

                // Add each imported item
                importedItems.forEach((item) => {
                  addItem({
                    name: item.name,
                    description: item.description,
                    category: item.category,
                    expiryDate: item.expiryDate,
                    purchaseDate: item.purchaseDate,
                    imageUri: item.imageUri,
                  });
                });

                Alert.alert(
                  "Import Successful",
                  `Imported ${importedItems.length} items.`
                );
              }
            },
          },
          {
            text: "Merge",
            onPress: async () => {
              const importedItems = await importItemsFromJson();
              if (importedItems && importedItems.length > 0) {
                // Add each imported item
                importedItems.forEach((item) => {
                  addItem({
                    name: item.name,
                    description: item.description,
                    category: item.category,
                    expiryDate: item.expiryDate,
                    purchaseDate: item.purchaseDate,
                    imageUri: item.imageUri,
                  });
                });

                Alert.alert(
                  "Import Successful",
                  `Imported ${importedItems.length} items.`
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error importing data:", error);
      Alert.alert("Import Error", "Failed to import data. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header with glass effect */}
      <View className="pt-12 pb-4 px-6">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => {
              console.log("Back button pressed");
              handleBack();
            }}
            className="p-2 mr-3 rounded-full active:opacity-70"
          >
            <ArrowLeft className="text-foreground" size={24} />
          </TouchableOpacity>
          <Text className="text-2xl font-bold tracking-tight">Settings</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(300)} className="mb-6">
          <GlassCard className="mb-6">
            <View className="mb-2">
              <Text className="text-lg font-semibold mb-2">Gemini API Key</Text>
              <Text className="text-muted-foreground mb-4">
                Enter your Gemini API key to enable AI-powered features. You can
                get a key from the Google AI Studio.
              </Text>

              <View className="flex-row items-center mb-4">
                <Key size={20} className="text-muted-foreground mr-2" />
                <TextInput
                  value={apiKey}
                  onChangeText={(text) => {
                    console.log(
                      "TextInput onChangeText:",
                      text ? "Text entered" : "Empty text"
                    );
                    setApiKey(text);
                  }}
                  placeholder="Enter your Gemini API key"
                  secureTextEntry
                  className="flex-1 border border-input rounded-md p-2 bg-background/50 text-foreground"
                />
              </View>

              <View className="flex-row mt-2">
                <GlassButton
                  onPress={() => {
                    console.log("Clear button pressed");
                    handleClear();
                  }}
                  disabled={!hasApiKey || isSaving}
                  className={`flex-1 mr-2 ${
                    !hasApiKey || isSaving ? "opacity-50" : ""
                  }`}
                  variant="secondary"
                >
                  <Text className="font-medium">Clear</Text>
                </GlassButton>
                <GlassButton
                  onPress={() => {
                    console.log("TouchableOpacity pressed directly");
                    handleSave();
                  }}
                  disabled={isSaving}
                  className={`flex-1 ml-2 ${isSaving ? "opacity-50" : ""}`}
                >
                  <Text className="font-medium">
                    {isSaving ? "Saving..." : "Save"}
                  </Text>
                </GlassButton>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View
          entering={FadeIn.duration(300).delay(100)}
          className="mb-6"
        >
          <GlassCard className="mb-6">
            <View>
              <Text className="text-lg font-semibold mb-2">Notifications</Text>
              <Text className="text-muted-foreground mb-4">
                Configure when and how often you want to be notified about
                expiring items.
              </Text>

              {/* Enable/Disable Notifications */}
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <Bell size={20} className="text-muted-foreground mr-2" />
                  <Text>Enable Notifications</Text>
                </View>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={handleToggleNotifications}
                />
              </View>

              {/* Notification warning for Expo Go */}
              <View className="mb-4 p-2 bg-yellow-100 dark:bg-yellow-900 rounded-md">
                <Text className="text-xs text-yellow-800 dark:text-yellow-200">
                  Note: Full notification support requires a development build.
                  Some notification features may be limited in Expo Go.
                </Text>
              </View>

              {/* Test Notification Button */}
              <GlassButton
                onPress={handleTestNotification}
                className="mb-4"
                size="lg"
              >
                <Text className="font-medium">Send Test Notification</Text>
              </GlassButton>

              {notificationsEnabled && (
                <>
                  {/* Days Before Expiry */}
                  <View className="mb-4">
                    <Text className="mb-1 font-medium">Days Before Expiry</Text>
                    <View className="flex-row items-center border border-input rounded-md p-2 bg-background">
                      <Calendar
                        size={20}
                        className="text-muted-foreground mr-2"
                      />
                      <TextInput
                        value={daysBeforeExpiry}
                        onChangeText={handleDaysBeforeExpiryChange}
                        placeholder="7"
                        keyboardType="numeric"
                        className="flex-1 bg-background text-foreground"
                      />
                    </View>
                    <Text className="text-xs text-muted-foreground mt-1">
                      How many days before expiry to start notifications
                    </Text>
                  </View>

                  {/* Notification Frequency */}
                  <View className="mb-4">
                    <Text className="mb-1 font-medium">
                      Notification Frequency
                    </Text>
                    <View className="flex-row items-center mb-2">
                      <Repeat
                        size={20}
                        className="text-muted-foreground mr-2"
                      />
                      <Text className="text-muted-foreground">
                        How often to send notifications
                      </Text>
                    </View>

                    <View className="flex-row mt-2">
                      <GlassButton
                        onPress={() => handleFrequencyChange("daily")}
                        className="flex-1 mr-2"
                        variant={
                          notificationFrequency === "daily"
                            ? "primary"
                            : "secondary"
                        }
                      >
                        <Text className="font-medium">Daily</Text>
                      </GlassButton>

                      <GlassButton
                        onPress={() => handleFrequencyChange("weekly")}
                        className="flex-1 mx-2"
                        variant={
                          notificationFrequency === "weekly"
                            ? "primary"
                            : "secondary"
                        }
                      >
                        <Text className="font-medium">Weekly</Text>
                      </GlassButton>

                      <GlassButton
                        onPress={() => handleFrequencyChange("once")}
                        className="flex-1 ml-2"
                        variant={
                          notificationFrequency === "once"
                            ? "primary"
                            : "secondary"
                        }
                      >
                        <Text className="font-medium">Once</Text>
                      </GlassButton>
                    </View>
                  </View>
                </>
              )}
            </View>
          </GlassCard>
        </Animated.View>

        {/* Data Import/Export Section */}
        {/* Theme Toggle Section */}
        <Animated.View
          entering={FadeIn.duration(300).delay(200)}
          className="mb-6"
        >
          <GlassCard className="mb-6">
            <View>
              <Text className="text-lg font-semibold mb-2">Appearance</Text>
              <Text className="text-muted-foreground mb-4">
                Toggle between light and dark mode.
              </Text>

              <View className="flex-row items-center justify-between">
                <Text className="font-medium">Dark Mode</Text>
                <ThemeToggle />
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Data Management Section */}
        <Animated.View
          entering={FadeIn.duration(300).delay(300)}
          className="mb-6"
        >
          <GlassCard className="mb-6">
            <View>
              <Text className="text-lg font-semibold mb-2">
                Data Management
              </Text>
              <Text className="text-muted-foreground mb-4">
                Import or export your item data as JSON files.
              </Text>

              <View className="flex-row mt-4">
                <GlassButton
                  onPress={handleImportData}
                  className="flex-1 mr-2"
                  variant="secondary"
                >
                  <Import size={20} className="mr-2" />
                  <Text className="font-medium">Import Data</Text>
                </GlassButton>
                <GlassButton
                  onPress={handleExportData}
                  className="flex-1 ml-2"
                  variant="secondary"
                >
                  <Export size={20} className="mr-2" />
                  <Text className="font-medium">Export Data</Text>
                </GlassButton>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View
          entering={FadeIn.duration(300).delay(400)}
          className="mb-12"
        >
          <GlassCard className="mb-4" intensity={20}>
            <View className="flex-row items-start">
              <Info size={20} className="text-muted-foreground mr-2 mt-0.5" />
              <Text className="flex-1 text-muted-foreground">
                This app uses Gemini 2.0 Flash to analyze product images and
                extract expiry dates. Your API key is stored securely on your
                device and is never shared.
              </Text>
            </View>
          </GlassCard>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
