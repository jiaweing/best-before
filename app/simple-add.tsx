import { format, parseISO } from "date-fns";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemeToggle } from "~/components/ThemeToggle";
import { Text } from "~/components/ui/text";
import { ArrowLeft } from "~/lib/icons/ArrowLeft";
import { Calendar } from "~/lib/icons/Calendar";
import { useStore } from "~/store";

export default function SimpleAddScreen() {
  const router = useRouter();
  const addItem = useStore((state) => state.addItem);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    expiryDate: new Date().toISOString(),
    purchaseDate: new Date().toISOString(),
    imageUri: "https://via.placeholder.com/300",
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (field, value) => {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setFormData((prev) => ({
          ...prev,
          [field]: date.toISOString(),
        }));
      }
    } catch (error) {
      console.error(`Error parsing ${field}:`, error);
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    try {
      const date = parseISO(dateString);
      return format(date, "yyyy-MM-dd");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  const handleSubmit = () => {
    if (!formData.name) {
      Alert.alert("Error", "Please enter a product name");
      return;
    }

    try {
      addItem(formData);
      Alert.alert("Success", "Item added successfully", [
        { text: "OK", onPress: () => router.push("/") },
      ]);
    } catch (error) {
      console.error("Error adding item:", error);
      Alert.alert("Error", "Failed to add item");
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center p-4 border-b border-border">
        <TouchableOpacity onPress={handleBack} className="p-2 mr-2">
          <ArrowLeft className="text-foreground" size={24} />
        </TouchableOpacity>
        <Text className="text-xl font-bold">Add Item (Simple)</Text>
        <View className="flex-1" />
        <ThemeToggle />
      </View>

      {/* Content */}
      <ScrollView className="flex-1 p-4">
        {/* Form Fields */}
        <View className="mb-4">
          <Text className="mb-1 font-medium">Product Name</Text>
          <TextInput
            value={formData.name}
            onChangeText={(value) => handleChange("name", value)}
            className="border border-input rounded-md p-2 bg-background text-foreground"
            placeholder="Enter product name"
          />
        </View>

        <View className="mb-4">
          <Text className="mb-1 font-medium">Description</Text>
          <TextInput
            value={formData.description}
            onChangeText={(value) => handleChange("description", value)}
            className="border border-input rounded-md p-2 bg-background text-foreground"
            placeholder="Enter product description"
            multiline
            numberOfLines={3}
          />
        </View>

        <View className="mb-4">
          <Text className="mb-1 font-medium">Category</Text>
          <TextInput
            value={formData.category}
            onChangeText={(value) => handleChange("category", value)}
            className="border border-input rounded-md p-2 bg-background text-foreground"
            placeholder="Enter product category"
          />
        </View>

        <View className="mb-4">
          <Text className="mb-1 font-medium">Expiry Date</Text>
          <View className="flex-row items-center border border-input rounded-md p-2 bg-background">
            <Calendar size={20} className="text-muted-foreground mr-2" />
            <TextInput
              value={formatDateForInput(formData.expiryDate)}
              onChangeText={(value) => handleDateChange("expiryDate", value)}
              placeholder="YYYY-MM-DD"
              className="flex-1 bg-background text-foreground"
            />
          </View>
          <Text className="text-xs text-muted-foreground mt-1">
            Format: YYYY-MM-DD
          </Text>
        </View>

        <View className="mb-6">
          <Text className="mb-1 font-medium">Purchase Date</Text>
          <View className="flex-row items-center border border-input rounded-md p-2 bg-background">
            <Calendar size={20} className="text-muted-foreground mr-2" />
            <TextInput
              value={formatDateForInput(formData.purchaseDate)}
              onChangeText={(value) => handleDateChange("purchaseDate", value)}
              placeholder="YYYY-MM-DD"
              className="flex-1 bg-background text-foreground"
            />
          </View>
          <Text className="text-xs text-muted-foreground mt-1">
            Format: YYYY-MM-DD
          </Text>
        </View>

        {/* Buttons */}
        <View className="flex-row mb-8">
          <TouchableOpacity
            onPress={handleBack}
            className="flex-1 mr-2 h-10 rounded-md border border-input justify-center items-center"
          >
            <Text>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSubmit}
            className="flex-1 ml-2 h-10 rounded-md bg-primary justify-center items-center"
          >
            <Text className="text-primary-foreground">Save</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
