/**
 * Simple utility to generate unique IDs without relying on crypto.getRandomValues()
 * This is a workaround for the error: "crypto.getRandomValues() not supported"
 */

// Generate a random string of specified length
const generateRandomString = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Generate a timestamp-based ID with random suffix
export const generateId = (): string => {
  const timestamp = new Date().getTime().toString(36);
  const randomStr = generateRandomString(8);
  return `${timestamp}-${randomStr}`;
};
