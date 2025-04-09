import { differenceInDays, parseISO } from "date-fns";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  View,
} from "react-native";
import ItemCard from "~/components/ItemCard";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { Plus } from "~/lib/icons/Plus";
import { getApiKey } from "~/services/storage";
import { useStore } from "~/store";

export default function HomeScreen() {
  const router = useRouter();
  const items = useStore((state) => state.items);
  const geminiConfig = useStore((state) => state.geminiConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [hasApiKey, setHasApiKey] = useState(false);

  console.log("Home screen - geminiConfig:", geminiConfig ? "exists" : "null");

  // Sort items by expiry date (soonest to furthest)
  const sortedItems = useMemo(() => {
    if (!items.length) return [];

    return [...items].sort((a, b) => {
      const daysUntilExpiryA = differenceInDays(
        parseISO(a.expiryDate),
        new Date()
      );
      const daysUntilExpiryB = differenceInDays(
        parseISO(b.expiryDate),
        new Date()
      );
      return daysUntilExpiryA - daysUntilExpiryB;
    });
  }, [items]);

  useEffect(() => {
    const checkApiKey = async () => {
      // First check if we have it in the store
      if (geminiConfig && geminiConfig.apiKey) {
        console.log("Home screen - Found API key in store");
        setHasApiKey(true);
        setIsLoading(false);
        return;
      }

      // Otherwise check secure storage
      const apiKey = await getApiKey();
      console.log(
        "Home screen - API key from storage:",
        apiKey ? "exists" : "null"
      );
      setHasApiKey(!!apiKey);
      setIsLoading(false);
    };

    checkApiKey();
  }, [geminiConfig]);

  const handleAddItem = () => {
    // Check both the store and the local state
    const hasKey = hasApiKey || (geminiConfig && !!geminiConfig.apiKey);
    console.log("handleAddItem - hasKey:", hasKey);

    if (!hasKey) {
      console.log("No API key found, redirecting to settings");
      router.push("/settings");
      return;
    }

    console.log("API key found, navigating to basic-camera");
    router.push("/basic-camera");
  };

  const handleOpenSettings = () => {
    router.push("/settings");
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
      {/* Header */}
      <View className="flex-row justify-between items-center p-4 border-b border-border">
        <Text className="text-xl font-bold">Best Before</Text>
      </View>

      {/* Content */}
      <View className="flex-1 p-4">
        {items.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-lg text-muted-foreground mb-4">
              No items yet
            </Text>
            <Button
              onPress={handleAddItem}
              className="flex flex-row items-center"
            >
              <Plus className="mr-2 text-primary-foreground" size={18} />
              <Text className="text-primary-foreground">Add Item</Text>
            </Button>
          </View>
        ) : (
          <FlatList
            data={sortedItems}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ItemCard item={item} />}
            contentContainerStyle={{ paddingBottom: 120 }}
          />
        )}
      </View>

      {/* Floating Action Button */}
      {items.length > 0 && (
        <View className="absolute bottom-24 right-6">
          <TouchableOpacity
            onPress={handleAddItem}
            className="w-14 h-14 rounded-full bg-primary justify-center items-center shadow-lg"
          >
            <Plus size={24} className="text-primary-foreground" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
