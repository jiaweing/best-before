import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/generative-ai";
import * as FileSystem from "expo-file-system";
import { ItemFormData } from "~/types";

// Helper function to extract JSON from text
const extractJsonFromText = (text: string) => {
  // Try different methods to extract JSON

  // Method 1: Try to parse the entire text as JSON
  try {
    return JSON.parse(text);
  } catch (e) {
    // Continue to next method if this fails
  }

  // Method 2: Look for JSON object pattern with regex
  try {
    const jsonRegex = /\{[\s\S]*\}/; // Match anything between { and }, including newlines
    const match = text.match(jsonRegex);
    if (match) {
      return JSON.parse(match[0]);
    }
  } catch (e) {
    // Continue to next method if this fails
  }

  // Method 3: Try to clean the text and then parse
  try {
    // Remove markdown code blocks if present
    let cleanedText = text.replace(/```json\n|```\n|```/g, "");
    // Trim whitespace
    cleanedText = cleanedText.trim();
    return JSON.parse(cleanedText);
  } catch (e) {
    // Continue to next method if this fails
  }

  // If all methods fail, throw an error
  throw new Error("Could not extract valid JSON from text");
};

// Helper function to convert image to base64
export const imageToBase64 = async (uri: string): Promise<string> => {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    console.error("Error converting image to base64:", error);
    throw error;
  }
};

// Function to analyze product image
export const analyzeProductImage = async (
  apiKey: string,
  imageBase64: string
): Promise<Partial<ItemFormData>> => {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 1,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    const prompt = `
      Analyze this product image and extract the following information:
      1. Product name
      2. Product description (brief)
      3. Product category (e.g., Dairy, Meat, Vegetables, Fruits, Beverages, Snacks, Canned Goods, etc.)

      IMPORTANT: Return ONLY a valid JSON object with no additional text, comments, or explanations.
      The JSON must have the following format:
      {
        "name": "Product Name",
        "description": "Product Description",
        "category": "Product Category"
      }

      Do not include any markdown formatting, code blocks, or any text before or after the JSON.
      The response should start with '{' and end with '}' with no other characters.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64,
        },
      },
    ]);

    const response = result.response;
    const text = response.text();

    // Extract JSON from the response
    console.log("Gemini response text:", text);

    try {
      return extractJsonFromText(text);
    } catch (error) {
      console.error("Error extracting JSON:", error);
      throw new Error("Failed to parse JSON from Gemini response");
    }
  } catch (error) {
    console.error("Error analyzing product image:", error);
    // Return default values as fallback
    return {
      name: "Unknown Product",
      description: "Could not analyze product image",
      category: "Other",
    };
  }
};

// Function to extract expiry date from image
export const extractExpiryDate = async (
  apiKey: string,
  imageBase64: string
): Promise<{ expiryDate: string; purchaseDate: string }> => {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.2,
        topK: 32,
        topP: 1,
      },
    });

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const prompt = `
      Look at this image of a product expiry date and extract the following information:
      1. Expiry date (best before date, use by date, or expiration date)

      IMPORTANT: Return ONLY a valid JSON object with no additional text, comments, or explanations.
      The JSON must have the following format:
      {
        "expiryDate": "YYYY-MM-DD",
        "purchaseDate": "${today}"
      }

      If you can't determine the exact date, make your best guess based on visible information.
      Format the date as YYYY-MM-DD.
      Do not include any markdown formatting, code blocks, or any text before or after the JSON.
      The response should start with '{' and end with '}' with no other characters.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64,
        },
      },
    ]);

    const response = result.response;
    const text = response.text();

    // Extract JSON from the response
    console.log("Gemini expiry date response text:", text);

    try {
      return extractJsonFromText(text);
    } catch (error) {
      console.error("Error extracting JSON:", error);
      throw new Error("Failed to parse JSON from Gemini response");
    }
  } catch (error) {
    console.error("Error extracting expiry date:", error);
    // Return today's date as fallback
    const today = new Date().toISOString().split("T")[0];
    return {
      expiryDate: today,
      purchaseDate: today,
    };
  }
};
