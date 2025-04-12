import {
  CameraType,
  CameraView as ExpoCameraView,
  useCameraPermissions,
} from "expo-camera";
import { RotateCcw, X } from "lucide-react-native";
import React, { useRef, useState } from "react";
import { ActivityIndicator, Image, TouchableOpacity, View } from "react-native";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { PhotoType } from "~/types";

interface CameraViewProps {
  onCapture: (uri: string) => void;
  onCancel: () => void;
  photoType: PhotoType;
}

export default function CameraView({
  onCapture,
  onCancel,
  photoType,
}: CameraViewProps) {
  const [cameraType, setCameraType] = useState<CameraType>("back");
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<ExpoCameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const handleCapture = async () => {
    if (cameraRef.current && !isCapturing) {
      setIsCapturing(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: false,
          exif: false,
        });
        if (photo) {
          onCapture(photo.uri);
        }
      } catch (error) {
        console.error("Error taking picture:", error);
      } finally {
        setIsCapturing(false);
      }
    }
  };

  const toggleCameraType = () => {
    setCameraType((current) => (current === "back" ? "front" : "back"));
  };

  if (!permission) {
    // Camera permissions are still loading
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View className="flex-1 justify-center items-center p-4 bg-background">
        <Text className="text-center mb-4">
          We need camera access to take pictures of your products and expiry
          dates.
        </Text>
        <Button onPress={requestPermission}>
          <Text>Grant Permission</Text>
        </Button>
        <Button onPress={onCancel} className="mt-2">
          <Text>Go Back</Text>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <ExpoCameraView
        ref={cameraRef}
        facing={cameraType}
        className="flex-1"
        style={{ flex: 1 }}
      >
        <View className="flex-1 bg-transparent">
          {/* Header */}
          <View className="flex-row justify-between items-center p-4">
            <TouchableOpacity
              onPress={onCancel}
              className="w-10 h-10 rounded-full bg-black/50 justify-center items-center"
            >
              <X size={24} color="white" />
            </TouchableOpacity>

            <View className="bg-black/50 px-4 py-2 rounded-full">
              <Text className="text-white font-medium">
                {photoType === "product"
                  ? "Product Photo"
                  : "Expiry Date Photo"}
              </Text>
            </View>

            <TouchableOpacity
              onPress={toggleCameraType}
              className="w-10 h-10 rounded-full bg-black/50 justify-center items-center"
            >
              <RotateCcw size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* Instructions with placeholder images */}
          <View className="flex-1 justify-center items-center">
            {photoType === "product" ? (
              <View className="p-4 rounded-lg m-4 items-center">
                <Image
                  source={require("../assets/images/take-photo.png")}
                  className="w-64 h-64 mb-4"
                  resizeMode="contain"
                />
                <Text className="text-white text-center">
                  Take a clear photo of the product
                </Text>
              </View>
            ) : (
              <View className="p-4 rounded-lg m-4 items-center">
                <Image
                  source={require("../assets/images/expiry-date.png")}
                  className="w-64 h-64 mb-4"
                  resizeMode="contain"
                />
                <Text className="text-white text-center">
                  Take a clear photo of the expiry date
                </Text>
              </View>
            )}
          </View>

          {/* Footer */}
          <View className="p-8 justify-center items-center">
            <TouchableOpacity
              onPress={handleCapture}
              disabled={isCapturing}
              className="w-20 h-20 rounded-full border-4 border-white bg-background/20 justify-center items-center"
            >
              {isCapturing ? (
                <ActivityIndicator size="large" color="white" />
              ) : (
                <View className="w-16 h-16 rounded-full bg-background" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ExpoCameraView>
    </View>
  );
}
