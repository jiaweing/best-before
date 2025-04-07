# Best Before

<div align="center">
  <img src="./assets/images/icon.png" alt="Best Before Logo" width="120" height="120" style="border-radius: 20px;">
  <h3>AI-Powered Expiry Date Tracker</h3>
</div>

<p align="center">
  <b>Never waste food again.</b> Track expiry dates effortlessly with AI.
</p>

<div align="center">
  <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native">
  <img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Google Gemini">
</div>

---

## ✨ Features

- 📸 **AI-Powered Image Recognition** - Take photos of products and their expiry dates
- 🤖 **Gemini 2.0 Flash Integration** - Automatically extracts product details and expiry dates
- 📅 **Smart Expiry Tracking** - Organize items by expiration date
- 🌓 **Dark & Light Mode** - Beautiful UI in both themes
- 🔑 **Custom API Key** - Use your own Gemini API key

## 📱 Screenshots

<div align="center">
  <table>
    <tr>
      <td align="center"><strong>Home Screen</strong></td>
      <td align="center"><strong>Camera View</strong></td>
      <td align="center"><strong>Item Details</strong></td>
    </tr>
    <tr>
      <td><img src="./docs/screenshots/home.png" width="200" alt="Home Screen"></td>
      <td><img src="./docs/screenshots/camera.png" width="200" alt="Camera View"></td>
      <td><img src="./docs/screenshots/details.png" width="200" alt="Item Details"></td>
    </tr>
  </table>
</div>

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or newer)
- npm or pnpm
- Expo CLI
- Gemini API key from [Google AI Studio](https://ai.google.dev/)

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/yourusername/best-before.git
   cd best-before
   ```

2. Install dependencies

   ```bash
   npm install
   # or
   pnpm install
   ```

3. Start the development server

   ```bash
   npm run dev
   # or
   pnpm dev
   ```

4. Open the app on your device using Expo Go or run in a simulator

## 📖 How to Use

1. **Set Up Your API Key**

   - Go to Settings and enter your Gemini API key
   - The key is securely stored on your device

2. **Add a New Item**

   - Tap the "+" button on the home screen
   - Take a photo of the product
   - Take a photo of the expiry date
   - Confirm or edit the details extracted by AI
   - Save the item

3. **Manage Your Items**
   - View all items sorted by expiry date
   - Get notifications before items expire
   - Edit or delete items as needed

## 🛠️ Technologies Used

- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform for React Native
- **NativeWind** - Tailwind CSS for React Native
- **Gemini AI API** - Google's advanced AI model for image analysis
- **Zustand** - State management
- **Expo Camera** - Camera integration
- **Expo Secure Store** - Secure API key storage

## 🧩 Project Structure

```
best-before/
├── app/                  # Main application screens
├── assets/               # Images and other static assets
├── components/           # Reusable UI components
├── lib/                  # Utility functions and constants
├── services/             # API services (Gemini AI, storage)
├── types/                # TypeScript type definitions
└── ...
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [Google Gemini AI](https://ai.google.dev/) for the powerful image recognition capabilities
- [Expo](https://expo.dev/) for the excellent React Native development platform
- [NativeWind](https://www.nativewind.dev/) for bringing Tailwind CSS to React Native
