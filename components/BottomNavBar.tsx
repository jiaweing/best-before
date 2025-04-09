import { useRouter } from "expo-router";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Home } from "~/lib/icons/Home";
import { Settings } from "~/lib/icons/Settings";

type BottomNavBarProps = {
  currentRoute: string;
};

export function BottomNavBar({ currentRoute }: BottomNavBarProps) {
  const router = useRouter();
  const handleHomePress = () => {
    router.push("/");
  };

  const handleSettingsPress = () => {
    router.push("/settings");
  };

  // Animated styles for icons
  const homeIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(currentRoute === "/" ? 1.1 : 1, {
            damping: 15,
            stiffness: 120,
          }),
        },
      ],
    };
  });

  const settingsIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(currentRoute === "/settings" ? 1.1 : 1, {
            damping: 15,
            stiffness: 120,
          }),
        },
      ],
    };
  });

  return (
    <View className="absolute bottom-5 left-0 right-0 h-16 rounded-3xl bg-transparent">
      {/* Navigation buttons */}
      <View className="flex-row justify-around items-center h-full px-6 p-4">
        <TouchableOpacity
          onPress={handleHomePress}
          className="flex-1 items-center justify-center"
          activeOpacity={0.7}
        >
          <Animated.View style={homeIconStyle}>
            <Home
              size={24}
              className={
                currentRoute === "/" ? "text-primary" : "text-muted-foreground"
              }
            />
          </Animated.View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSettingsPress}
          className="flex-1 items-center justify-center"
          activeOpacity={0.7}
        >
          <Animated.View style={settingsIconStyle}>
            <Settings
              size={24}
              className={
                currentRoute === "/settings"
                  ? "text-primary"
                  : "text-muted-foreground"
              }
            />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
