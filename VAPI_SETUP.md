# Vapi Voice AI Setup Guide

## What's Built

- `api/voice-complaint.js` — Vercel API route that receives Vapi tool calls and stores complaints in Supabase
- `src/services/vapiService.js` — Vapi SDK wrapper with demo mode fallback
- `src/components/VoiceAssistant.js` — UI component with call button and live transcript

## Step 1: Create Vapi Account

1. Go to https://vapi.ai
2. Sign up / log in
3. Go to Dashboard → API Keys
4. Copy your **Public Key**

## Step 2: Create the Assistant

1. In Vapi Dashboard → Assistants → Create New
2. Set name: `NagarVani Voice Assistant`
3. Set first message:
   ```
   Namaste! Welcome to NagarVani. What civic issue would you like to report today?
   ```
4. Set system prompt (copy from `src/services/vapiService.js` → `VAPI_ASSISTANT_CONFIG.model.systemPrompt`)
5. Set voice: PlayHT → Jennifer (or any clear voice)

## Step 3: Add the Tool

In your assistant → Tools → Add Tool:

```json
{
  "type": "function",
  "function": {
    "name": "create_complaint",
    "description": "Register a civic complaint after user confirmation",
    "parameters": {
      "type": "object",
      "properties": {
        "title": { "type": "string", "description": "Short title of the complaint" },
        "description": { "type": "string", "description": "Detailed description" },
        "location": { "type": "string", "description": "Location of the issue" },
        "duration": { "type": "string", "description": "How long the issue has been present" }
      },
      "required": ["title", "location"]
    }
  },
  "server": {
    "url": "https://YOUR-VERCEL-APP.vercel.app/api/voice-complaint"
  }
}
```

Replace `YOUR-VERCEL-APP` with your actual Vercel URL.

## Step 4: Get Phone Number (Optional)

1. Vapi Dashboard → Phone Numbers → Buy Number
2. Assign it to your assistant
3. Copy the number

## Step 5: Add Environment Variables

In your `.env` file:
```
REACT_APP_VAPI_PUBLIC_KEY=your_public_key
REACT_APP_VAPI_ASSISTANT_ID=your_assistant_id
REACT_APP_VAPI_PHONE_NUMBER=+1-xxx-xxx-xxxx
```

In Vercel Dashboard → Settings → Environment Variables:
```
REACT_APP_VAPI_PUBLIC_KEY=your_public_key
REACT_APP_VAPI_ASSISTANT_ID=your_assistant_id
REACT_APP_VAPI_PHONE_NUMBER=+1-xxx-xxx-xxxx
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Get `SUPABASE_SERVICE_ROLE_KEY` from:
Supabase Dashboard → Settings → API → `service_role` (secret key)

## Step 6: Install Vapi SDK

```bash
npm install @vapi-ai/web
```

Then push and redeploy.

## How It Works

### Without Vapi configured (Demo Mode):
- Click "Call to Report Issue"
- Simulated conversation plays automatically
- Shows how the flow works

### With Vapi configured (Live Mode):
- Click "Call to Report Issue"
- Browser microphone activates
- Real AI voice conversation
- On confirmation → calls `/api/voice-complaint`
- Complaint stored in Supabase
- Ticket ID read back to user

### Phone Call Flow:
- Citizen calls the Vapi phone number
- AI assistant answers
- Collects issue, location, duration
- Confirms with citizen
- Calls `/api/voice-complaint` API
- Stores in Supabase
- Reads ticket ID to citizen

## API Endpoint

`POST /api/voice-complaint`

Request body (from Vapi tool call):
```json
{
  "message": {
    "toolCalls": [{
      "function": {
        "name": "create_complaint",
        "arguments": {
          "title": "Deep pothole on MG Road",
          "location": "MG Road near bus stop",
          "duration": "2 weeks"
        }
      }
    }]
  }
}
```

Response:
```json
{
  "message": "Your complaint has been registered. Your ticket ID is NV-847291. The Public Works Department will resolve it within 24 hours.",
  "ticket_id": "NV-847291",
  "category": "pothole",
  "priority": "high",
  "department": "Public Works Department",
  "stored": true
}
```

## Multilingual Support

The assistant handles:
- English: "yes", "no", "correct"
- Hindi: "haan", "nahi", "theek hai", "sahi hai"
- Hinglish: mixed English-Hindi

## Demo Mode

If `REACT_APP_VAPI_PUBLIC_KEY` is not set, the component automatically runs in demo mode showing a simulated conversation. This is useful for:
- Testing the UI
- Demos without Vapi account
- Development
