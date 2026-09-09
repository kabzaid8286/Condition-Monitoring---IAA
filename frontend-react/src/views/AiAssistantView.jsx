import React, { useState, useRef, useEffect } from 'react';
import { Bot, User } from 'lucide-react';
import { AI_ANSWERS } from '../data/mockData';

export default function AiAssistantView() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your AI Diagnostics Assistant. How can I help you analyse the condition of your assets today?' }
  ]);
  const [input, setInput] = useState('');
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text, answerKey = null) => {
    const userText = text || input;
    if (!userText.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setInput('');

    // Simulate AI thinking and response
    setTimeout(() => {
      let aiText = "I'm sorry, I couldn't process that specific query right now.";
      if (answerKey && AI_ANSWERS[answerKey]) {
        aiText = AI_ANSWERS[answerKey];
      } else {
        const lowerInput = userText.toLowerCase();
        if (lowerInput.includes('health') || lowerInput.includes('status')) aiText = AI_ANSWERS['health'];
        else if (lowerInput.includes('anomaly') || lowerInput.includes('spike')) aiText = AI_ANSWERS['anomaly'];
        else if (lowerInput.includes('rul') || lowerInput.includes('life')) aiText = AI_ANSWERS['rul'];
        else if (lowerInput.includes('maintain') || lowerInput.includes('maintenance')) aiText = AI_ANSWERS['maintenance'];
        else if (lowerInput.includes('compare')) aiText = AI_ANSWERS['compare'];
      }
      setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);
    }, 800);
  };

  return (
    <>
      <div className="page-title">💬 AI Diagnostic Assistant</div>
      <div className="page-title-sub">Ask questions about machine health, alerts, and sensor readings</div>

      <div className="card chat-wrap" style={{height: "400px", marginTop: "20px", display: "flex", flexDirection: "column"}}>
          <div className="chat-history" style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.role === 'user' ? 'user-msg' : 'ai-msg'}`} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ background: msg.role === 'user' ? '#1e293b' : '#3b82f6', padding: '0.5rem', borderRadius: '50%', height: 'fit-content' }}>
                  {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                </div>
                <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '0.5rem', flex: 1, whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          <div className="chat-controls p-4 border-t border-slate-700">
            <div className="quick-prompts flex gap-2 mb-4 overflow-x-auto pb-2">
              <button className="btn btn-secondary text-sm whitespace-nowrap" onClick={() => handleSend('Summarise overall health of Test Rig A', 'health')}>Summarise Health</button>
              <button className="btn btn-secondary text-sm whitespace-nowrap" onClick={() => handleSend('Explain the recent vibration anomaly', 'anomaly')}>Explain Anomaly</button>
              <button className="btn btn-secondary text-sm whitespace-nowrap" onClick={() => handleSend('Estimate Remaining Useful Life (RUL)', 'rul')}>Estimate RUL</button>
              <button className="btn btn-secondary text-sm whitespace-nowrap" onClick={() => handleSend('Recommend maintenance actions', 'maintenance')}>Maintenance Plan</button>
            </div>
            
            <div className="chat-input-area flex gap-2">
              <input 
                type="text" 
                className="chat-input" 
                placeholder="Ask about anomalies, machine health, or maintenance..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button className="btn btn-primary" onClick={() => handleSend()}>Send</button>
            </div>
          </div>
      </div>
    </>
  );
}
