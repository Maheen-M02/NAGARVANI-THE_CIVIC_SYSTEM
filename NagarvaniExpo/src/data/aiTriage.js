import { DEPARTMENTS } from './seed';
import clipService from '../services/clipService';

const OFFICERS = [
  { id: 'off_001', name: 'Rajesh Kumar', avatar: 'RK', rating: 4.8, load: '12 cases' },
  { id: 'off_002', name: 'Sunita Devi', avatar: 'SD', rating: 4.9, load: '8 cases' },
  { id: 'off_003', name: 'Amit Singh', avatar: 'AS', rating: 4.7, load: '15 cases' },
];

const CATEGORIES = [
  { name: 'Road Infrastructure', dept: 'pwd_roads', keywords: ['road', 'pothole', 'street', 'pavement', 'traffic'], priority: 'High', sla: 48 },
  { name: 'Street Lighting', dept: 'electricity', keywords: ['light', 'lamp', 'dark', 'electricity'], priority: 'Medium', sla: 72 },
  { name: 'Waste Management', dept: 'sanitation', keywords: ['garbage', 'waste', 'trash', 'clean'], priority: 'Medium', sla: 24 },
  { name: 'Water Supply', dept: 'water', keywords: ['water', 'pipe', 'leak', 'supply'], priority: 'High', sla: 12 },
  { name: 'Public Health', dept: 'health', keywords: ['health', 'hospital', 'medical', 'disease'], priority: 'High', sla: 6 },
];

export function aiTriage(text, photo = null) {
  const words = text.toLowerCase().split(/\s+/);
  let bestMatch = CATEGORIES[0];
  let maxScore = 0;

  CATEGORIES.forEach(cat => {
    const score = cat.keywords.reduce((acc, keyword) => 
      acc + words.filter(word => word.includes(keyword)).length, 0
    );
    if (score > maxScore) {
      maxScore = score;
      bestMatch = cat;
    }
  });

  // Enhanced confidence calculation
  let baseConfidence = Math.min(95, 65 + maxScore * 8);
  
  // Boost confidence if photo is provided
  if (photo) {
    if (photo.isClipResult && !photo.fallback) {
      // Real CLIP analysis provides higher confidence boost
      baseConfidence = Math.min(98, baseConfidence + 20);
    } else {
      // Standard photo boost for fallback or non-CLIP photos
      baseConfidence = Math.min(95, baseConfidence + 15);
    }
  }

  const department = DEPARTMENTS.find(d => d.id === bestMatch.dept);
  const officer = OFFICERS[Math.floor(Math.random() * OFFICERS.length)];
  
  return {
    ticketId: `NV-${String(Math.floor(Math.random() * 900) + 100)}`,
    category: bestMatch.name,
    department,
    priority: bestMatch.priority,
    slaHours: bestMatch.sla,
    confidence: baseConfidence,
    officer,
    hasPhoto: !!photo,
    clipAnalysis: photo?.isClipResult || false,
    fallbackUsed: photo?.fallback || false
  };
}

// AI image classification using CLIP model
export async function aiImageClassification(imageAsset) {
  try {
    // Use CLIP service for real AI classification
    const result = await clipService.detectIssue(imageAsset);
    
    if (result.success) {
      return {
        title: result.data.title,
        description: result.data.description,
        category: result.data.category,
        confidence: result.data.confidence,
        issue: result.data.issue,
        department: result.data.department,
        isClipResult: true,
        fallback: result.data.fallback || false
      };
    }
  } catch (error) {
    console.error('CLIP classification failed:', error);
  }

  // Fallback to simple classification if CLIP fails
  return fallbackImageClassification(imageAsset);
}

// Fallback classification for when CLIP is unavailable
function fallbackImageClassification(imageAsset) {
  const classifications = [
    { 
      title: 'Pothole on main road', 
      description: 'Large pothole causing traffic issues and potential vehicle damage.',
      category: 'Road Infrastructure',
      issue: 'pothole on road'
    },
    { 
      title: 'Broken streetlight', 
      description: 'Non-functional street lighting creating safety concerns for pedestrians.',
      category: 'Street Lighting',
      issue: 'broken streetlight'
    },
    { 
      title: 'Overflowing garbage bin', 
      description: 'Waste management issue with bins not being emptied regularly.',
      category: 'Waste Management',
      issue: 'garbage pile'
    },
    { 
      title: 'Water pipe leakage', 
      description: 'Visible water leakage from municipal pipeline causing wastage.',
      category: 'Water Supply',
      issue: 'water leakage'
    }
  ];
  
  const selected = classifications[Math.floor(Math.random() * classifications.length)];
  
  return {
    ...selected,
    confidence: 65 + Math.floor(Math.random() * 20), // 65-85% confidence for fallback
    isClipResult: false,
    fallback: true
  };
}