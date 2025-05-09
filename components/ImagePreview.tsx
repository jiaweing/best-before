import { Check, X } from "lucide-react-native";
import React from "react";
import { Image, TouchableOpacity, View } from "react-native";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { PhotoType } from "~/types";

interface ImagePreviewProps {
  imageUri: string;
  onAccept: () => void;
  onRetake: () => void;
  photoType: PhotoType;
}

export default function ImagePreview({
  imageUri,
  onAccept,
  onRetake,
  photoType,
}: ImagePreviewProps) {
  // Add debug wrapper for onAccept
  const handleAccept = () => {
    console.log("DEBUGGING - ImagePreview onAccept called for", photoType);
    onAccept();
  };
  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row justify-between items-center p-4">
        <TouchableOpacity
          onPress={onRetake}
          className="w-10 h-10 rounded-full bg-muted justify-center items-center"
        >
          <X size={24} className="text-foreground" />
        </TouchableOpacity>

        <Text className="font-medium text-lg">
          {photoType === "product" ? "Product Photo" : "Expiry Date Photo"}
        </Text>

        <TouchableOpacity
          onPress={handleAccept}
          className="w-10 h-10 rounded-full bg-primary justify-center items-center"
        >
          <Check size={24} className="text-primary-foreground" />
        </TouchableOpacity>
      </View>

      {/* Image */}
      <View className="flex-1 justify-center items-center p-4">
        <View className="w-full aspect-[9/16] rounded-lg overflow-hidden">
          <Image
            source={{ uri: imageUri }}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>
      </View>

      {/* Footer */}
      <View className="p-4 flex-row justify-between">
        <Button variant="outline" onPress={onRetake} className="flex-1 mr-2">
          <Text>Retake</Text>
        </Button>
        <Button onPress={handleAccept} className="flex-1 ml-2">
          <Text>Use Photo</Text>
        </Button>
      </View>
    </View>
  );
}
