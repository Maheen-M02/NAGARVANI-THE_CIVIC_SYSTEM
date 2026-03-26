import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Translation resources
const resources = {
  en: {
    translation: {
      // Navigation
      "citizenPortal": "Citizen Portal",
      "fileTrackResolve": "File, Track & Resolve Complaints",
      "switchRole": "Switch Role",
      
      // Home Screen
      "welcome": "Welcome to NagarVani",
      "yourVoiceMatters": "Your voice matters 🗣️",
      "fileComplaintDescription": "File a complaint in under 60 seconds. Our AI instantly routes it to the right department — no more running around.",
      "fileComplaint": "File Complaint",
      "trackComplaint": "Track Complaint",
      "recentComplaints": "Recent Complaints",
      "noComplaints": "No complaints yet",
      "startByFiling": "Start by filing your first complaint",
      
      // File Complaint Screen
      "fileNewComplaint": "File New Complaint",
      "complaintTitle": "Complaint Title",
      "enterTitle": "Enter complaint title",
      "description": "Description",
      "enterDescription": "Describe your complaint in detail",
      "category": "Category",
      "selectCategory": "Select a category",
      "location": "Location",
      "enterLocation": "Enter your location",
      "attachPhoto": "Attach Photo",
      "takePhoto": "Take Photo",
      "chooseFromGallery": "Choose from Gallery",
      "removePhoto": "Remove Photo",
      
      // Categories
      "road": "Road",
      "garbage": "Garbage",
      "water": "Water",
      "electricity": "Electricity",
      
      // Buttons
      "submit": "Submit",
      "cancel": "Cancel",
      "back": "Back",
      "next": "Next",
      "done": "Done",
      "retry": "Retry",
      "close": "Close",
      
      // Track Complaint Screen
      "trackYourComplaint": "Track Your Complaint",
      "enterComplaintId": "Enter Complaint ID",
      "track": "Track",
      "complaintNotFound": "Complaint not found",
      "enterValidId": "Please enter a valid complaint ID",
      
      // Complaint Details Screen
      "complaintDetails": "Complaint Details",
      "complaintId": "Complaint ID",
      "status": "Status",
      "submittedOn": "Submitted On",
      "lastUpdated": "Last Updated",
      "assignedTo": "Assigned To",
      "updates": "Updates",
      "noUpdates": "No updates yet",
      
      // Status
      "submitted": "Submitted",
      "assigned": "Assigned",
      "inProgress": "In Progress",
      "resolved": "Resolved",
      "closed": "Closed",
      
      // Success Screen
      "complaintSubmitted": "Complaint Submitted!",
      "thankYou": "Thank you for reporting",
      "complaintIdIs": "Your complaint ID is",
      "keepThisId": "Keep this ID to track your complaint",
      "trackThisComplai