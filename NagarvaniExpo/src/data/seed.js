export const SEED_COMPLAINTS = [
  {
    id: 'NV-001',
    ticketId: 'NV-001',
    name: 'Priya Sharma',
    phone: '9876543210',
    location: 'MG Road, Sector 14',
    ward: 'Ward 42',
    title: 'Large pothole on MG Road causing accidents',
    description: 'There is a massive pothole near the bus stop on MG Road that has been causing accidents. Two-wheelers are particularly affected. The pothole is about 3 feet wide and 1 foot deep.',
    category: 'Road Infrastructure',
    dept: 'pwd_roads',
    priority: 'High',
    status: 'In Progress',
    officer: 'off_001',
    slaHours: 48,
    confidence: 92,
    createdAt: Date.now() - 24 * 3600000,
    updatedAt: Date.now() - 2 * 3600000,
    updates: [
      { time: Date.now() - 24 * 3600000, msg: 'AI triage: "Road Infrastructure" — 92% confidence', by: 'NagarVani AI' },
      { time: Date.now() - 23 * 3600000, msg: 'Auto-routed to PWD Roads. Officer Rajesh Kumar assigned. SLA: 48hrs', by: 'NagarVani AI' },
      { time: Date.now() - 2 * 3600000, msg: 'Site inspection completed. Materials ordered.', by: 'Rajesh Kumar' },
    ]
  },
  {
    id: 'NV-002',
    ticketId: 'NV-002',
    name: 'Amit Patel',
    phone: '9876543211',
    location: 'Green Park Colony',
    ward: 'Ward 15',
    title: 'Street light not working for 2 weeks',
    description: 'The street light on the main road of Green Park Colony has not been working for the past 2 weeks. This is causing safety issues for residents, especially women and elderly people walking at night.',
    category: 'Street Lighting',
    dept: 'electricity',
    priority: 'Medium',
    status: 'Open',
    officer: 'off_002',
    slaHours: 72,
    confidence: 88,
    createdAt: Date.now() - 12 * 3600000,
    updatedAt: Date.now() - 12 * 3600000,
    updates: [
      { time: Date.now() - 12 * 3600000, msg: 'AI triage: "Street Lighting" — 88% confidence', by: 'NagarVani AI' },
      { time: Date.now() - 12 * 3600000, msg: 'Auto-routed to Electricity Dept. Officer Sunita Devi assigned. SLA: 72hrs', by: 'NagarVani AI' },
    ]
  }
];

export const DEPARTMENTS = [
  { id: 'pwd_roads', name: 'PWD Roads', icon: '🛣️', color: '#EF4444' },
  { id: 'sanitation', name: 'Sanitation', icon: '🗑️', color: '#22C55E' },
  { id: 'water', name: 'Water Supply', icon: '💧', color: '#3B82F6' },
  { id: 'electricity', name: 'Electricity', icon: '⚡', color: '#F59E0B' },
  { id: 'health', name: 'Health', icon: '🏥', color: '#EC4899' },
  { id: 'education', name: 'Education', icon: '🎓', color: '#8B5CF6' },
];

export const SAMPLE_COMPLAINTS = [
  { title: 'Broken streetlight causing safety issues', description: 'The streetlight on Main Road has been broken for 3 days, making it unsafe for pedestrians at night.' },
  { title: 'Garbage not collected for 5 days', description: 'Garbage collection has been irregular in our area. The bins are overflowing and creating hygiene issues.' },
  { title: 'Water supply disruption since morning', description: 'No water supply in our locality since 6 AM. Residents are facing severe inconvenience.' }
];