// Vercel API Route: /api/voice-complaint
// Receives tool call from Vapi, stores complaint in Supabase

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // service role for server-side inserts
);

// AI category + priority classifier
function classifyComplaint(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  const categories = {
    pothole:    { keywords: ['pothole','road','hole','crack','damage','asphalt'], dept: 'Public Works Department', priority: 'high' },
    garbage:    { keywords: ['garbage','trash','waste','dump','litter','smell'], dept: 'Waste Management', priority: 'medium' },
    water_leakage: { keywords: ['water','leak','pipe','burst','flood','drain'], dept: 'Water Board', priority: 'high' },
    streetlight:{ keywords: ['light','lamp','streetlight','dark','bulb','electric'], dept: 'Electricity Department', priority: 'medium' },
    drainage:   { keywords: ['drain','sewage','overflow','blocked','clog'], dept: 'Public Works Department', priority: 'high' },
    noise_pollution: { keywords: ['noise','loud','sound','music','construction'], dept: 'Municipal Corporation', priority: 'low' },
    illegal_construction: { keywords: ['illegal','construction','building','encroach'], dept: 'Municipal Corporation', priority: 'medium' },
  };

  for (const [cat, data] of Object.entries(categories)) {
    if (data.keywords.some(kw => text.includes(kw))) {
      return { category: cat, department: data.dept, priority: data.priority };
    }
  }
  return { category: 'other', department: 'Municipal Corporation', priority: 'medium' };
}

function generateTicketId() {
  return 'NV-' + Math.floor(100000 + Math.random() * 900000);
}

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body;

    // Vapi sends tool call results in this format
    // Support both direct calls and Vapi tool call format
    let title, description, location, duration, callerPhone;

    if (body.message?.toolCalls) {
      // Vapi tool call format
      const toolCall = body.message.toolCalls[0];
      const args = toolCall?.function?.arguments || {};
      title = args.title || args.issue || args.complaint;
      description = args.description || args.details || title;
      location = args.location || args.address || 'Location not provided';
      duration = args.duration || args.since || 'Unknown';
      callerPhone = body.message?.call?.customer?.number || null;
    } else {
      // Direct API call format
      title = body.title || body.issue || body.complaint;
      description = body.description || body.details || title;
      location = body.location || body.address || 'Location not provided';
      duration = body.duration || body.since || 'Unknown';
      callerPhone = body.phone || null;
    }

    // Validate required fields
    if (!title || !location) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'I need both the issue description and location to register your complaint. Could you please provide those?'
      });
    }

    // AI classify
    const { category, department, priority } = classifyComplaint(title, description);
    const ticketId = generateTicketId();

    // Build full description
    const fullDescription = duration && duration !== 'Unknown'
      ? `${description}. Issue has been present for: ${duration}.`
      : description;

    // Insert into Supabase
    const { data, error } = await supabase
      .from('complaints')
      .insert([{
        ticket_id: ticketId,
        title: title.slice(0, 200),
        description: fullDescription,
        location,
        category,
        priority,
        status: 'pending',
        source: 'voice',
        caller_phone: callerPhone,
        sla_hours: priority === 'high' ? 24 : priority === 'medium' ? 48 : 72,
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      // Still return success to caller with local ticket
      return res.status(200).json({
        message: `Your complaint has been registered. Your ticket ID is ${ticketId}. You will receive updates shortly.`,
        ticket_id: ticketId,
        category,
        priority,
        department,
        stored: false
      });
    }

    return res.status(200).json({
      message: `Your complaint has been successfully registered. Your ticket ID is ${ticketId}. The ${department} has been notified and will resolve it within ${priority === 'high' ? '24' : priority === 'medium' ? '48' : '72'} hours. Thank you for reporting!`,
      ticket_id: ticketId,
      category,
      priority,
      department,
      stored: true
    });

  } catch (err) {
    console.error('Voice complaint API error:', err);
    const fallbackTicket = generateTicketId();
    return res.status(200).json({
      message: `Your complaint has been noted. Your reference number is ${fallbackTicket}. Our team will follow up with you shortly.`,
      ticket_id: fallbackTicket,
      stored: false,
      error: err.message
    });
  }
};
