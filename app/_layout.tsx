import "~/global.css";

import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { PortalHost } from "@rn-primitives/portal";
import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as React from "react";
import { AppState, Platform, View } from "react-native";
import { BottomNavBar } from "~/components/BottomNavBar";
import { NotificationInitializer } from "~/components/NotificationInitializer";
import { setAndroidNavigationBar } from "~/lib/android-navigation-bar";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/useColorScheme";

const LIGHT_THEME: Theme = {
  ...DefaultTheme,
  colors: NAV_THEME.light,
};
const DARK_THEME: Theme = {
  ...DarkTheme,
  colors: NAV_THEME.dark,
};

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export default function RootLayout() {
  const hasMounted = React.useRef(false);
  const { colorScheme, isDarkColorScheme } = useColorScheme();
  const [isColorSchemeLoaded, setIsColorSchemeLoaded] = React.useState(false);
  const pathname = usePathname();

  useIsomorphicLayoutEffect(() => {
    if (hasMounted.current) {
      return;
    }

    if (Platform.OS === "web") {
      // Adds the background color to the html element to prevent white background on overscroll.
      document.documentElement.classList.add("bg-background");
    }

    // Apply navigation bar settings
    const applySettings = async () => {
      if (Platform.OS === "android") {
        await setAndroidNavigationBar(colorScheme);
      }
      setIsColorSchemeLoaded(true);
    };

    applySettings();
    hasMounted.current = true;
  }, []);

  // Re-apply navigation bar settings when color scheme changes or app state changes
  React.useEffect(() => {
    if (hasMounted.current && Platform.OS === "android") {
      setAndroidNavigationBar(colorScheme);
    }

    // Also hide navigation bar when app is resumed
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active" && Platform.OS === "android") {
        setAndroidNavigationBar(colorScheme);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [colorScheme]);

  if (!isColorSchemeLoaded) {
    return null;
  }

  // Determine if we should show the bottom nav bar
  // Don't show it on camera screens or when taking photos
  const showBottomNav =
    !pathname.includes("camera") && !pathname.includes("add-item");

  return (
    <ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
      <StatusBar style={isDarkColorScheme ? "light" : "dark"} />
      <View className={`flex-1 ${isDarkColorScheme ? "dark" : ""}`}>
        <View className="flex-1 bg-background">
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="add-item" options={{ title: "Add Item" }} />
            <Stack.Screen name="simple-add" options={{ title: "Simple Add" }} />
            <Stack.Screen name="camera-add" options={{ title: "Camera Add" }} />
            <Stack.Screen
              name="basic-camera"
              options={{ title: "Basic Camera" }}
            />
            <Stack.Screen name="item" options={{ title: "Items" }} />
          </Stack>
          {showBottomNav && <BottomNavBar currentRoute={pathname} />}
          <PortalHost />
          <NotificationInitializer />
        </View>
      </View>
    </ThemeProvider>
  );
}

const useIsomorphicLayoutEffect =
  Platform.OS === "web" && typeof window === "undefined"
    ? React.useEffect
    : React.useLayoutEffect;
