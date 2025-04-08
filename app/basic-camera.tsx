import { format, parseISO } from "date-fns";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemeToggle } from "~/components/ThemeToggle";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { ArrowLeft } from "~/lib/icons/ArrowLeft";
import { Calendar } from "~/lib/icons/Calendar";
import { Camera } from "~/lib/icons/Camera";
import {
  analyzeProductImage,
  extractExpiryDate,
  imageToBase64,
} from "~/services/gemini";
import { getApiKey } from "~/services/storage";
import { useStore } from "~/store";

export default function BasicCameraScreen() {
  const router = useRouter();
  const addItem = useStore((state) => state.addItem);
  const geminiConfig = useStore((state) => state.geminiConfig);

  const [step, setStep] = useState<"product" | "expiry" | "confirm">("product");
  const [productPhotoUri, setProductPhotoUri] = useState<string | null>(null);
  const [expiryPhotoUri, setExpiryPhotoUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    expiryDate: new Date().toISOString(),
    purchaseDate: new Date().toISOString(),
    imageUri: "",
  });

  useEffect(() => {
    const loadApiKey = async () => {
      // Get API key
      const key = geminiConfig?.apiKey || (await getApiKey());
      setApiKey(key);
    };

    loadApiKey();
  }, [geminiConfig]);

  const handleTakePhoto = async () => {
    try {
      // Request camera permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Camera permission is required to take photos"
        );
        return;
      }

      // Take photo
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        if (step === "product") {
          setProductPhotoUri(uri);
          // Process with Gemini AI
          processProductPhoto(uri);
        } else if (step === "expiry") {
          setExpiryPhotoUri(uri);
          // Process with Gemini AI
          processExpiryPhoto(uri);
        }
      }
    } catch (error) {
      console.error("Error taking picture:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  const handleBack = () => {
    if (step === "product") {
      router.back();
    } else if (step === "expiry") {
      setStep("product");
    } else if (step === "confirm") {
      setStep("expiry");
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (field: string, value: string) => {
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

  const processProductPhoto = async (uri: string) => {
    // Get API key from either local state or store
    const key = apiKey || (geminiConfig && geminiConfig.apiKey);
    console.log("processProductPhoto - key available:", !!key);

    if (!key) {
      console.log("No API key found for processing product photo");
      Alert.alert("Error", "API key not found. Please set it in settings.");
      router.push("/settings");
      return;
    }

    setIsLoading(true);
    try {
      // Resize and compress the image
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Convert to base64
      const base64 = await imageToBase64(manipResult.uri);

      // Analyze with Gemini
      console.log(
        "Using API key for product analysis:",
        key ? "Key available" : "No key"
      );
      const productData = await analyzeProductImage(key, base64);

      // Check if an expiry date was found in the product photo
      console.log(
        "Checking for expiry date in product data:",
        productData.expiryDate ? "FOUND" : "NOT FOUND"
      );

      // Update form data with product info
      setFormData((prev) => ({
        ...prev,
        ...productData,
        imageUri: uri,
      }));

      // Check if we have a valid expiry date from the product photo
      if (productData.expiryDate && productData.expiryDate.trim() !== "") {
        console.log(
          "Expiry date found in product image, skipping to confirm:",
          productData.expiryDate
        );
        // Skip expiry photo step and go directly to confirm
        setStep("confirm");
      } else {
        console.log(
          "No expiry date found in product image, requesting second photo"
        );
        // Proceed to expiry photo step
        setStep("expiry");
      }
    } catch (error) {
      console.error("Error processing product photo:", error);
      Alert.alert(
        "Error",
        "Failed to analyze product photo. Please try again or enter details manually.",
        [
          {
            text: "Try Again",
            onPress: () => setProductPhotoUri(null),
          },
          {
            text: "Continue",
            onPress: () => {
              // Check if we already have an expiry date in the form data
              if (
                formData.expiryDate &&
                formData.expiryDate !== new Date().toISOString()
              ) {
                console.log(
                  "Using existing expiry date, skipping to confirm:",
                  formData.expiryDate
                );
                setStep("confirm");
              } else {
                console.log(
                  "No existing expiry date, going to expiry photo step"
                );
                setStep("expiry");
              }
            },
          },
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const processExpiryPhoto = async (uri: string) => {
    // Get API key from either local state or store
    const key = apiKey || (geminiConfig && geminiConfig.apiKey);
    console.log("processExpiryPhoto - key available:", !!key);

    if (!key) {
      console.log("No API key found for processing expiry photo");
      Alert.alert("Error", "API key not found. Please set it in settings.");
      router.push("/settings");
      return;
    }

    setIsLoading(true);
    try {
      // Resize and compress the image
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Convert to base64
      const base64 = await imageToBase64(manipResult.uri);

      // Extract expiry date with Gemini
      console.log(
        "Using API key for expiry date extraction:",
        key ? "Key available" : "No key"
      );
      const dateData = await extractExpiryDate(key, base64);

      setFormData((prev) => ({
        ...prev,
        ...dateData,
      }));

      setStep("confirm");
    } catch (error) {
      console.error("Error processing expiry photo:", error);
      Alert.alert(
        "Error",
        "Failed to extract expiry date. Please try again or enter details manually.",
        [
          {
            text: "Try Again",
            onPress: () => setExpiryPhotoUri(null),
          },
          {
            text: "Continue",
            onPress: () => setStep("confirm"),
          },
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateForInput = (dateString: string) => {
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

  if (!apiKey) {
    return (
      <View className="flex-1 justify-center items-center p-4 bg-background">
        <Text className="text-center mb-4">
          You need to set up your Gemini API key to use this feature.
        </Text>
        <Button onPress={() => router.push("/settings")}>
          <Text>Go to Settings</Text>
        </Button>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#0000ff" />
        <Text className="mt-4">Processing image with AI...</Text>
      </View>
    );
  }

  // Product photo step
  if (step === "product") {
    return (
      <View className="flex-1 bg-background pt-10">
        {/* Header */}
        <View className="flex-row items-center p-4 border-b border-border">
          <TouchableOpacity
            onPress={handleBack}
            className="p-2 mr-2 rounded-full"
          >
            <ArrowLeft className="text-foreground" size={24} />
          </TouchableOpacity>
          <Text className="text-xl font-bold">Take Product Photo</Text>
          <View className="flex-1" />
          <ThemeToggle />
        </View>

        {/* Content */}
        <View className="flex-1 justify-center items-center p-4">
          {productPhotoUri ? (
            <View className="items-center">
              <View className="w-64 aspect-[9/16] rounded-lg mb-4 overflow-hidden">
                <Image
                  source={{ uri: productPhotoUri }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
              <Text className="text-center mb-4">
                Photo captured! Tap "Next" to continue or "Retake" to try again.
              </Text>
              <View className="flex-row">
                <Button
                  variant="outline"
                  onPress={() => setProductPhotoUri(null)}
                  className="mr-2"
                >
                  <Text>Retake</Text>
                </Button>
                <Button onPress={() => processProductPhoto(productPhotoUri)}>
                  <Text>Next</Text>
                </Button>
              </View>
            </View>
          ) : (
            <View className="items-center">
              <View className="w-64 aspect-[9/16] bg-muted rounded-lg mb-4 justify-center items-center">
                <Camera size={48} className="text-muted-foreground" />
              </View>
              <Text className="text-center mb-4">
                Take a photo of the product to identify it
              </Text>
              <Button onPress={handleTakePhoto}>
                <Text>Take Photo</Text>
              </Button>
            </View>
          )}
        </View>
      </View>
    );
  }

  // Expiry photo step
  if (step === "expiry") {
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
          <Text className="text-xl font-bold">Take Expiry Date Photo</Text>
          <View className="flex-1" />
          <ThemeToggle />
        </View>

        {/* Content */}
        <View className="flex-1 justify-center items-center p-4">
          {expiryPhotoUri ? (
            <View className="items-center">
              <View className="w-64 aspect-[9/16] rounded-lg mb-4 overflow-hidden">
                <Image
                  source={{ uri: expiryPhotoUri }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
              <Text className="text-center mb-4">
                Photo captured! Tap "Next" to continue or "Retake" to try again.
              </Text>
              <View className="flex-row">
                <Button
                  variant="outline"
                  onPress={() => setExpiryPhotoUri(null)}
                  className="mr-2"
                >
                  <Text>Retake</Text>
                </Button>
                <Button onPress={() => processExpiryPhoto(expiryPhotoUri)}>
                  <Text>Next</Text>
                </Button>
              </View>
            </View>
          ) : (
            <View className="items-center">
              <View className="w-64 aspect-[9/16] bg-muted rounded-lg mb-4 justify-center items-center">
                <Calendar size={48} className="text-muted-foreground" />
              </View>
              <Text className="text-center mb-4">
                Take a photo of the expiry date
              </Text>
              <Button onPress={handleTakePhoto}>
                <Text>Take Photo</Text>
              </Button>
            </View>
          )}
        </View>
      </View>
    );
  }

  // Confirmation step
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
        <ScrollView className="flex-1 p-4">
          {/* Product Image */}
          <View className="items-center mb-4">
            <View className="w-40 aspect-[9/16] rounded-lg overflow-hidden">
              <Image
                source={{ uri: productPhotoUri || "" }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
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
                onChangeText={(value) =>
                  handleDateChange("purchaseDate", value)
                }
                placeholder="YYYY-MM-DD"
                className="flex-1 bg-background text-foreground"
              />
            </View>
            <Text className="text-xs text-muted-foreground mt-1">
              Format: YYYY-MM-DD
            </Text>
          </View>

          <Text className="text-center text-muted-foreground mb-4">
            Please confirm the details extracted by AI
          </Text>

          {/* Buttons */}
          <View className="flex-row mb-8">
            <Button
              variant="outline"
              onPress={handleBack}
              className="flex-1 mr-2"
            >
              <Text>Back</Text>
            </Button>
            <Button onPress={handleSubmit} className="flex-1 ml-2">
              <Text>Confirm & Save</Text>
            </Button>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Fallback
  return (
    <View className="flex-1 justify-center items-center bg-background">
      <Text>Something went wrong</Text>
      <Button onPress={() => router.push("/")}>
        <Text>Go Home</Text>
      </Button>
    </View>
  );
}
