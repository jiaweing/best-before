import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { Alert } from "react-native";
import { Item } from "~/types";

// Export items to a JSON file
export const exportItemsToJson = async (items: Item[]): Promise<void> => {
  try {
    // Create a JSON string from the items
    const jsonData = JSON.stringify({ items }, null, 2);
    
    // Create a temporary file path
    const fileDate = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `best-before-export-${fileDate}.json`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;
    
    // Write the JSON data to the file
    await FileSystem.writeAsStringAsync(filePath, jsonData);
    
    // Check if sharing is available
    const isSharingAvailable = await Sharing.isAvailableAsync();
    
    if (isSharingAvailable) {
      // Share the file
      await Sharing.shareAsync(filePath, {
        mimeType: "application/json",
        dialogTitle: "Export Best Before Data",
        UTI: "public.json",
      });
    } else {
      Alert.alert(
        "Sharing not available",
        "Sharing is not available on this device."
      );
    }
  } catch (error) {
    console.error("Error exporting items:", error);
    Alert.alert("Export Error", "Failed to export items. Please try again.");
    throw error;
  }
};

// Import items from a JSON file
export const importItemsFromJson = async (): Promise<Item[] | null> => {
  try {
    // Pick a document
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/json",
      copyToCacheDirectory: true,
    });
    
    // Check if the user canceled the picker
    if (result.canceled) {
      return null;
    }
    
    // Read the file content
    const fileUri = result.assets[0].uri;
    const fileContent = await FileSystem.readAsStringAsync(fileUri);
    
    // Parse the JSON data
    const parsedData = JSON.parse(fileContent);
    
    // Validate the data structure
    if (!parsedData.items || !Array.isArray(parsedData.items)) {
      throw new Error("Invalid data format. Expected an object with an 'items' array.");
    }
    
    // Validate each item in the array
    const validatedItems = parsedData.items.map((item: any) => {
      // Ensure all required fields are present
      if (!item.id || !item.name || !item.expiryDate) {
        throw new Error("Invalid item data. Missing required fields.");
      }
      
      // Return the validated item
      return {
        id: item.id,
        name: item.name,
        description: item.description || "",
        category: item.category || "",
        expiryDate: item.expiryDate,
        purchaseDate: item.purchaseDate || new Date().toISOString(),
        imageUri: item.imageUri || "https://via.placeholder.com/300",
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
      };
    });
    
    return validatedItems;
  } catch (error) {
    console.error("Error importing items:", error);
    Alert.alert(
      "Import Error",
      "Failed to import items. Please make sure the file is a valid JSON export from Best Before."
    );
    return null;
  }
};
