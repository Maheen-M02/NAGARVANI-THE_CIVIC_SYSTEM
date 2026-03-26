# NagarVani Mobile - Expo Version

A React Native mobile application built with Expo for citizens to file and track civic complaints.

## 🚀 Quick Start with Expo Go

1. **Install Expo Go** on your phone:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Start the development server:**
   ```bash
   cd NagarvaniExpo
   npx expo start
   ```

3. **Scan the QR code** with your phone:
   - **iOS**: Use the Camera app to scan the QR code
   - **Android**: Use the Expo Go app to scan the QR code

4. **The app will load directly on your phone!**

## ✨ Features

### 🏠 Home Screen
- Clean dashboard with quick action buttons
- Recent complaints overview
- File Complaint, Snap & Report, and Track Status options

### 📝 File Complaint Flow
- 4-step process: Personal Info → Complaint Details → AI Review → Submit
- Photo capture with camera/gallery integration
- AI-powered photo analysis that auto-fills complaint details
- Sample complaints for quick testing
- Real-time AI triage and categorization

### 📸 Photo Features
- Camera integration using Expo ImagePicker
- AI image classification that suggests complaint titles/descriptions
- Visual evidence attachment with confidence boost indicators

### 🔍 Track Complaints
- Search by ticket ID (try NV-001, NV-002)
- Detailed complaint view with status updates
- Timeline of progress updates
- Department and officer assignment info

### ✅ Success Screen
- Confirmation after filing complaints
- Quick access to track the new complaint
- Option to file another complaint

## 🛠 Tech Stack

- **Expo SDK 55** - Development platform
- **React Native** - Mobile framework
- **React Navigation 6** - Screen navigation
- **Expo ImagePicker** - Camera and gallery access
- **Context API** - State management

## 📱 Testing the App

### File a Complaint:
1. Tap "File Complaint" on home screen
2. Fill in your details (use any test data)
3. Add a photo or use sample complaints
4. Watch AI analyze and categorize
5. Submit and get a ticket ID

### Track Complaints:
1. Tap "Track Status"
2. Try ticket IDs: **NV-001**, **NV-002**
3. View detailed status and updates

### Photo Features:
1. Use "Snap & Report" for photo-first complaints
2. AI will analyze and auto-fill details
3. Works with both camera and gallery

## 🔧 Development Commands

```bash
# Start development server
npx expo start

# Start with specific platform
npx expo start --ios
npx expo start --android

# Run on web browser
npx expo start --web

# Clear cache
npx expo start --clear
```

## 📦 Building for Production

```bash
# Build for Android
npx eas build --platform android

# Build for iOS
npx eas build --platform ios

# Submit to app stores
npx eas submit
```

## 🎯 Key Advantages of Expo Version

1. **Instant Testing**: No need for Android Studio or Xcode
2. **Easy Sharing**: Share QR code with team members
3. **Hot Reloading**: Changes appear instantly
4. **Cross-Platform**: Works on iOS, Android, and web
5. **Simple Deployment**: Easy app store submission

## 🔐 Permissions

The app requests the following permissions:
- **Camera**: To capture photos of civic issues
- **Photo Library**: To select existing photos
- **Storage**: To save and process images

## 🌟 Sample Data

The app includes sample complaints and data for testing:
- Pre-loaded complaints (NV-001, NV-002)
- Sample complaint templates
- Mock AI analysis responses
- Simulated government departments

## 🚀 Next Steps

- Connect to real backend API
- Add push notifications
- Implement offline sync
- Add user authentication
- Integrate with government systems
- Add multilingual support

## 📞 Support

For issues or questions:
1. Check the Expo documentation
2. Use `npx expo doctor` to diagnose issues
3. Clear cache with `npx expo start --clear`

---

**Ready to test?** Just run `npx expo start` and scan the QR code!