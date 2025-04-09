import * as NavigationBar from "expo-navigation-bar";
import { Platform, StatusBar } from "react-native";

export async function setAndroidNavigationBar(theme: "light" | "dark") {
  if (Platform.OS !== "android") return;

  try {
    // Set position to absolute for edge-to-edge mode
    await NavigationBar.setPositionAsync("absolute");

    // Hide the Android navigation bar
    await NavigationBar.setVisibilityAsync("hidden");

    // Set behavior to overlay-swipe so user can still access it if needed
    await NavigationBar.setBehaviorAsync("overlay-swipe");

    // Set transparent background
    await NavigationBar.setBackgroundColorAsync("transparent");

    // Set button style based on theme
    await NavigationBar.setButtonStyleAsync(
      theme === "dark" ? "light" : "dark"
    );

    // Hide status bar as well for full immersive mode
    StatusBar.setHidden(true);
  } catch (error) {
    console.error("Error setting Android navigation bar:", error);
  }
}
