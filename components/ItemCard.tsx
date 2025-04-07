import { differenceInDays, format, parseISO } from "date-fns";
import { useRouter } from "expo-router";
import { AlertCircle, Clock } from "lucide-react-native";
import React from "react";
import { Image, TouchableOpacity, View } from "react-native";
import { Card, CardContent } from "~/components/ui/card";
import { Text } from "~/components/ui/text";
import { Item } from "~/types";

interface ItemCardProps {
  item: Item;
}

export default function ItemCard({ item }: ItemCardProps) {
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

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="mb-4"
      activeOpacity={0.7}
    >
      <Card>
        <CardContent className="p-0">
          <View className="flex-row">
            {/* Image */}
            <Image
              source={{ uri: item.imageUri }}
              className="w-24 h-24 rounded-l-lg"
              resizeMode="cover"
            />

            {/* Content */}
            <View className="flex-1 p-3 justify-between">
              <View>
                <Text className="font-semibold text-base">{item.name}</Text>
                <Text
                  className="text-sm text-muted-foreground"
                  numberOfLines={1}
                >
                  {item.description}
                </Text>
                <View className="flex-row items-center mt-1">
                  <View className="bg-secondary px-2 py-0.5 rounded-full">
                    <Text className="text-xs">{item.category}</Text>
                  </View>
                </View>
              </View>

              <View className="flex-row items-center mt-2">
                {daysUntilExpiry < 0 ? (
                  <AlertCircle size={16} className={getExpiryStatusColor()} />
                ) : (
                  <Clock size={16} className={getExpiryStatusColor()} />
                )}
                <Text className={`ml-1 text-sm ${getExpiryStatusColor()}`}>
                  {getExpiryStatusText()}
                </Text>
              </View>
            </View>
          </View>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );
}
