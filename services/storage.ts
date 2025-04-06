import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const API_KEY_STORAGE_KEY = "best-before-gemini-api-key";
const ASYNC_STORAGE_KEY = "@BestBefore:apiKey";

export const saveApiKey = async (apiKey: string): Promise<void> => {
  console.log("saveApiKey called with key length:", apiKey.length);
  try {
    // Try SecureStore first
    try {
      console.log("Attempting to save API key to SecureStore...");
      await SecureStore.setItemAsync(API_KEY_STORAGE_KEY, apiKey);
      console.log("API key saved to SecureStore successfully");

      // Verify it was saved
      const savedKey = await SecureStore.getItemAsync(API_KEY_STORAGE_KEY);
      console.log(
        "Verification - API key retrieved from SecureStore:",
        savedKey ? "Key exists" : "Key missing"
      );

      if (!savedKey) {
        throw new Error("SecureStore verification failed");
      }
    } catch (secureStoreError) {
      // Fallback to AsyncStorage
      console.log(
        "SecureStore failed, falling back to AsyncStorage...",
        secureStoreError
      );
      await AsyncStorage.setItem(ASYNC_STORAGE_KEY, apiKey);
      console.log("API key saved to AsyncStorage successfully");

      // Verify it was saved in AsyncStorage
      const asyncSavedKey = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
      console.log(
        "Verification - API key retrieved from AsyncStorage:",
        asyncSavedKey ? "Key exists" : "Key missing"
      );
    }
  } catch (error) {
    console.error("Error saving API key:", error);
    throw error;
  }
};

export const getApiKey = async (): Promise<string | null> => {
  console.log("getApiKey called");
  try {
    // Try SecureStore first
    try {
      const key = await SecureStore.getItemAsync(API_KEY_STORAGE_KEY);
      console.log(
        "API key retrieved from SecureStore:",
        key ? "Key exists" : "Key missing"
      );

      if (key) {
        return key;
      }
      throw new Error("Key not found in SecureStore");
    } catch (secureStoreError) {
      // Fallback to AsyncStorage
      console.log(
        "SecureStore failed, trying AsyncStorage...",
        secureStoreError
      );
      const asyncKey = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
      console.log(
        "API key retrieved from AsyncStorage:",
        asyncKey ? "Key exists" : "Key missing"
      );
      return asyncKey;
    }
  } catch (error) {
    console.error("Error getting API key:", error);
    return null;
  }
};

export const deleteApiKey = async (): Promise<void> => {
  console.log("deleteApiKey called");
  try {
    // Delete from both storage mechanisms
    try {
      await SecureStore.deleteItemAsync(API_KEY_STORAGE_KEY);
      console.log("API key deleted from SecureStore");

      // Verify it was deleted from SecureStore
      const key = await SecureStore.getItemAsync(API_KEY_STORAGE_KEY);
      console.log(
        "Verification after delete from SecureStore - API key exists:",
        key ? "Yes (failed)" : "No (success)"
      );
    } catch (secureStoreError) {
      console.log("Error deleting from SecureStore:", secureStoreError);
    }

    try {
      await AsyncStorage.removeItem(ASYNC_STORAGE_KEY);
      console.log("API key deleted from AsyncStorage");

      // Verify it was deleted from AsyncStorage
      const asyncKey = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
      console.log(
        "Verification after delete from AsyncStorage - API key exists:",
        asyncKey ? "Yes (failed)" : "No (success)"
      );
    } catch (asyncStorageError) {
      console.log("Error deleting from AsyncStorage:", asyncStorageError);
    }
  } catch (error) {
    console.error("Error deleting API key:", error);
    throw error;
  }
};
