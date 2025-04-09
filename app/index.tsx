import { differenceInDays, parseISO } from "date-fns";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import ItemCard from "~/components/ItemCard";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { Plus } from "~/lib/icons/Plus";
import { QrCode } from "~/lib/icons/QrCode";
import { Search } from "~/lib/icons/Search";
import { useColorScheme } from "~/lib/useColorScheme";
import { getApiKey } from "~/services/storage";
import { useStore } from "~/store";

export default function HomeScreen() {
  const router = useRouter();
  const items = useStore((state) => state.items);
  const geminiConfig = useStore((state) => state.geminiConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [hasApiKey, setHasApiKey] = useState(false);
  const { isDarkColorScheme } = useColorScheme();
  const [searchQuery, setSearchQuery] = useState("");

  console.log("Home screen - geminiConfig:", geminiConfig ? "exists" : "null");

  // Sort and filter items by expiry date and search query
  const filteredAndSortedItems = useMemo(() => {
    if (!items.length) return [];

    const filtered = searchQuery
      ? items.filter(
          (item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            item.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : items;

    return [...filtered].sort((a, b) => {
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
  }, [items, searchQuery]);

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
      <View className="pt-12 pb-4 px-6">
        <Text className="text-2xl font-bold">Before</Text>
      </View>

      {/* Search bar */}
      <View className="px-6 mb-4">
        <View className="flex-row items-center bg-secondary rounded-full px-4 py-2">
          <Search size={18} className="text-muted-foreground mr-2" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search items.."
            className="flex-1 text-foreground"
            placeholderTextColor="#9ca3af"
          />
          <TouchableOpacity>
            <QrCode size={20} className="text-muted-foreground ml-2" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 px-6">
        {items.length === 0 ? (
          <Animated.View
            entering={FadeIn.duration(400)}
            className="flex-1 justify-center items-center"
          >
            <Text className="text-lg text-muted-foreground mb-6">
              No items yet
            </Text>
            <Button
              onPress={handleAddItem}
              className="flex flex-row items-center px-6 py-3 rounded-full"
              variant="default"
            >
              <Plus className="mr-2 text-primary-foreground" size={18} />
              <Text className="text-primary-foreground font-medium">
                Add Item
              </Text>
            </Button>
          </Animated.View>
        ) : (
          <FlatList
            data={filteredAndSortedItems}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <ItemCard
                item={item}
                entering={FadeIn.duration(300).delay(index * 50)}
              />
            )}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              filteredAndSortedItems.length > 0 ? (
                <View className="mb-2">
                  <Text className="text-muted-foreground text-sm">
                    {filteredAndSortedItems.length}{" "}
                    {filteredAndSortedItems.length === 1 ? "item" : "items"}
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </View>

      {/* Floating Action Button */}
      {items.length > 0 && (
        <View className="absolute bottom-24 right-6">
          <Animated.View entering={FadeIn.duration(300)} className="shadow-md">
            <TouchableOpacity
              onPress={handleAddItem}
              className="w-14 h-14 rounded-full bg-primary justify-center items-center"
              activeOpacity={0.8}
            >
              <Plus size={24} className="text-primary-foreground" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </View>
  );
}
