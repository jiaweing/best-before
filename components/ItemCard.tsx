import { differenceInDays, format, parseISO } from "date-fns";
import { useRouter } from "expo-router";
import React from "react";
import { Image, TouchableOpacity, View } from "react-native";
import Animated, {
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Card } from "~/components/ui/card";
import { Text } from "~/components/ui/text";
import { Item } from "~/types";

interface ItemCardProps {
  item: Item;
  entering?: any; // Animation prop
}

export default function ItemCard({ item, entering }: ItemCardProps) {
  const router = useRouter();

  const daysUntilExpiry = differenceInDays(
    parseISO(item.expiryDate),
    new Date()
  );

  const getExpiryStatusColor = () => {
    if (daysUntilExpiry < 0) return "text-destructive";
    if (daysUntilExpiry <= 3) return "text-orange-500";
    if (daysUntilExpiry <= 7) return "text-yellow-500";
    return "text-green-500";
  };

  const getExpiryStatusText = () => {
    const formattedDate = format(parseISO(item.expiryDate), "MMM d, yyyy");
    if (daysUntilExpiry < 0) return `Expired (${formattedDate})`;
    if (daysUntilExpiry === 0) return `Expires today (${formattedDate})`;
    if (daysUntilExpiry === 1) return `Expires tomorrow (${formattedDate})`;
    return `Expires in ${daysUntilExpiry} days (${formattedDate})`;
  };

  const handlePress = () => {
    router.push(`/item/${item.id}`);
  };

  // Animation values
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 20, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20, stiffness: 200 });
  };

  return (
    <Animated.View
      entering={entering || FadeInRight.duration(300).delay(100)}
      style={animatedStyle}
      className="mb-3"
    >
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <Card className="overflow-hidden border-0 shadow-sm">
          <View className="flex-row items-stretch p-3">
            {/* Image with rounded corners */}
            <View className="w-14 h-14 rounded-full overflow-hidden mr-3">
              <Image
                source={{ uri: item.imageUri }}
                style={{
                  width: "100%",
                  height: "100%",
                }}
                resizeMode="cover"
              />
            </View>

            {/* Content */}
            <View className="flex-1 justify-center">
              <View>
                <Text className="font-semibold text-base">{item.name}</Text>
                <Text
                  className="text-sm text-muted-foreground"
                  numberOfLines={1}
                >
                  {item.description}
                </Text>
              </View>
            </View>

            {/* Right side with expiry info */}
            <View className="justify-center items-end ml-2">
              <Text className={`text-xs font-medium ${getExpiryStatusColor()}`}>
                {daysUntilExpiry < 0
                  ? "Expired"
                  : daysUntilExpiry === 0
                  ? "Today"
                  : daysUntilExpiry === 1
                  ? "Tomorrow"
                  : `${daysUntilExpiry} days`}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );
}
