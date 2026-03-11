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
      "language": "भाषा"
    }
  },
  bn: {
    translation: {
      // Navigation
      "citizenPortal": "নাগরিক পোর্টাল",
      "fileTrackResolve": "অভিযোগ দাখিল, ট্র্যাক এবং সমাধান করুন",
      "switchRole": "ভূমিকা পরিবর্তন করুন",
      
      // Landing Page
      "everyComplaint": "প্রতিটি নাগরিকের অভিযোগ",
      "heardResolvedAccountable": "শোনা হয়েছে। সমাধান হয়েছে। জবাবদিহি।",
      "aiPoweredDescription": "ভারতের ১.৪ বিলিয়ন নাগরিকের জন্য AI-চালিত অভিযোগ ব্যবস্থাপনা — ৪৮ ঘন্টায় অভিযোগ থেকে সমাধান।",
      "selectRole": "অন্বেষণের জন্য আপনার ভূমিকা নির্বাচন করুন",
      "builtForIndia": "ভারতের ১.৪B নাগরিকদের জন্য নির্মিত • AI + ব্লকচেইন চালিত • নগরবাণী ২০২৫",
      
      // Citizen Portal
      "yourVoiceMatters": "আপনার কণ্ঠস্বর গুরুত্বপূর্ণ 🗣️",
      "fileComplaintDescription": "৬০ সেকেন্ডে অভিযোগ দাখিল করুন। আমাদের AI তাৎক্ষণিকভাবে এটি সঠিক বিভাগে পাঠায় — আর কোনো ছোটাছুটি নেই।",
      "fileComplaint": "অভিযোগ দাখিল করুন",
      "snapReport": "ছবি তুলুন এবং রিপোর্ট করুন",
      "trackStatus": "অবস্থা ট্র্যাক করুন",
      "recentActivity": "আপনার এলাকায় সাম্প্রতিক কার্যকলাপ",
      
      // Form Steps
      "yourInformation": "আপনার তথ্য",
      "describeComplaint": "আপনার অভিযোগ বর্ণনা করুন",
      "aiReview": "AI পর্যালোচনা",
      "reviewSubmit": "পর্যালোচনা করুন এবং জমা দিন",
      
      // Form Fields
      "fullName": "পূর্ণ নাম",
      "phoneNumber": "ফোন নম্বর",
      "location": "অবস্থান",
      "wardPincode": "ওয়ার্ড / পিনকোড",
      "complaintTitle": "অভিযোগের শিরোনাম",
      "detailedDescription": "বিস্তারিত বিবরণ",
      
      // Buttons
      "next": "পরবর্তী",
      "back": "পিছনে",
      "submit": "জমা দিন",
      "analyzeWithAI": "AI দিয়ে বিশ্লেষণ করুন",
      "looksGood": "ভাল লাগছে — নিশ্চিত করুন",
      "submitComplaint": "অভিযোগ জমা দিন",
      "takePhoto": "ছবি তুলুন",
      "uploadPhoto": "ছবি আপলোড করুন",
      
      // Messages
      "fillRequiredFields": "সমস্ত প্রয়োজনীয় ক্ষেত্র পূরণ করুন",
      "photoAnalyzed": "ছবি বিশ্লেষণ সম্পন্ন! দয়া করে আপনার যোগাযোগের তথ্য পূরণ করুন।",
      "complaintFiled": "অভিযোগ দাখিল হয়েছে!",
      "aiAnalysisComplete": "AI বিশ্লেষণ সম্পূর্ণ",
      "photoAnalysisComplete": "ছবি বিশ্লেষণ সম্পূর্ণ",
      
      // Tracking
      "trackComplaint": "আপনার অভিযোগ ট্র্যাক করুন",
      "enterTicketId": "আপনার টিকিট ID প্রবেশ করান। চেষ্টা করুন: NV-001 থেকে NV-012",
      "track": "ট্র্যাক করুন",
      "trackMyComplaint": "আমার অভিযোগ ট্র্যাক করুন",
      "fileAnother": "আরেকটি দাখিল করুন",
      
      // Status
      "open": "খোলা",
      "inProgress": "চলমান",
      "resolved": "সমাধান হয়েছে",
      "escalated": "বৃদ্ধি করা হয়েছে",
      
      // Priority
      "critical": "গুরুতর",
      "high": "উচ্চ",
      "medium": "মধ্যম",
      "low": "কম",
      
      // Notifications
      "notifications": "বিজ্ঞপ্তি",
      "unread": "অপঠিত",
      "allCaughtUp": "সব আপডেট!",
      "markAllRead": "সব পঠিত চিহ্নিত করুন",
      "clearAll": "সব পরিষ্কার করুন",
      "noNotifications": "এখনও কোনো বিজ্ঞপ্তি নেই",
      "notifyAboutUpdates": "আমরা আপনাকে অভিযোগ আপডেট সম্পর্কে জানাব",
      
      // Languages
      "language": "ভাষা"
    }
  },
  te: {
    translation: {
      // Navigation
      "citizenPortal": "పౌర పోర్టల్",
      "fileTrackResolve": "ఫిర్యాదు దాఖలు చేయండి, ట్రాక్ చేయండి మరియు పరిష్కరించండి",
      "switchRole": "పాత్రను మార్చండి",
      
      // Landing Page
      "everyComplaint": "ప్రతి పౌరుడి ఫిర్యాదు",
      "heardResolvedAccountable": "వినబడింది. పరిష్కరించబడింది. జవాబుదారీ.",
      "aiPoweredDescription": "భారతదేశంలోని 1.4 బిలియన్ పౌరుల కోసం AI-శక్తితో కూడిన ఫిర్యాదు నిర్వహణ — 48 గంటల్లో ఫిర్యాదు నుండి పరిష్కారం వరకు.",
      "selectRole": "అన్వేషణ కోసం మీ పాత్రను ఎంచుకోండి",
      "builtForIndia": "భారతదేశంలోని 1.4B పౌరుల కోసం నిర్మించబడింది • AI + బ్లాక్‌చెయిన్ శక్తితో • నగర్‌వాణి 2025",
      
      // Citizen Portal
      "yourVoiceMatters": "మీ గొంతు ముఖ్యం 🗣️",
      "fileComplaintDescription": "60 సెకన్లలో ఫిర్యాదు దాఖలు చేయండి. మా AI దానిని వెంటనే సరైన విభాగానికి పంపుతుంది — ఇకపై పరుగులు లేవు.",
      "fileComplaint": "ఫిర్యాదు దాఖలు చేయండి",
      "snapReport": "ఫోటో తీసి రిపోర్ట్ చేయండి",
      "trackStatus": "స్థితిని ట్రాక్ చేయండి",
      "recentActivity": "మీ ప్రాంతంలో ఇటీవలి కార్యకలాపాలు",
      
      // Form Steps
      "yourInformation": "మీ సమాచారం",
      "describeComplaint": "మీ ఫిర్యాదును వివరించండి",
      "aiReview": "AI సమీక్ష",
      "reviewSubmit": "సమీక్షించండి మరియు సమర్పించండి",
      
      // Form Fields
      "fullName": "పూర్తి పేరు",
      "phoneNumber": "ఫోన్ నంబర్",
      "location": "స్థానం",
      "wardPincode": "వార్డ్ / పిన్‌కోడ్",
      "complaintTitle": "ఫిర్యాదు శీర్షిక",
      "detailedDescription": "వివరణాత్మక వివరణ",
      
      // Buttons
      "next": "తదుపరి",
      "back": "వెనుకకు",
      "submit": "సమర్పించండి",
      "analyzeWithAI": "AI తో విశ్లేషించండి",
      "looksGood": "బాగుంది — నిర్ధారించండి",
      "submitComplaint": "ఫిర్యాదు సమర్పించండి",
      "takePhoto": "ఫోటో తీయండి",
      "uploadPhoto": "ఫోటో అప్‌లోడ్ చేయండి",
      
      // Languages
      "language": "భాష"
    }
  },
  mr: {
    translation: {
      // Navigation
      "citizenPortal": "नागरिक पोर्टल",
      "fileTrackResolve": "तक्रार दाखल करा, ट्रॅक करा आणि निराकरण करा",
      "switchRole": "भूमिका बदला",
      
      // Citizen Portal
      "yourVoiceMatters": "तुमचा आवाज महत्त्वाचा आहे 🗣️",
      "fileComplaintDescription": "60 सेकंदात तक्रार दाखल करा. आमचा AI तो लगेच योग्य विभागाकडे पाठवतो — आता धावपळ नाही.",
      "fileComplaint": "तक्रार दाखल करा",
      "snapReport": "फोटो काढा आणि रिपोर्ट करा",
      "trackStatus": "स्थिती ट्रॅक करा",
      
      // Form Fields
      "fullName": "पूर्ण नाव",
      "phoneNumber": "फोन नंबर",
      "location": "स्थान",
      "complaintTitle": "तक्रारीचे शीर्षक",
      "detailedDescription": "तपशीलवार वर्णन",
      
      // Languages
      "language": "भाषा"
    }
  },
  ta: {
    translation: {
      // Navigation
      "citizenPortal": "குடிமக்கள் போர்ட்டல்",
      "fileTrackResolve": "புகார் பதிவு செய்யுங்கள், கண்காணியுங்கள் மற்றும் தீர்க்கவும்",
      "switchRole": "பாத்திரத்தை மாற்றவும்",
      
      // Citizen Portal
      "yourVoiceMatters": "உங்கள் குரல் முக்கியம் 🗣️",
      "fileComplaintDescription": "60 வினாடிகளில் புகார் பதிவு செய்யுங்கள். எங்கள் AI உடனடியாக அதை சரியான துறைக்கு அனுப்புகிறது — இனி ஓடுதல் இல்லை.",
      "fileComplaint": "புகார் பதிவு செய்யுங்கள்",
      "snapReport": "புகைப்படம் எடுத்து புகாரளிக்கவும்",
      "trackStatus": "நிலையை கண்காணிக்கவும்",
      
      // Form Fields
      "fullName": "முழு பெயர்",
      "phoneNumber": "தொலைபேசி எண்",
      "location": "இடம்",
      "complaintTitle": "புகார் தலைப்பு",
      "detailedDescription": "விரிவான விளக்கம்",
      
      // Languages
      "language": "மொழி"
    }
  },
  gu: {
    translation: {
      // Navigation
      "citizenPortal": "નાગરિક પોર્ટલ",
      "fileTrackResolve": "ફરિયાદ દાખલ કરો, ટ્રેક કરો અને ઉકેલ કરો",
      "switchRole": "ભૂમિકા બદલો",
      
      // Citizen Portal
      "yourVoiceMatters": "તમારો અવાજ મહત્વનો છે 🗣️",
      "fileComplaintDescription": "60 સેકન્ડમાં ફરિયાદ દાખલ કરો. અમારી AI તરત જ તેને યોગ્ય વિભાગમાં મોકલે છે — હવે દોડાદોડી નહીં.",
      "fileComplaint": "ફરિયાદ દાખલ કરો",
      "snapReport": "ફોટો લો અને રિપોર્ટ કરો",
      "trackStatus": "સ્થિતિ ટ્રેક કરો",
      
      // Form Fields
      "fullName": "પૂરું નામ",
      "phoneNumber": "ફોન નંબર",
      "location": "સ્થાન",
      "complaintTitle": "ફરિયાદનું શીર્ષક",
      "detailedDescription": "વિગતવાર વર્ણન",
      
      // Languages
      "language": "ભાષા"
    }
  },
  ur: {
    translation: {
      // Navigation
      "citizenPortal": "شہری پورٹل",
      "fileTrackResolve": "شکایت درج کریں، ٹریک کریں اور حل کریں",
      "switchRole": "کردار تبدیل کریں",
      
      // Citizen Portal
      "yourVoiceMatters": "آپ کی آواز اہم ہے 🗣️",
      "fileComplaintDescription": "60 سیکنڈ میں شکایت درج کریں۔ ہماری AI فوری طور پر اسے صحیح شعبے میں بھیج دیتی ہے — اب کوئی بھاگ دوڑ نہیں۔",
      "fileComplaint": "شکایت درج کریں",
      "snapReport": "تصویر لیں اور رپورٹ کریں",
      "trackStatus": "حالت کو ٹریک کریں",
      
      // Form Fields
      "fullName": "پورا نام",
      "phoneNumber": "فون نمبر",
      "location": "مقام",
      "complaintTitle": "شکایت کا عنوان",
      "detailedDescription": "تفصیلی وضاحت",
      
      // Languages
      "language": "زبان"
    }
  },
  kn: {
    translation: {
      // Navigation
      "citizenPortal": "ನಾಗರಿಕ ಪೋರ್ಟಲ್",
      "fileTrackResolve": "ದೂರು ದಾಖಲಿಸಿ, ಟ್ರ್ಯಾಕ್ ಮಾಡಿ ಮತ್ತು ಪರಿಹರಿಸಿ",
      "switchRole": "ಪಾತ್ರವನ್ನು ಬದಲಾಯಿಸಿ",
      
      // Citizen Portal
      "yourVoiceMatters": "ನಿಮ್ಮ ಧ್ವನಿ ಮುಖ್ಯ 🗣️",
      "fileComplaintDescription": "60 ಸೆಕೆಂಡುಗಳಲ್ಲಿ ದೂರು ದಾಖಲಿಸಿ. ನಮ್ಮ AI ತಕ್ಷಣವೇ ಅದನ್ನು ಸರಿಯಾದ ವಿಭಾಗಕ್ಕೆ ಕಳುಹಿಸುತ್ತದೆ — ಇನ್ನು ಓಡಾಟವಿಲ್ಲ.",
      "fileComplaint": "ದೂರು ದಾಖಲಿಸಿ",
      "snapReport": "ಫೋಟೋ ತೆಗೆದು ವರದಿ ಮಾಡಿ",
      "trackStatus": "ಸ್ಥಿತಿಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ",
      
      // Form Fields
      "fullName": "ಪೂರ್ಣ ಹೆಸರು",
      "phoneNumber": "ಫೋನ್ ಸಂಖ್ಯೆ",
      "location": "ಸ್ಥಳ",
      "complaintTitle": "ದೂರಿನ ಶೀರ್ಷಿಕೆ",
      "detailedDescription": "ವಿವರವಾದ ವಿವರಣೆ",
      
      // Languages
      "language": "ಭಾಷೆ"
    }
  },
  or: {
    translation: {
      // Navigation
      "citizenPortal": "ନାଗରିକ ପୋର୍ଟାଲ",
      "fileTrackResolve": "ଅଭିଯୋଗ ଦାଖଲ କରନ୍ତୁ, ଟ୍ରାକ କରନ୍ତୁ ଏବଂ ସମାଧାନ କରନ୍ତୁ",
      "switchRole": "ଭୂମିକା ପରିବର୍ତ୍ତନ କରନ୍ତୁ",
      
      // Citizen Portal
      "yourVoiceMatters": "ଆପଣଙ୍କ ସ୍ୱର ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ 🗣️",
      "fileComplaintDescription": "60 ସେକେଣ୍ଡରେ ଅଭିଯୋଗ ଦାଖଲ କରନ୍ତୁ। ଆମର AI ତୁରନ୍ତ ଏହାକୁ ସଠିକ ବିଭାଗକୁ ପଠାଇଥାଏ — ଆଉ କୌଣସି ଦୌଡ଼ାଦୌଡ଼ି ନାହିଁ।",
      "fileComplaint": "ଅଭିଯୋଗ ଦାଖଲ କରନ୍ତୁ",
      "snapReport": "ଫଟୋ ନିଅନ୍ତୁ ଏବଂ ରିପୋର୍ଟ କରନ୍ତୁ",
      "trackStatus": "ସ୍ଥିତି ଟ୍ରାକ କରନ୍ତୁ",
      
      // Form Fields
      "fullName": "ପୂର୍ଣ୍ଣ ନାମ",
      "phoneNumber": "ଫୋନ ନମ୍ବର",
      "location": "ସ୍ଥାନ",
      "complaintTitle": "ଅଭିଯୋଗର ଶୀର୍ଷକ",
      "detailedDescription": "ବିସ୍ତୃତ ବର୍ଣ୍ଣନା",
      
      // Languages
      "language": "ଭାଷା"
    }
  },
  pa: {
    translation: {
      // Navigation
      "citizenPortal": "ਨਾਗਰਿਕ ਪੋਰਟਲ",
      "fileTrackResolve": "ਸ਼ਿਕਾਇਤ ਦਰਜ ਕਰੋ, ਟਰੈਕ ਕਰੋ ਅਤੇ ਹੱਲ ਕਰੋ",
      "switchRole": "ਭੂਮਿਕਾ ਬਦਲੋ",
      
      // Citizen Portal
      "yourVoiceMatters": "ਤੁਹਾਡੀ ਆਵਾਜ਼ ਮਹੱਤਵਪੂਰਨ ਹੈ 🗣️",
      "fileComplaintDescription": "60 ਸਕਿੰਟ ਵਿੱਚ ਸ਼ਿਕਾਇਤ ਦਰਜ ਕਰੋ। ਸਾਡਾ AI ਤੁਰੰਤ ਇਸਨੂੰ ਸਹੀ ਵਿਭਾਗ ਵਿੱਚ ਭੇਜ ਦਿੰਦਾ ਹੈ — ਹੁਣ ਕੋਈ ਭੱਜਣਾ ਨਹੀਂ।",
      "fileComplaint": "ਸ਼ਿਕਾਇਤ ਦਰਜ ਕਰੋ",
      "snapReport": "ਫੋਟੋ ਲਓ ਅਤੇ ਰਿਪੋਰਟ ਕਰੋ",
      "trackStatus": "ਸਥਿਤੀ ਟਰੈਕ ਕਰੋ",
      
      // Form Fields
      "fullName": "ਪੂਰਾ ਨਾਮ",
      "phoneNumber": "ਫੋਨ ਨੰਬਰ",
      "location": "ਸਥਾਨ",
      "complaintTitle": "ਸ਼ਿਕਾਇਤ ਦਾ ਸਿਰਲੇਖ",
      "detailedDescription": "ਵਿਸਤ੍ਰਿਤ ਵਰਣਨ",
      
      // Languages
      "language": "ਭਾਸ਼ਾ"
    }
  },
  ml: {
    translation: {
      // Navigation
      "citizenPortal": "പൗര പോർട്ടൽ",
      "fileTrackResolve": "പരാതി ഫയൽ ചെയ്യുക, ട്രാക്ക് ചെയ്യുക, പരിഹരിക്കുക",
      "switchRole": "റോൾ മാറ്റുക",
      
      // Citizen Portal
      "yourVoiceMatters": "നിങ്ങളുടെ ശബ്ദം പ്രധാനമാണ് 🗣️",
      "fileComplaintDescription": "60 സെക്കൻഡിൽ പരാതി ഫയൽ ചെയ്യുക. ഞങ്ങളുടെ AI ഉടനടി അത് ശരിയായ വകുപ്പിലേക്ക് അയയ്ക്കുന്നു — ഇനി ഓടിനടക്കേണ്ട.",
      "fileComplaint": "പരാതി ഫയൽ ചെയ്യുക",
      "snapReport": "ഫോട്ടോ എടുത്ത് റിപ്പോർട്ട് ചെയ്യുക",
      "trackStatus": "സ്ഥിതി ട്രാക്ക് ചെയ്യുക",
      
      // Form Fields
      "fullName": "പൂർണ്ണ നാമം",
      "phoneNumber": "ഫോൺ നമ്പർ",
      "location": "സ്ഥലം",
      "complaintTitle": "പരാതിയുടെ തലക്കെട്ട്",
      "detailedDescription": "വിശദമായ വിവരണം",
      
      // Languages
      "language": "ഭാഷ"
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