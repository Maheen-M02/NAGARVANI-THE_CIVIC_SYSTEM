import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
  en: {
    translation: {
      // Navigation
      "citizenPortal": "Citizen Portal",
      "fileTrackResolve": "File, Track & Resolve Complaints",
      "switchRole": "Switch Role",
      
      // Landing Page
      "everyComplaint": "Every Citizen Complaint",
      "heardResolvedAccountable": "Heard. Resolved. Accountable.",
      "aiPoweredDescription": "AI-powered grievance management for India's 1.4 billion citizens — complaint to resolution in under 48 hours.",
      "selectRole": "Select your role to explore",
      "builtForIndia": "Built for India's 1.4B citizens • AI + Blockchain powered • NagarVani 2025",
      
      // Citizen Portal
      "yourVoiceMatters": "Your voice matters 🗣️",
      "fileComplaintDescription": "File a complaint in under 60 seconds. Our AI instantly routes it to the right department — no more running around.",
      "fileComplaint": "File Complaint",
      "snapReport": "Snap & Report",
      "trackStatus": "Track Status",
      "recentActivity": "Recent Activity in Your Area",
      
      // Form Steps
      "yourInformation": "Your Information",
      "describeComplaint": "Describe Your Complaint",
      "aiReview": "AI Review",
      "reviewSubmit": "Review & Submit",
      
      // Form Fields
      "fullName": "Full Name",
      "phoneNumber": "Phone Number",
      "location": "Location",
      "wardPincode": "Ward / Pincode",
      "complaintTitle": "Complaint Title",
      "detailedDescription": "Detailed Description",
      
      // Buttons
      "next": "Next",
      "back": "Back",
      "submit": "Submit",
      "analyzeWithAI": "Analyze with AI",
      "looksGood": "Looks Good — Confirm",
      "submitComplaint": "Submit Complaint",
      "takePhoto": "Take Photo",
      "uploadPhoto": "Upload Photo",
      
      // Messages
      "fillRequiredFields": "Fill all required fields",
      "photoAnalyzed": "Photo analyzed! Please fill in your contact details.",
      "complaintFiled": "Complaint Filed!",
      "aiAnalysisComplete": "AI Analysis Complete",
      "photoAnalysisComplete": "Photo Analysis Complete",
      
      // Tracking
      "trackComplaint": "Track Your Complaint",
      "enterTicketId": "Enter your ticket ID. Try: NV-001 through NV-012",
      "track": "Track",
      "trackMyComplaint": "Track My Complaint",
      "fileAnother": "File Another",
      
      // Status
      "open": "Open",
      "inProgress": "In Progress",
      "resolved": "Resolved",
      "escalated": "Escalated",
      
      // Priority
      "critical": "Critical",
      "high": "High",
      "medium": "Medium",
      "low": "Low",
      
      // Notifications
      "notifications": "Notifications",
      "unread": "unread",
      "allCaughtUp": "All caught up!",
      "markAllRead": "Mark all read",
      "clearAll": "Clear all",
      "noNotifications": "No notifications yet",
      "notifyAboutUpdates": "We'll notify you about complaint updates",
      
      // Languages
      "language": "Language"
    }
  },
  hi: {
    translation: {
      // Navigation
      "citizenPortal": "नागरिक पोर्टल",
      "fileTrackResolve": "शिकायत दर्ज करें, ट्रैक करें और समाधान करें",
      "switchRole": "भूमिका बदलें",
      
      // Landing Page
      "everyComplaint": "हर नागरिक की शिकायत",
      "heardResolvedAccountable": "सुनी गई। हल की गई। जवाबदेह।",
      "aiPoweredDescription": "भारत के 1.4 बिलियन नागरिकों के लिए AI-संचालित शिकायत प्रबंधन — 48 घंटे में शिकायत से समाधान तक।",
      "selectRole": "अन्वेषण के लिए अपनी भूमिका चुनें",
      "builtForIndia": "भारत के 1.4B नागरिकों के लिए बनाया गया • AI + ब्लॉकचेन संचालित • नगरवाणी 2025",
      
      // Citizen Portal
      "yourVoiceMatters": "आपकी आवाज़ मायने रखती है 🗣️",
      "fileComplaintDescription": "60 सेकंड में शिकायत दर्ज करें। हमारा AI तुरंत इसे सही विभाग में भेज देता है — अब कोई भागदौड़ नहीं।",
      "fileComplaint": "शिकायत दर्ज करें",
      "snapReport": "फोटो लें और रिपोर्ट करें",
      "trackStatus": "स्थिति ट्रैक करें",
      "recentActivity": "आपके क्षेत्र में हाल की गतिविधि",
      
      // Form Steps
      "yourInformation": "आपकी जानकारी",
      "describeComplaint": "अपनी शिकायत का वर्णन करें",
      "aiReview": "AI समीक्षा",
      "reviewSubmit": "समीक्षा करें और जमा करें",
      
      // Form Fields
      "fullName": "पूरा नाम",
      "phoneNumber": "फोन नंबर",
      "location": "स्थान",
      "wardPincode": "वार्ड / पिनकोड",
      "complaintTitle": "शिकायत का शीर्षक",
      "detailedDescription": "विस्तृत विवरण",
      
      // Buttons
      "next": "आगे",
      "back": "पीछे",
      "submit": "जमा करें",
      "analyzeWithAI": "AI के साथ विश्लेषण करें",
      "looksGood": "अच्छा लगता है — पुष्टि करें",
      "submitComplaint": "शिकायत जमा करें",
      "takePhoto": "फोटो लें",
      "uploadPhoto": "फोटो अपलोड करें",
      
      // Messages
      "fillRequiredFields": "सभी आवश्यक फ़ील्ड भरें",
      "photoAnalyzed": "फोटो का विश्लेषण हो गया! कृपया अपनी संपर्क जानकारी भरें।",
      "complaintFiled": "शिकायत दर्ज की गई!",
      "aiAnalysisComplete": "AI विश्लेषण पूर्ण",
      "photoAnalysisComplete": "फोटो विश्लेषण पूर्ण",
      
      // Tracking
      "trackComplaint": "अपनी शिकायत को ट्रैक करें",
      "enterTicketId": "अपना टिकट ID दर्ज करें। कोशिश करें: NV-001 से NV-012 तक",
      "track": "ट्रैक करें",
      "trackMyComplaint": "मेरी शिकायत को ट्रैक करें",
      "fileAnother": "दूसरी दर्ज करें",
      
      // Status
      "open": "खुला",
      "inProgress": "प्रगति में",
      "resolved": "हल हो गया",
      "escalated": "बढ़ाया गया",
      
      // Priority
      "critical": "गंभीर",
      "high": "उच्च",
      "medium": "मध्यम",
      "low": "कम",
      
      // Notifications
      "notifications": "सूचनाएं",
      "unread": "अपठित",
      "allCaughtUp": "सब कुछ अप टू डेट है!",
      "markAllRead": "सभी को पढ़ा हुआ चिह्नित करें",
      "clearAll": "सभी साफ़ करें",
      "noNotifications": "अभी तक कोई सूचना नहीं",
      "notifyAboutUpdates": "हम आपको शिकायत अपडेट के बारे में सूचित करेंगे",
      
      // Languages
      "language": "भाषा",
      "english": "English",
      "hindi": "हिंदी",
      "bengali": "বাংলা",
      "telugu": "తెలుగు",
      "marathi": "मराठी",
      "tamil": "தமிழ்",
      "gujarati": "ગુજરાતી",
      "urdu": "اردو",
      "kannada": "ಕನ್ನಡ",
      "odia": "ଓଡ଼ିଆ",
      "punjabi": "ਪੰਜਾਬੀ",
      "malayalam": "മലയാളം"
    }
  },
  bn: {
    translation: {
      // Navigation
      "citizenPortal": "নাগরিক পোর্টাল",
      "fileTrackResolve": "অভিযোগ দাখিল, ট্র্যাক এবং সমাধান করুন",
      "switchRole": "ভূমিকা পরিবর্তন করুন",
      
      // Citizen Portal
      "yourVoiceMatters": "আপনার কণ্ঠস্বর গুরুত্বপূর্ণ 🗣️",
      "fileComplaintDescription": "৬০ সেকেন্ডে অভিযোগ দাখিল করুন। আমাদের AI তাৎক্ষণিকভাবে এটি সঠিক বিভাগে পাঠায় — আর কোনো ছোটাছুটি নেই।",
      "fileComplaint": "অভিযোগ দাখিল করুন",
      "snapReport": "ছবি তুলুন এবং রিপোর্ট করুন",
      "trackStatus": "অবস্থা ট্র্যাক করুন",
      
      // Form Fields
      "fullName": "পূর্ণ নাম",
      "phoneNumber": "ফোন নম্বর",
      "location": "অবস্থান",
      "complaintTitle": "অভিযোগের শিরোনাম",
      "detailedDescription": "বিস্তারিত বিবরণ",
      
      // Languages
      "language": "ভাষা",
      "english": "English",
      "hindi": "हिंदी",
      "bengali": "বাংলা"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    }
  });

export default i18n;