import { BlurView } from "expo-blur";
import * as React from "react";
import { Pressable, PressableProps, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { TextClassContext } from "~/components/ui/text";
import { useColorScheme } from "~/lib/useColorScheme";
import { cn } from "~/lib/utils";

interface GlassButtonProps extends PressableProps {
  variant?: "primary" | "secondary" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  intensity?: number;
}

const GlassButton = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  GlassButtonProps
>(
  (
    {
      className,
      variant = "primary",
      size = "default",
      intensity,
      children,
      ...props
    },
    ref
  ) => {
    const { isDarkColorScheme } = useColorScheme();
    const scale = useSharedValue(1);
    
    // Default intensity based on theme
    const defaultIntensity = isDarkColorScheme ? 40 : 60;
    const blurIntensity = intensity ?? defaultIntensity;
    
    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: scale.value }],
      };
    });
    
    const handlePressIn = () => {
      scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
    };
    
    const handlePressOut = () => {
      scale.value = withSpring(1, { damping: 20, stiffness: 300 });
    };
    
    // Determine background color based on variant
    const getBgColor = () => {
      switch (variant) {
        case "primary":
          return "bg-primary/70";
        case "secondary":
          return "bg-secondary/70";
        case "destructive":
          return "bg-destructive/70";
        default:
          return "bg-primary/70";
      }
    };
    
    // Determine text color based on variant
    const getTextColor = () => {
      switch (variant) {
        case "primary":
          return "text-primary-foreground";
        case "secondary":
          return "text-secondary-foreground";
        case "destructive":
          return "text-destructive-foreground";
        default:
          return "text-primary-foreground";
      }
    };
    
    // Determine padding based on size
    const getPadding = () => {
      switch (size) {
        case "sm":
          return "py-1.5 px-3";
        case "lg":
          return "py-3 px-6";
        case "icon":
          return "p-2";
        default:
          return "py-2 px-4";
      }
    };
    
    return (
      <TextClassContext.Provider
        value={cn(
          props.disabled && "web:pointer-events-none",
          getTextColor(),
          "font-medium"
        )}
      >
        <Animated.View style={animatedStyle}>
          <Pressable
            ref={ref}
            className={cn(
              "relative overflow-hidden rounded-full",
              getPadding(),
              props.disabled && "opacity-50 web:pointer-events-none",
              className
            )}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            {...props}
          >
            {/* Glass effect */}
            <BlurView
              intensity={blurIntensity}
              tint={isDarkColorScheme ? "dark" : "light"}
              className="absolute inset-0"
            />
            
            {/* Semi-transparent overlay */}
            <View className={cn("absolute inset-0", getBgColor())} />
            
            {/* Content */}
            <View className="relative z-10 flex-row items-center justify-center">
              {children}
            </View>
          </Pressable>
        </Animated.View>
      </TextClassContext.Provider>
    );
  }
);

GlassButton.displayName = "GlassButton";

export { GlassButton };
