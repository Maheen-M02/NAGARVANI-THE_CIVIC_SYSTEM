export const DEPARTMENTS = [
  { id: 'pwd',    name: 'PWD Roads',     color: '#F97316', icon: '🛣️' },
  { id: 'water',  name: 'Water Board',   color: '#0EA5E9', icon: '💧' },
  { id: 'elec',   name: 'Electricity',   color: '#EAB308', icon: '⚡' },
  { id: 'sanit',  name: 'Sanitation',    color: '#22C55E', icon: '🗑️' },
  { id: 'health', name: 'Healthcare',    color: '#EC4899', icon: '🏥' },
  { id: 'police', name: 'Public Safety', color: '#8B5CF6', icon: '🚔' },
];

export const OFFICERS = [
  { id: 'o1', name: 'Rajesh Kumar', dept: 'pwd',    avatar: 'RK', load: 8,  rating: 4.7 },
  { id: 'o2', name: 'Priya Sharma', dept: 'water',  avatar: 'PS', load: 5,  rating: 4.9 },
  { id: 'o3', name: 'Amit Singh',   dept: 'elec',   avatar: 'AS', load: 11, rating: 4.3 },
  { id: 'o4', name: 'Meera Nair',   dept: 'sanit',  avatar: 'MN', load: 6,  rating: 4.8 },
  { id: 'o5', name: 'Vikram Patel', dept: 'health', avatar: 'VP', load: 4,  rating: 4.6 },
  { id: 'o6', name: 'Deepa Reddy', dept: 'police', avatar: 'DR', load: 9,  rating: 4.5 },
];

export const STATUS_COLORS = {
  'Open':        '#F97316',
  'In Progress': '#0EA5E9',
  'Resolved':    '#22C55E',
  'Escalated':   '#EF4444',
  'Closed':      '#6B7280',
};

export const PRIORITY_COLORS = {
  'Critical': '#EF4444',
  'High':     '#F97316',
  'Medium':   '#EAB308',
  'Low':      '#22C55E',
};

export const CATEGORIES = {
  'Road Damage':          { dept: 'pwd',    keywords: ['road','pothole','crack','footpath','bridge','highway','street','repair'],              priority: 'Medium' },
  'Water Supply':         { dept: 'water',  keywords: ['water','pipe','leakage','supply','tap','sewage','drain','flood'],                      priority: 'High' },
  'Power Outage':         { dept: 'elec',   keywords: ['electricity','power','light','wire','transformer','voltage','meter','bill'],            priority: 'High' },
  'Garbage & Sanitation': { dept: 'sanit',  keywords: ['garbage','waste','dump','cleaning','sanitation','dirty','smell','mosquito'],            priority: 'Medium' },
  'Health & Hospitals':   { dept: 'health', keywords: ['hospital','doctor','medicine','ambulance','health','clinic','nurse','emergency'],       priority: 'Critical' },
  'Public Safety':        { dept: 'police', keywords: ['crime','theft','safety','accident','violence','stray','illegal','danger'],              priority: 'Critical' },
};

export const AI_SUGGESTIONS = {
  'Road Damage':          ['Schedule road repair crew for tomorrow morning', 'Order cold-mix asphalt from depot', 'Put up warning barricades today'],
  'Water Supply':         ['Check main valve at sector junction box', 'Deploy emergency water tanker immediately', 'Notify residents via WhatsApp broadcast'],
  'Power Outage':         ['Inspect transformer at Zone-B substation', 'Check for fallen cables in the area', 'Log with electrical safety board'],
  'Garbage & Sanitation': ['Reschedule garbage truck for this area today', 'Arrange special sanitation drive this weekend', 'Issue notice to area garbage contractor'],
  'Health & Hospitals':   ['Contact CMO for emergency staff deployment', 'Activate overflow protocol for OPD', 'Arrange ambulance standby'],
  'Public Safety':        ['Dispatch beat constable immediately', 'Issue legal notice to property owner', 'Coordinate with municipal legal cell'],
};

export const SAMPLE_COMPLAINTS = [
  { title: 'Deep pothole near school causing accidents',  description: 'There is a large pothole on MG Road near City School. Three bikes fell yesterday. Very dangerous for children and elderly.' },
  { title: 'No water supply for 2 days in our area',     description: 'Our entire street has had no water supply for 2 days. Water board not responding. We have elderly people at home.' },
  { title: 'Street lights not working for a week',       description: 'All street lights on Kumar Nagar Lane 4 have been off for 5 days. Very unsafe at night for women walking home.' },
  { title: 'Garbage pile creating health hazard',        description: 'Garbage not collected for a week near Sarojini Market. Smell unbearable. Stray dogs visible. Health risk.' },
];

export const WEEKLY_TREND = [
  { day: 'Mon', open: 42, resolved: 38, escalated: 4 },
  { day: 'Tue', open: 56, resolved: 51, escalated: 6 },
  { day: 'Wed', open: 38, resolved: 44, escalated: 3 },
  { day: 'Thu', open: 67, resolved: 58, escalated: 8 },
  { day: 'Fri', open: 71, resolved: 65, escalated: 5 },
  { day: 'Sat', open: 45, resolved: 42, escalated: 3 },
  { day: 'Sun', open: 29, resolved: 31, escalated: 2 },
];

export const DEPT_LOAD = [
  { name: 'PWD Roads',     complaints: 312, resolved: 267 },
  { name: 'Water Board',   complaints: 240, resolved: 198 },
  { name: 'Electricity',   complaints: 196, resolved: 170 },
  { name: 'Sanitation',    complaints: 270, resolved: 245 },
  { name: 'Healthcare',    complaints: 130, resolved: 118 },
  { name: 'Public Safety', complaints: 88,  resolved: 72  },
];

export const STATUS_DIST = [
  { name: 'Resolved',    value: 1070, color: '#22C55E' },
  { name: 'In Progress', value: 380,  color: '#0EA5E9' },
  { name: 'Open',        value: 290,  color: '#F97316' },
  { name: 'Escalated',   value: 96,   color: '#EF4444' },
];

export const CURRENT_OFFICER = {
  id: 'o1', name: 'Rajesh Kumar', dept: 'pwd', avatar: 'RK', load: 8, rating: 4.7,
};
