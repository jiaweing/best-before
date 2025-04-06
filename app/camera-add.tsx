import { Camera } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import { useRouter } from "expo-router";
import { ArrowLeft, Check, RotateCcw, X } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemeToggle } from "~/components/ThemeToggle";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import {
  analyzeProductImage,
  extractExpiryDate,
  imageToBase64,
} from "~/services/gemini";
import { getApiKey } from "~/services/storage";
import { useStore } from "~/store";

type PhotoStep =
  | "product-camera"
  | "product-preview"
  | "expiry-camera"
  | "expiry-preview"
  | "processing"
  | "confirm";

export default function CameraAddScreen() {
  const router = useRouter();
  const addItem = useStore((state) => state.addItem);
  const geminiConfig = useStore((state) => state.geminiConfig);

  const [step, setStep] = useState<PhotoStep>("product-camera");
  const [productPhotoUri, setProductPhotoUri] = useState<string | null>(null);
  const [expiryPhotoUri, setExpiryPhotoUri] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState(
    Camera.Constants?.Type?.back || "back"
  );
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const cameraRef = useRef<Camera>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    expiryDate: new Date().toISOString(),
    purchaseDate: new Date().toISOString(),
    imageUri: "",
  });

  useEffect(() => {
    (async () => {
      // Request camera permission
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");

      // Get API key
      const key = geminiConfig?.apiKey || (await getApiKey());
      setApiKey(key);
    })();
  }, [geminiConfig]);

  const handleCapture = async () => {
    if (cameraRef.current && !isCapturing) {
      setIsCapturing(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: false,
          exif: false,
        });

        if (step === "product-camera") {
          setProductPhotoUri(photo.uri);
          setStep("product-preview");
        } else if (step === "expiry-camera") {
          setExpiryPhotoUri(photo.uri);
          setStep("expiry-preview");
        }
      } catch (error) {
        console.error("Error taking picture:", error);
        Alert.alert("Error", "Failed to take photo. Please try again.");
      } finally {
        setIsCapturing(false);
      }
    }
  };

  const toggleCameraType = () => {
    if (!Camera.Constants?.Type) {
      console.log("Camera.Constants.Type is not available");
      return;
    }

    setCameraType((current) =>
      current === Camera.Constants.Type.back
        ? Camera.Constants.Type.front
        : Camera.Constants.Type.back
    );
  };

  const handleBack = () => {
    if (step === "product-camera") {
      router.back();
    } else if (step === "product-preview") {
      setProductPhotoUri(null);
      setStep("product-camera");
    } else if (step === "expiry-camera") {
      setStep("product-preview");
    } else if (step === "expiry-preview") {
      setExpiryPhotoUri(null);
      setStep("expiry-camera");
    } else if (step === "confirm") {
      setStep("expiry-preview");
    }
  };

  const handleRetake = () => {
    if (step === "product-preview") {
      setProductPhotoUri(null);
      setStep("product-camera");
    } else if (step === "expiry-preview") {
      setExpiryPhotoUri(null);
      setStep("expiry-camera");
    }
  };

  const processProductPhoto = async () => {
    if (!productPhotoUri) return;
    if (!apiKey) {
      Alert.alert("Error", "API key not found. Please set it in settings.");
      router.push("/settings");
      return;
    }

    setIsProcessing(true);
    try {
      // Resize and compress the image
      const manipResult = await ImageManipulator.manipulateAsync(
        productPhotoUri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Convert to base64
      const base64 = await imageToBase64(manipResult.uri);

      // Analyze with Gemini
      const productData = await analyzeProductImage(apiKey, base64);

      setFormData((prev) => ({
        ...prev,
        ...productData,
        imageUri: productPhotoUri,
      }));

      setStep("expiry-camera");
    } catch (error) {
      console.error("Error processing product photo:", error);
      Alert.alert(
        "Error",
        "Failed to analyze product photo. Please try again.",
        [{ text: "OK" }]
      );
      setStep("product-camera");
    } finally {
      setIsProcessing(false);
    }
  };

  const processExpiryPhoto = async () => {
    if (!expiryPhotoUri) return;
    if (!apiKey) {
      Alert.alert("Error", "API key not found. Please set it in settings.");
      router.push("/settings");
      return;
    }

    setIsProcessing(true);
    try {
      // Resize and compress the image
      const manipResult = await ImageManipulator.manipulateAsync(
        expiryPhotoUri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Convert to base64
      const base64 = await imageToBase64(manipResult.uri);

      // Extract expiry date with Gemini
      const dateData = await extractExpiryDate(apiKey, base64);

      setFormData((prev) => ({
        ...prev,
        ...dateData,
      }));

      setStep("confirm");
    } catch (error) {
      console.error("Error processing expiry photo:", error);
      Alert.alert("Error", "Failed to extract expiry date. Please try again.", [
        { text: "OK" },
      ]);
      setStep("expiry-camera");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
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

  if (hasPermission === null) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View className="flex-1 justify-center items-center p-4 bg-background">
        <Text className="text-center mb-4">
          We need camera access to take pictures of your products and expiry
          dates.
        </Text>
        <Button onPress={() => router.back()}>Go Back</Button>
      </View>
    );
  }

  if (!apiKey) {
    return (
      <View className="flex-1 justify-center items-center p-4 bg-background">
        <Text className="text-center mb-4">
          You need to set up your Gemini API key to use this feature.
        </Text>
        <Button onPress={() => router.push("/settings")}>Go to Settings</Button>
      </View>
    );
  }

  if (isProcessing) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#0000ff" />
        <Text className="mt-4">Processing image with AI...</Text>
      </View>
    );
  }

  // Camera view for product
  if (step === "product-camera") {
    return (
      <View className="flex-1 bg-black">
        <Camera
          ref={cameraRef}
          type={cameraType}
          className="flex-1"
          ratio="16:9"
        >
          <View className="flex-1 bg-transparent">
            {/* Header */}
            <View className="flex-row justify-between items-center p-4">
              <TouchableOpacity
                onPress={handleBack}
                className="w-10 h-10 rounded-full bg-black/50 justify-center items-center"
              >
                <X size={24} color="white" />
              </TouchableOpacity>

              <View className="bg-black/50 px-4 py-2 rounded-full">
                <Text className="text-white font-medium">Product Photo</Text>
              </View>

              <TouchableOpacity
                onPress={toggleCameraType}
                className="w-10 h-10 rounded-full bg-black/50 justify-center items-center"
              >
                <RotateCcw size={20} color="white" />
              </TouchableOpacity>
            </View>

            {/* Instructions */}
            <View className="flex-1 justify-center items-center">
              <View className="bg-black/50 p-4 rounded-lg m-4">
                <Text className="text-white text-center">
                  Take a clear photo of the product
                </Text>
              </View>
            </View>

            {/* Footer */}
            <View className="p-8 justify-center items-center">
              <TouchableOpacity
                onPress={handleCapture}
                disabled={isCapturing}
                className="w-20 h-20 rounded-full border-4 border-white bg-white/20 justify-center items-center"
              >
                {isCapturing ? (
                  <ActivityIndicator size="large" color="white" />
                ) : (
                  <View className="w-16 h-16 rounded-full bg-white" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Camera>
      </View>
    );
  }

  // Preview for product photo
  if (step === "product-preview" && productPhotoUri) {
    return (
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row justify-between items-center p-4">
          <TouchableOpacity
            onPress={handleBack}
            className="w-10 h-10 rounded-full bg-muted justify-center items-center"
          >
            <X size={24} className="text-foreground" />
          </TouchableOpacity>

          <Text className="font-medium text-lg">Product Photo</Text>

          <TouchableOpacity
            onPress={processProductPhoto}
            className="w-10 h-10 rounded-full bg-primary justify-center items-center"
          >
            <Check size={24} className="text-primary-foreground" />
          </TouchableOpacity>
        </View>

        {/* Image */}
        <View className="flex-1 justify-center items-center p-4">
          <Image
            source={{ uri: productPhotoUri }}
            className="w-full h-full rounded-lg"
            resizeMode="contain"
          />
        </View>

        {/* Footer */}
        <View className="p-4 flex-row justify-between">
          <Button
            variant="outline"
            onPress={handleRetake}
            className="flex-1 mr-2"
          >
            Retake
          </Button>
          <Button onPress={processProductPhoto} className="flex-1 ml-2">
            Use Photo
          </Button>
        </View>
      </View>
    );
  }

  // Camera view for expiry date
  if (step === "expiry-camera") {
    return (
      <View className="flex-1 bg-black">
        <Camera
          ref={cameraRef}
          type={cameraType}
          className="flex-1"
          ratio="16:9"
        >
          <View className="flex-1 bg-transparent">
            {/* Header */}
            <View className="flex-row justify-between items-center p-4">
              <TouchableOpacity
                onPress={handleBack}
                className="w-10 h-10 rounded-full bg-black/50 justify-center items-center"
              >
                <X size={24} color="white" />
              </TouchableOpacity>

              <View className="bg-black/50 px-4 py-2 rounded-full">
                <Text className="text-white font-medium">
                  Expiry Date Photo
                </Text>
              </View>

              <TouchableOpacity
                onPress={toggleCameraType}
                className="w-10 h-10 rounded-full bg-black/50 justify-center items-center"
              >
                <RotateCcw size={20} color="white" />
              </TouchableOpacity>
            </View>

            {/* Instructions */}
            <View className="flex-1 justify-center items-center">
              <View className="bg-black/50 p-4 rounded-lg m-4">
                <Text className="text-white text-center">
                  Take a clear photo of the expiry date
                </Text>
              </View>
            </View>

            {/* Footer */}
            <View className="p-8 justify-center items-center">
              <TouchableOpacity
                onPress={handleCapture}
                disabled={isCapturing}
                className="w-20 h-20 rounded-full border-4 border-white bg-white/20 justify-center items-center"
              >
                {isCapturing ? (
                  <ActivityIndicator size="large" color="white" />
                ) : (
                  <View className="w-16 h-16 rounded-full bg-white" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Camera>
      </View>
    );
  }

  // Preview for expiry date photo
  if (step === "expiry-preview" && expiryPhotoUri) {
    return (
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row justify-between items-center p-4">
          <TouchableOpacity
            onPress={handleBack}
            className="w-10 h-10 rounded-full bg-muted justify-center items-center"
          >
            <X size={24} className="text-foreground" />
          </TouchableOpacity>

          <Text className="font-medium text-lg">Expiry Date Photo</Text>

          <TouchableOpacity
            onPress={processExpiryPhoto}
            className="w-10 h-10 rounded-full bg-primary justify-center items-center"
          >
            <Check size={24} className="text-primary-foreground" />
          </TouchableOpacity>
        </View>

        {/* Image */}
        <View className="flex-1 justify-center items-center p-4">
          <Image
            source={{ uri: expiryPhotoUri }}
            className="w-full h-full rounded-lg"
            resizeMode="contain"
          />
        </View>

        {/* Footer */}
        <View className="p-4 flex-row justify-between">
          <Button
            variant="outline"
            onPress={handleRetake}
            className="flex-1 mr-2"
          >
            Retake
          </Button>
          <Button onPress={processExpiryPhoto} className="flex-1 ml-2">
            Use Photo
          </Button>
        </View>
      </View>
    );
  }

  // Confirmation screen
  if (step === "confirm") {
    return (
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center p-4 border-b border-border">
          <TouchableOpacity
            onPress={handleBack}
            className="p-2 mr-2 rounded-full"
          >
            <ArrowLeft className="text-foreground" size={24} />
          </TouchableOpacity>
          <Text className="text-xl font-bold">Confirm Details</Text>
          <View className="flex-1" />
          <ThemeToggle />
        </View>

        {/* Content */}
        <View className="flex-1 p-4">
          {/* Product Image */}
          <View className="items-center mb-4">
            <Image
              source={{ uri: productPhotoUri }}
              className="w-40 h-40 rounded-lg"
              resizeMode="cover"
            />
          </View>

          {/* Details */}
          <View className="bg-muted p-4 rounded-lg mb-4">
            <View className="flex-row justify-between mb-2">
              <Text className="font-medium">Name:</Text>
              <Text>{formData.name}</Text>
            </View>

            <View className="flex-row justify-between mb-2">
              <Text className="font-medium">Category:</Text>
              <Text>{formData.category}</Text>
            </View>

            <View className="mb-2">
              <Text className="font-medium mb-1">Description:</Text>
              <Text className="text-muted-foreground">
                {formData.description}
              </Text>
            </View>

            <View className="flex-row justify-between mb-2">
              <Text className="font-medium">Expiry Date:</Text>
              <Text>{new Date(formData.expiryDate).toLocaleDateString()}</Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="font-medium">Purchase Date:</Text>
              <Text>
                {new Date(formData.purchaseDate).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <Text className="text-center text-muted-foreground mb-4">
            Please confirm the details extracted by AI
          </Text>

          {/* Buttons */}
          <View className="flex-row">
            <Button
              variant="outline"
              onPress={handleBack}
              className="flex-1 mr-2"
            >
              Back
            </Button>
            <Button onPress={handleConfirm} className="flex-1 ml-2">
              Confirm & Save
            </Button>
          </View>
        </View>
      </View>
    );
  }

  // Fallback
  return (
    <View className="flex-1 justify-center items-center bg-background">
      <Text>Something went wrong</Text>
      <Button onPress={() => router.push("/")}>Go Home</Button>
    </View>
  );
}
