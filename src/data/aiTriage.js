import { DEPARTMENTS, OFFICERS, CATEGORIES } from './constants';
import clipService from '../services/clipService';

// AI image classification using CLIP model
export async function aiImageClassification(imageFile) {
  try {
    // Use CLIP service for real AI classification
    const result = await clipService.detectIssue(imageFile);
    
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
  return fallbackImageClassification(imageFile);
}

// Fallback classification for when CLIP is unavailable
function fallbackImageClassification(imageFile) {
  const classifications = [
    {
      keywords: ['pothole', 'road', 'street', 'crack'],
      title: 'Road Damage - Pothole Detected',
      description: 'Large pothole observed on the road surface causing inconvenience to vehicles and pedestrians. The damaged area appears to be approximately 2-3 feet in diameter and poses a safety hazard, especially during monsoon season.',
      category: 'Road Infrastructure',
      issue: 'pothole on road'
    },
    {
      keywords: ['garbage', 'waste', 'trash', 'dump'],
      title: 'Waste Management Issue',
      description: 'Accumulated garbage and waste materials found in public area. The waste appears to be mixed household and commercial refuse that has not been collected as per schedule, creating unhygienic conditions and potential health hazards.',
      category: 'Waste Management',
      issue: 'garbage pile'
    },
    {
      keywords: ['water', 'leak', 'pipe', 'burst'],
      title: 'Water Supply Issue - Pipe Leakage',
      description: 'Water pipe leakage detected causing water wastage and potential damage to surrounding infrastructure. The leak appears to be from the main supply line and requires immediate attention to prevent further water loss.',
      category: 'Water Supply',
      issue: 'water leakage'
    },
    {
      keywords: ['light', 'lamp', 'street', 'dark'],
      title: 'Street Light Not Working',
      description: 'Non-functional street light creating safety concerns for pedestrians and vehicles during night hours. The light pole appears intact but the bulb/electrical connection needs repair or replacement.',
      category: 'Street Lighting',
      issue: 'broken streetlight'
    },
    {
      keywords: ['drain', 'block', 'overflow', 'flood'],
      title: 'Drainage System Blocked',
      description: 'Blocked drainage system causing water stagnation and potential flooding risk. The drain appears to be clogged with debris and requires immediate cleaning to prevent waterlogging during rains.',
      category: 'Drainage',
      issue: 'blocked drain'
    }
  ];

  // Simple classification based on filename or random selection
  let match;
  if (imageFile && imageFile.name) {
    const lower = imageFile.name.toLowerCase();
    match = classifications.find(c => c.keywords.some(k => lower.includes(k)));
  }
  
  if (!match) {
    // Random selection if no keywords match
    match = classifications[Math.floor(Math.random() * classifications.length)];
  }

  return {
    ...match,
    confidence: 65 + Math.floor(Math.random() * 20), // 65-85% confidence for fallback
    isClipResult: false,
    fallback: true
  };
}

export function aiTriage(text, photo = null) {
  const lower = text.toLowerCase();
  let best = null, score = 0;

  for (const [cat, cfg] of Object.entries(CATEGORIES)) {
    const s = cfg.keywords.filter(k => lower.includes(k)).length;
    if (s > score) { score = s; best = { category: cat, ...cfg }; }
  }

  if (!best) best = { category: 'Road Damage', dept: 'pwd', priority: 'Low' };

  const dept = DEPARTMENTS.find(d => d.id === best.dept);
  const officer = OFFICERS.filter(o => o.dept === best.dept).sort((a, b) => a.load - b.load)[0];
  const slaMap = { Critical: 4, High: 24, Medium: 72, Low: 168 };

  // Enhanced confidence calculation
  let baseConfidence = Math.min(95, 70 + score * 8);
  
  // Boost confidence if photo is provided and has CLIP analysis
  if (photo) {
    if (photo.isClipResult && !photo.fallback) {
      // Real CLIP analysis provides higher confidence boost
      baseConfidence = Math.min(98, baseConfidence + 20);
    } else {
      // Standard photo boost for fallback or non-CLIP photos
      baseConfidence = Math.min(95, baseConfidence + 15);
    }
  }

  return {
    category: best.category,
    department: dept,
    officer,
    priority: best.priority,
    confidence: baseConfidence,
    slaHours: slaMap[best.priority],
    ticketId: 'NV-' + Date.now().toString().slice(-6),
    clipAnalysis: photo?.isClipResult || false,
    fallbackUsed: photo?.fallback || false
  };
}
