import { DEPARTMENTS, OFFICERS, CATEGORIES } from './constants';

// Simulate AI image classification based on filename/context
export function aiImageClassification(filename) {
  const classifications = [
    {
      keywords: ['pothole', 'road', 'street', 'crack'],
      title: 'Road Damage - Pothole Detected',
      description: 'Large pothole observed on the road surface causing inconvenience to vehicles and pedestrians. The damaged area appears to be approximately 2-3 feet in diameter and poses a safety hazard, especially during monsoon season.'
    },
    {
      keywords: ['garbage', 'waste', 'trash', 'dump'],
      title: 'Waste Management Issue',
      description: 'Accumulated garbage and waste materials found in public area. The waste appears to be mixed household and commercial refuse that has not been collected as per schedule, creating unhygienic conditions and potential health hazards.'
    },
    {
      keywords: ['water', 'leak', 'pipe', 'burst'],
      title: 'Water Supply Issue - Pipe Leakage',
      description: 'Water pipe leakage detected causing water wastage and potential damage to surrounding infrastructure. The leak appears to be from the main supply line and requires immediate attention to prevent further water loss.'
    },
    {
      keywords: ['light', 'lamp', 'street', 'dark'],
      title: 'Street Light Not Working',
      description: 'Non-functional street light creating safety concerns for pedestrians and vehicles during night hours. The light pole appears intact but the bulb/electrical connection needs repair or replacement.'
    },
    {
      keywords: ['drain', 'block', 'overflow', 'flood'],
      title: 'Drainage System Blocked',
      description: 'Blocked drainage system causing water stagnation and potential flooding risk. The drain appears to be clogged with debris and requires immediate cleaning to prevent waterlogging during rains.'
    }
  ];

  // Simple classification based on filename or random selection
  const lower = filename.toLowerCase();
  let match = classifications.find(c => c.keywords.some(k => lower.includes(k)));
  
  if (!match) {
    // Random selection if no keywords match
    match = classifications[Math.floor(Math.random() * classifications.length)];
  }

  return match;
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

  // Boost confidence if photo is provided
  const baseConfidence = Math.min(95, 70 + score * 8);
  const confidence = photo ? Math.min(98, baseConfidence + 15) : baseConfidence;

  return {
    category: best.category,
    department: dept,
    officer,
    priority: best.priority,
    confidence,
    slaHours: slaMap[best.priority],
    ticketId: 'NV-' + Date.now().toString().slice(-6),
  };
}
