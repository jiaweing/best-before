import { BlurView } from "expo-blur";
import * as React from "react";
import { View, ViewProps } from "react-native";
import { cn } from "~/lib/utils";
import { useColorScheme } from "~/lib/useColorScheme";

interface GlassCardProps extends ViewProps {
  intensity?: number;
  overlayOpacity?: number;
}

const GlassCard = React.forwardRef<React.ElementRef<typeof View>, GlassCardProps>(
  ({ className, children, intensity, overlayOpacity = 0.3, ...props }, ref) => {
    const { isDarkColorScheme } = useColorScheme();
    
    // Default intensity based on theme
    const defaultIntensity = isDarkColorScheme ? 40 : 60;
    const blurIntensity = intensity ?? defaultIntensity;
    
    return (
      <View 
        ref={ref}
        className={cn(
          "rounded-lg overflow-hidden",
          className
        )}
        {...props}
      >
        {/* Glass effect */}
        <BlurView
          intensity={blurIntensity}
          tint={isDarkColorScheme ? "dark" : "light"}
          className="absolute inset-0"
        />
        
        {/* Semi-transparent overlay */}
        <View 
          className={cn(
            "absolute inset-0",
            isDarkColorScheme ? "bg-background/30" : "bg-background/20"
          )} 
          style={{ opacity: overlayOpacity }}
        />
        
        {/* Subtle border */}
        <View className="absolute inset-0 border border-border/30 rounded-lg" />
        
        {/* Content */}
        <View className="relative z-10 p-4">
          {children}
        </View>
      </View>
    );
  }
);

GlassCard.displayName = "GlassCard";

export { GlassCard };
