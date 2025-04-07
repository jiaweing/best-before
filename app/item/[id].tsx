import { differenceInDays, format, parseISO } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  View,
} from "react-native";
import ItemForm from "~/components/ItemForm";
import { ThemeToggle } from "~/components/ThemeToggle";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { ArrowLeft } from "~/lib/icons/ArrowLeft";
import { Calendar } from "~/lib/icons/Calendar";
import { Edit } from "~/lib/icons/Edit";
import { Trash2 } from "~/lib/icons/Trash2";
import { useStore } from "~/store";
import { ItemFormData } from "~/types";

// This is the item detail screen
export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const items = useStore((state) => state.items);
  const updateItem = useStore((state) => state.updateItem);
  const deleteItem = useStore((state) => state.deleteItem);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const item = items.find((item) => item.id === id);

  if (!item) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <Text className="text-lg text-muted-foreground mb-4">
          Item not found
        </Text>
        <Button onPress={() => router.push("/")}>Go Back</Button>
      </View>
    );
  }

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
    if (daysUntilExpiry < 0)
      return `Expired ${Math.abs(daysUntilExpiry)} days ago`;
    if (daysUntilExpiry === 0) return "Expires today";
    if (daysUntilExpiry === 1) return "Expires tomorrow";
    return `Expires in ${daysUntilExpiry} days`;
  };

  const handleBack = () => {
    if (isEditing) {
      setIsEditing(false);
    } else {
      router.back();
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleDelete = () => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this item?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteItem(item.id);
            router.push("/");
          },
        },
      ]
    );
  };

  const handleUpdate = (data: ItemFormData) => {
    setIsLoading(true);
    try {
      updateItem(item.id, data);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating item:", error);
      Alert.alert("Error", "Failed to update item");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (isEditing) {
    return (
      <View className="flex-1 bg-background pt-10">
        {/* Header */}
        <View className="flex-row items-center p-4 border-b border-border">
          <Button variant="ghost" className="p-2 mr-2" onPress={handleBack}>
            <ArrowLeft className="text-foreground" size={24} />
          </Button>
          <Text className="text-xl font-bold">Edit Item</Text>
        </View>

        {/* Form */}
        <ItemForm
          initialData={{
            name: item.name,
            description: item.description,
            category: item.category,
            expiryDate: item.expiryDate,
            purchaseDate: item.purchaseDate,
            imageUri: item.imageUri,
          }}
          onSubmit={handleUpdate}
          onCancel={handleBack}
          isLoading={isLoading}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background pt-10">
      {/* Header */}
      <View className="flex-row items-center p-4 border-b border-border">
        <Button variant="ghost" className="p-2 mr-2" onPress={handleBack}>
          <ArrowLeft className="text-foreground" size={24} />
        </Button>
        <Text className="text-xl font-bold" numberOfLines={1}>
          {item.name}
        </Text>
        <View className="flex-1" />
        <ThemeToggle />
      </View>

      {/* Content */}
      <ScrollView className="flex-1">
        {/* Image */}
        <View className="w-full aspect-[16/9] overflow-hidden">
          <Image
            source={{ uri: item.imageUri }}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>

        {/* Expiry Status */}
        <View
          className={`p-3 m-4 rounded-lg bg-${getExpiryStatusColor().replace(
            "text-",
            ""
          )}/10`}
        >
          <Text
            className={`text-center font-semibold ${getExpiryStatusColor()}`}
          >
            {getExpiryStatusText()}
          </Text>
        </View>

        {/* Details */}
        <View className="p-4">
          <Text className="text-2xl font-bold mb-2">{item.name}</Text>

          <View className="flex-row mb-4">
            <View className="bg-secondary px-3 py-1 rounded-full">
              <Text className="text-sm">{item.category}</Text>
            </View>
          </View>

          <Text className="text-muted-foreground mb-4">{item.description}</Text>

          <View className="flex-row items-center mb-2">
            <Calendar size={20} className="text-muted-foreground mr-2" />
            <Text className="text-muted-foreground">
              Expires on: {format(parseISO(item.expiryDate), "MMMM d, yyyy")}
            </Text>
          </View>

          <View className="flex-row items-center mb-4">
            <Calendar size={20} className="text-muted-foreground mr-2" />
            <Text className="text-muted-foreground">
              Purchased on:{" "}
              {format(parseISO(item.purchaseDate), "MMMM d, yyyy")}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View className="p-4 flex-row border-t border-border">
        <Button
          variant="outline"
          className="flex-1 mr-2 flex-row items-center"
          onPress={handleDelete}
        >
          <Trash2 size={18} className="text-destructive mr-2" />
          <Text className="text-destructive">Delete</Text>
        </Button>
        <Button
          className="flex-1 ml-2 flex-row items-center"
          onPress={handleEdit}
        >
          <Edit size={18} className="text-primary-foreground mr-2" />
          <Text className="text-primary-foreground">Edit</Text>
        </Button>
      </View>
    </View>
  );
}
