import { useState, useRef, useEffect } from 'react';
import { vapiService } from '../services/vapiService';

export default function VoiceAssistant({ onComplaintCreated }) {
  const [state, setState] = useState('idle'); // idle | calling | active | ended
  const [messages, setMessages] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const callRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (role, text) => {
    setMessages(prev => [...prev, {
      role, text,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    }]);
  };

  const handleEvent = (event) => {
    switch (event.type) {
      case 'call-start':
        setState('active');
        addMessage('system', event.mode === 'demo' ? '🎭 Demo mode — simulating voice call' : '📞 Call connected via browser');
        break;
      case 'call-end':
        setState('ended');
        setIsSpeaking(false);
        addMessage('system', '📞 Call ended');
        break;
      case 'speech-start':
        setIsSpeaking(true);
        break;
      case 'speech-end':
        setIsSpeaking(false);
        break;
      case 'message': {
        const msg = event.data;
        if (msg.role === 'assistant' || msg.role === 'user') {
          addMessage(msg.role, msg.text || msg.content || '');
        } else if (msg.role === 'system') {
          addMessage('system', msg.text);
        }
        // Extract ticket ID if complaint was registered
        if (msg.text?.includes('NV-') && msg.role === 'assistant') {
          const match = msg.text.match(/NV-\d+/);
          if (match && onComplaintCreated) {
            onComplaintCreated({ ticket_id: match[0] });
          }
        }
        break;
      }
      case 'error':
        addMessage('system', `⚠️ ${event.error?.message || 'Connection error'} — switching to demo mode`);
        // Don't end the call on error if demo mode kicks in
        if (!event.error?.message?.includes('demo')) {
          setState('ended');
        }
        break;
      default:
        break;
    }
  };

  const startCall = async () => {
    setState('calling');
    setMessages([]);
    addMessage('system', '🎙️ Requesting microphone access...');
    const result = await vapiService.startCall(handleEvent);
    if (result) callRef.current = result;
  };

  const endCall = async () => {
    await vapiService.stopCall();
    if (callRef.current?.stop) callRef.current.stop();
    setState('ended');
    addMessage('system', '📞 Call ended by user');
  };

  const reset = () => {
    setState('idle');
    setMessages([]);
    setIsSpeaking(false);
  };

  const roleStyle = (role) => {
    if (role === 'assistant') return { bg: '#1e3a8a', color: '#fff', align: 'flex-start' };
    if (role === 'user') return { bg: '#f1f5f9', color: '#1e2845', align: 'flex-end' };
    return { bg: 'transparent', color: '#94a3b8', align: 'center' };
  };

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif' }}>

      {/* ── IDLE ── */}
      {state === 'idle' && (
        <div>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#166534', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>🎙️</span>
            <span>Calls directly in your browser — no phone number needed. Just allow microphone access.</span>
          </div>

          <button onClick={startCall} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', padding: '14px 28px', background: 'linear-gradient(135deg, #16a34a, #15803d)', color: '#fff', border: 'none', borderRadius: 16, fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(22,163,74,0.4)' }}>
            <span style={{ fontSize: 22 }}>📞</span>
            Start Voice Call
          </button>

          <div style={{ marginTop: 10, fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
            Speak in English or Hindi • AI guides you step by step
          </div>

          {vapiService.isDemoMode() && (
            <div style={{ marginTop: 10, fontSize: 12, color: '#f59e0b', background: '#fef3c7', padding: '6px 14px', borderRadius: 8, textAlign: 'center' }}>
              🎭 Demo mode — add REACT_APP_VAPI_PUBLIC_KEY to enable live calls
            </div>
          )}
        </div>
      )}

      {/* ── CONNECTING ── */}
      {state === 'calling' && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #16a34a, #15803d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 12px', animation: 'pulse 1.5s ease infinite' }}>📞</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1e2845' }}>Connecting...</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Allow microphone when prompted</div>
        </div>
      )}

      {/* ── ACTIVE / ENDED ── */}
      {(state === 'active' || state === 'ended') && (
        <div>
          {/* Header bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: state === 'active' ? 'linear-gradient(135deg, #0D1B40, #1A3A8F)' : '#f1f5f9', borderRadius: '14px 14px 0 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: state === 'active' ? (isSpeaking ? '#22c55e' : 'rgba(255,255,255,0.15)') : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, transition: 'background 0.3s' }}>
                {state === 'active' ? '🎙️' : '📞'}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: state === 'active' ? '#fff' : '#1e2845' }}>
                  {state === 'active' ? 'NagarVani Voice Assistant' : 'Call Ended'}
                </div>
                <div style={{ fontSize: 11, color: state === 'active' ? 'rgba(255,255,255,0.6)' : '#94a3b8' }}>
                  {state === 'active' ? (isSpeaking ? '🔊 Speaking...' : '👂 Listening...') : 'Start a new call anytime'}
                </div>
              </div>
            </div>
            {state === 'active' ? (
              <button onClick={endCall} style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                End Call
              </button>
            ) : (
              <button onClick={reset} style={{ padding: '8px 16px', background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                New Call
              </button>
            )}
          </div>

          {/* Transcript */}
          <div style={{ background: '#f8fafc', borderRadius: '0 0 14px 14px', padding: '12px', maxHeight: 300, overflowY: 'auto', border: '1px solid #e2e8f0', borderTop: 'none' }}>
            {messages.map((msg, i) => {
              const s = roleStyle(msg.role);
              if (msg.role === 'system') {
                return (
                  <div key={i} style={{ textAlign: 'center', margin: '8px 0' }}>
                    <span style={{ fontSize: 11, color: '#94a3b8', background: '#f1f5f9', padding: '3px 10px', borderRadius: 999 }}>{msg.text}</span>
                  </div>
                );
              }
              return (
                <div key={i} style={{ display: 'flex', justifyContent: s.align, marginBottom: 10 }}>
                  <div style={{ maxWidth: '80%' }}>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 3, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                      {msg.role === 'assistant' ? '🤖 Assistant' : '👤 You'} · {msg.time}
                    </div>
                    <div style={{ background: s.bg, color: s.color, padding: '10px 14px', borderRadius: msg.role === 'assistant' ? '4px 14px 14px 14px' : '14px 4px 14px 14px', fontSize: 13, lineHeight: 1.5 }}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}
