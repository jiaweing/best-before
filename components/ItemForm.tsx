import { format, parseISO } from "date-fns";
import { Calendar, Camera as CameraIcon } from "lucide-react-native";
import React, { useState } from "react";
import { Image, ScrollView, TextInput, View } from "react-native";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { ItemFormData } from "~/types";
// Using a simpler approach for date input

interface ItemFormProps {
  initialData: Partial<ItemFormData>;
  onSubmit: (data: ItemFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ItemForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: ItemFormProps) {
  const [formData, setFormData] = useState<Partial<ItemFormData>>({
    name: "",
    description: "",
    category: "",
    expiryDate: new Date().toISOString(),
    purchaseDate: new Date().toISOString(),
    imageUri: "",
    ...initialData,
  });

  const handleChange = (field: keyof ItemFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Helper to format date string as YYYY-MM-DD
  const formatDateForInput = (dateString: string | undefined) => {
    if (!dateString) return "";
    try {
      const date = parseISO(dateString);
      return format(date, "yyyy-MM-dd");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  // Helper to convert YYYY-MM-DD to ISO string
  const handleDateChange = (
    field: "expiryDate" | "purchaseDate",
    value: string
  ) => {
    try {
      // Create a date from the input value (YYYY-MM-DD)
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

  const handleSubmit = () => {
    if (!formData.name || !formData.expiryDate || !formData.imageUri) {
      // Show error or validation message
      return;
    }

    onSubmit(formData as ItemFormData);
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4">
        {/* Product Image */}
        <View className="mb-6 items-center">
          {formData.imageUri ? (
            <Image
              source={{ uri: formData.imageUri }}
              className="w-40 h-40 rounded-lg"
              resizeMode="cover"
            />
          ) : (
            <View className="w-40 h-40 bg-muted rounded-lg justify-center items-center">
              <CameraIcon size={40} className="text-muted-foreground" />
              <Text className="mt-2 text-muted-foreground">No Image</Text>
            </View>
          )}
        </View>

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
        <View className="flex-row">
          <Button variant="outline" onPress={onCancel} className="flex-1 mr-2">
            Cancel
          </Button>
          <Button
            onPress={handleSubmit}
            className="flex-1 ml-2"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}
