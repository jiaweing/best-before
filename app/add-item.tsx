import * as ImageManipulator from "expo-image-manipulator";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import CameraView from "~/components/CameraView";
import ImagePreview from "~/components/ImagePreview";
import ItemForm from "~/components/ItemForm";
import { ThemeToggle } from "~/components/ThemeToggle";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { ArrowLeft } from "~/lib/icons/ArrowLeft";
import {
  analyzeProductImage,
  extractExpiryDate,
  imageToBase64,
} from "~/services/gemini";
import { getApiKey } from "~/services/storage";
import { useStore } from "~/store";
import { ItemFormData } from "~/types";

// This is the main screen for adding items
export default function AddItemScreen() {
  const router = useRouter();
  const addItem = useStore((state) => state.addItem);
  const geminiConfig = useStore((state) => state.geminiConfig);

  const [step, setStep] = useState<
    "product-photo" | "expiry-photo" | "confirm"
  >("product-photo");
  const [productPhotoUri, setProductPhotoUri] = useState<string | null>(null);
  const [expiryPhotoUri, setExpiryPhotoUri] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ItemFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isApiKeyLoading, setIsApiKeyLoading] = useState(true);

  useEffect(() => {
    const loadApiKey = async () => {
      try {
        // First try to get from store
        if (geminiConfig && geminiConfig.apiKey) {
          console.log("Using API key from store");
          setApiKey(geminiConfig.apiKey);
          setIsApiKeyLoading(false);
          return;
        }

        // Fallback to secure storage
        const key = await getApiKey();
        if (key) {
          console.log("Using API key from secure storage");
          setApiKey(key);
        }
      } catch (error) {
        console.error("Error loading API key:", error);
      } finally {
        setIsApiKeyLoading(false);
      }
    };

    loadApiKey();
  }, [geminiConfig]);

  const handleBack = () => {
    if (step === "expiry-photo" && productPhotoUri) {
      setStep("product-photo");
    } else if (step === "confirm") {
      // If we have an expiry photo, go back to that step
      // Otherwise go back to product photo (we skipped the expiry photo step)
      if (expiryPhotoUri) {
        setStep("expiry-photo");
      } else {
        setStep("product-photo");
      }
    } else {
      router.back();
    }
  };

  const handleProductPhotoCapture = (uri: string) => {
    console.log("DEBUGGING - handleProductPhotoCapture called with URI:", uri);
    setProductPhotoUri(uri);

    // We'll handle the processing in the ImagePreview component's onAccept callback
    // This ensures we don't process the photo twice
  };

  const handleExpiryPhotoCapture = (uri: string) => {
    console.log("DEBUGGING - handleExpiryPhotoCapture called with URI:", uri);
    setExpiryPhotoUri(uri);

    // We'll handle the processing in the ImagePreview component's onAccept callback
    // This ensures we don't process the photo twice
  };

  const processProductPhoto = async (uri: string) => {
    console.log("DEBUGGING - processProductPhoto called with URI:", uri);
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

      // Analyze with Gemini - use key from either source
      const activeKey = apiKey || geminiConfig?.apiKey;
      console.log(
        "Using API key for product analysis:",
        activeKey ? "Key available" : "No key"
      );

      if (!activeKey) {
        throw new Error("API key not available");
      }

      const productData = await analyzeProductImage(activeKey, base64);

      console.log(
        "Product data received:",
        JSON.stringify(productData, null, 2)
      );

      console.log(
        "Checking for expiry date in product data:",
        productData.expiryDate ? "FOUND" : "NOT FOUND"
      );

      // Add more detailed debugging
      console.log(
        "DEBUGGING - productData:",
        JSON.stringify(productData, null, 2)
      );
      console.log("DEBUGGING - expiryDate value:", productData.expiryDate);
      console.log(
        "DEBUGGING - expiryDate type:",
        typeof productData.expiryDate
      );
      console.log(
        "DEBUGGING - expiryDate length:",
        productData.expiryDate ? productData.expiryDate.length : "N/A"
      );
      console.log(
        "DEBUGGING - expiryDate trimmed length:",
        productData.expiryDate ? productData.expiryDate.trim().length : "N/A"
      );
      console.log(
        "DEBUGGING - condition result:",
        !!(productData.expiryDate && productData.expiryDate.trim() !== "")
      );

      // Force the expiry date check to be more explicit
      const hasValidExpiryDate =
        typeof productData.expiryDate === "string" &&
        productData.expiryDate.trim().length > 0 &&
        productData.expiryDate.includes("-"); // Basic format check

      console.log("DEBUGGING - hasValidExpiryDate:", hasValidExpiryDate);

      if (hasValidExpiryDate) {
        console.log(
          "Expiry date found in product image, skipping to confirm:",
          productData.expiryDate
        );

        // Create the updated data object first
        const updatedData = {
          ...productData,
          imageUri: uri,
        };

        console.log(
          "Updated form data with expiry date:",
          JSON.stringify(updatedData, null, 2)
        );

        // Update form data and then set step in a more direct way
        setFormData(updatedData);

        // Force the step change immediately without using state update
        console.log("DEBUGGING - Setting step to confirm IMMEDIATELY");
        // Use a more direct approach to force the step change
        setTimeout(() => {
          console.log("DEBUGGING - FORCING step to confirm");
          setStep("confirm");
        }, 0);
      } else {
        // No expiry date found, update form data and proceed to expiry photo step
        console.log(
          "No expiry date found in product image, requesting second photo"
        );

        // Create the updated data object first
        const updatedData = {
          ...productData,
          imageUri: uri,
        };

        console.log(
          "Updated form data without expiry date:",
          JSON.stringify(updatedData, null, 2)
        );

        // Update form data and then set step
        setFormData(updatedData);

        // Force the step change immediately without using state update
        console.log("DEBUGGING - Setting step to expiry-photo IMMEDIATELY");
        // Use a more direct approach to force the step change
        setTimeout(() => {
          console.log("DEBUGGING - FORCING step to expiry-photo");
          setStep("expiry-photo");
        }, 0);
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
              // Update form data with image URI and check for expiry date
              const updatedData = {
                ...formData,
                imageUri: uri,
              };

              // Add more debugging
              console.log(
                "DEBUGGING ERROR HANDLER - updatedData:",
                JSON.stringify(updatedData, null, 2)
              );
              console.log(
                "DEBUGGING ERROR HANDLER - expiryDate value:",
                updatedData.expiryDate
              );

              // Force the expiry date check to be more explicit
              const hasValidExpiryDate =
                typeof updatedData.expiryDate === "string" &&
                updatedData.expiryDate.trim().length > 0 &&
                updatedData.expiryDate.includes("-"); // Basic format check

              console.log(
                "DEBUGGING ERROR HANDLER - hasValidExpiryDate:",
                hasValidExpiryDate
              );

              // Set the form data
              setFormData(updatedData);

              // Check if we already have an expiry date
              if (hasValidExpiryDate) {
                console.log(
                  "Using existing expiry date, skipping to confirm:",
                  updatedData.expiryDate
                );
                // Force the step change immediately without using state update
                console.log(
                  "DEBUGGING ERROR HANDLER - Setting step to confirm IMMEDIATELY"
                );
                // Use a more direct approach to force the step change
                setTimeout(() => {
                  console.log(
                    "DEBUGGING ERROR HANDLER - FORCING step to confirm"
                  );
                  setStep("confirm");
                }, 0);
              } else {
                console.log(
                  "No existing expiry date, going to expiry photo step"
                );
                // Force the step change immediately without using state update
                console.log(
                  "DEBUGGING ERROR HANDLER - Setting step to expiry-photo IMMEDIATELY"
                );
                // Use a more direct approach to force the step change
                setTimeout(() => {
                  console.log(
                    "DEBUGGING ERROR HANDLER - FORCING step to expiry-photo"
                  );
                  setStep("expiry-photo");
                }, 0);
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
    console.log("DEBUGGING - processExpiryPhoto called with URI:", uri);
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

      // Extract expiry date with Gemini - use key from either source
      const activeKey = apiKey || geminiConfig?.apiKey;
      console.log(
        "Using API key for expiry date extraction:",
        activeKey ? "Key available" : "No key"
      );

      if (!activeKey) {
        throw new Error("API key not available");
      }

      const dateData = await extractExpiryDate(activeKey, base64);

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

  const handleRetakeProductPhoto = () => {
    setProductPhotoUri(null);
  };

  const handleRetakeExpiryPhoto = () => {
    setExpiryPhotoUri(null);
    setStep("expiry-photo");
  };

  const handleFormSubmit = (data: ItemFormData) => {
    addItem(data);
    router.push("/");
  };

  if (isApiKeyLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Check both local state and store
  const hasKey = apiKey || (geminiConfig && !!geminiConfig.apiKey);
  console.log("Add Item screen - hasKey:", hasKey);

  if (!hasKey) {
    console.log("No API key found in add-item screen");
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

  // Show loading overlay
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#0000ff" />
        <Text className="mt-4">Processing image...</Text>
      </View>
    );
  }

  // Step 1: Take product photo
  if (step === "product-photo") {
    if (!productPhotoUri) {
      return (
        <CameraView
          onCapture={handleProductPhotoCapture}
          onCancel={handleBack}
          photoType="product"
        />
      );
    }

    console.log("DEBUGGING - Rendering ImagePreview for product photo");
    return (
      <ImagePreview
        imageUri={productPhotoUri}
        onAccept={() => {
          console.log("DEBUGGING - onAccept callback for product photo");
          processProductPhoto(productPhotoUri);
        }}
        onRetake={handleRetakeProductPhoto}
        photoType="product"
      />
    );
  }

  // Step 2: Take expiry date photo
  if (step === "expiry-photo") {
    if (!expiryPhotoUri) {
      return (
        <CameraView
          onCapture={handleExpiryPhotoCapture}
          onCancel={handleBack}
          photoType="expiry"
        />
      );
    }

    console.log("DEBUGGING - Rendering ImagePreview for expiry photo");
    return (
      <ImagePreview
        imageUri={expiryPhotoUri}
        onAccept={() => {
          console.log("DEBUGGING - onAccept callback for expiry photo");
          processExpiryPhoto(expiryPhotoUri);
        }}
        onRetake={handleRetakeExpiryPhoto}
        photoType="expiry"
      />
    );
  }

  // Step 3: Confirm details
  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center p-4 border-b border-border">
        <Button variant="ghost" className="p-2 mr-2" onPress={handleBack}>
          <ArrowLeft className="text-foreground" size={24} />
        </Button>
        <Text className="text-xl font-bold">Confirm Details</Text>
        <View className="flex-1" />
        <ThemeToggle />
      </View>

      {/* Form */}
      <ItemForm
        initialData={formData}
        onSubmit={handleFormSubmit}
        onCancel={handleBack}
      />
    </View>
  );
}
