// Vapi Voice AI Service
// Handles both real Vapi calls and demo simulation

const VAPI_PUBLIC_KEY = process.env.REACT_APP_VAPI_PUBLIC_KEY;
const VAPI_ASSISTANT_ID = process.env.REACT_APP_VAPI_ASSISTANT_ID;
const VAPI_PHONE_NUMBER = process.env.REACT_APP_VAPI_PHONE_NUMBER || '+1-800-NAGARVANI';

// ── Vapi Assistant Configuration ─────────────────────────────
// Use this JSON to configure your assistant in Vapi dashboard
export const VAPI_ASSISTANT_CONFIG = {
  name: 'NagarVani Voice Assistant',
  firstMessage: 'Namaste! Welcome to NagarVani, your civic complaint service. I am here to help you register a complaint. Please tell me, what issue are you facing?',
  model: {
    provider: 'openai',
    model: 'gpt-4o-mini',
    systemPrompt: `You are NagarVani, an AI assistant for India's civic complaint management system. 
Your job is to help citizens register complaints about civic issues like potholes, garbage, water leakage, broken streetlights, etc.

Follow this exact flow:
1. Ask: "What is the issue you want to report?"
2. Ask: "Where is this issue located? Please provide the street name, area, or landmark."
3. Ask: "How long has this issue been present?"
4. Summarize: "Let me confirm - you are reporting [issue] at [location], which has been there for [duration]. Is that correct?"
5. If confirmed: Call the create_complaint tool immediately.
6. If not confirmed: Ask them to correct the details.

Rules:
- Be concise and clear
- Support Hindi and English mixed speech (Hinglish)
- If user says "haan", "yes", "theek hai", "correct" - treat as confirmation
- If user says "nahi", "no", "galat" - ask them to correct
- Always be polite and professional
- After tool call succeeds, read out the ticket ID clearly`,
  },
  voice: {
    provider: 'playht',
    voiceId: 'jennifer', // Clear English/Hindi voice
  },
  tools: [
    {
      type: 'function',
      function: {
        name: 'create_complaint',
        description: 'Register a civic complaint after user confirmation. Call this ONLY after user confirms the details.',
        parameters: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Short title of the complaint (e.g., "Deep pothole on MG Road")'
            },
            description: {
              type: 'string',
              description: 'Detailed description of the issue'
            },
            location: {
              type: 'string',
              description: 'Location of the issue - street, area, landmark'
            },
            duration: {
              type: 'string',
              description: 'How long the issue has been present (e.g., "2 weeks", "3 days")'
            }
          },
          required: ['title', 'location']
        }
      },
      server: {
        url: `${typeof window !== 'undefined' ? window.location.origin : 'https://your-app.vercel.app'}/api/voice-complaint`
      }
    }
  ],
  endCallMessage: 'Thank you for using NagarVani. Your complaint has been registered. Have a good day!',
  endCallPhrases: ['goodbye', 'bye', 'thank you', 'shukriya', 'dhanyawad'],
};

// ── Demo Simulation ───────────────────────────────────────────
const DEMO_FLOW = [
  { role: 'assistant', text: 'Namaste! Welcome to NagarVani. What civic issue would you like to report today?' },
  { role: 'user', text: 'There is a big pothole on MG Road near the bus stop.' },
  { role: 'assistant', text: 'I understand. There is a pothole on MG Road near the bus stop. How long has this issue been there?' },
  { role: 'user', text: 'About 2 weeks now.' },
  { role: 'assistant', text: 'Let me confirm — you are reporting a pothole on MG Road near the bus stop, which has been there for 2 weeks. Is that correct?' },
  { role: 'user', text: 'Yes, that is correct.' },
  { role: 'assistant', text: 'Registering your complaint now...' },
  { role: 'system', text: 'Calling create_complaint tool...' },
  { role: 'assistant', text: 'Your complaint has been successfully registered! Your ticket ID is NV-847291. The Public Works Department has been notified and will resolve it within 24 hours. Thank you!' },
];

class VapiService {
  constructor() {
    this.vapi = null;
    this.isConnected = false;
    this.demoMode = !VAPI_PUBLIC_KEY;
  }

  async loadVapi() {
    if (this.vapi) return this.vapi;
    try {
      const { default: Vapi } = await import('@vapi-ai/web');
      this.vapi = new Vapi(VAPI_PUBLIC_KEY);
      this.isConnected = true;
      return this.vapi;
    } catch (err) {
      console.warn('Vapi SDK not available, using demo mode:', err.message);
      this.demoMode = true;
      return null;
    }
  }

  async startCall(onEvent) {
    if (this.demoMode) {
      return this.startDemoCall(onEvent);
    }

    try {
      const vapi = await this.loadVapi();
      if (!vapi) return this.startDemoCall(onEvent);

      vapi.on('call-start', () => onEvent({ type: 'call-start' }));
      vapi.on('call-end', () => onEvent({ type: 'call-end' }));
      vapi.on('speech-start', () => onEvent({ type: 'speech-start' }));
      vapi.on('speech-end', () => onEvent({ type: 'speech-end' }));
      vapi.on('message', (msg) => onEvent({ type: 'message', data: msg }));
      vapi.on('error', (err) => onEvent({ type: 'error', error: err }));

      await vapi.start(VAPI_ASSISTANT_ID || VAPI_ASSISTANT_CONFIG);
      return { success: true, mode: 'live' };
    } catch (err) {
      console.error('Vapi start error:', err);
      return this.startDemoCall(onEvent);
    }
  }

  startDemoCall(onEvent) {
    onEvent({ type: 'call-start', mode: 'demo' });
    let i = 0;
    const interval = setInterval(() => {
      if (i >= DEMO_FLOW.length) {
        clearInterval(interval);
        onEvent({ type: 'call-end' });
        return;
      }
      onEvent({ type: 'message', data: DEMO_FLOW[i] });
      i++;
    }, 2000);

    return { success: true, mode: 'demo', stop: () => clearInterval(interval) };
  }

  async stopCall() {
    if (this.vapi) {
      try { this.vapi.stop(); } catch (e) {}
    }
  }

  getPhoneNumber() {
    return VAPI_PHONE_NUMBER;
  }

  isDemoMode() {
    return this.demoMode;
  }
}

export const vapiService = new VapiService();
export { VAPI_PHONE_NUMBER };
