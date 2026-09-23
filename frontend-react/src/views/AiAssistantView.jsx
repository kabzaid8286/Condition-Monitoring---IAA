import React, { useState, useRef, useEffect } from 'react';
import { AI_ANSWERS } from '../data/mockData';
import { useAssets } from '../contexts/AssetContext';

function formatMessageText(text) {
  // Check if text has markdown table
  if (text.includes('|') && text.includes('\n|')) {
    const lines = text.split('\n');
    const parts = [];
    let tableLines = [];
    let inTable = false;

    lines.forEach((line, idx) => {
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        inTable = true;
        tableLines.push(line.trim());
      } else {
        if (inTable && tableLines.length > 0) {
          parts.push({ type: 'table', lines: tableLines });
          tableLines = [];
          inTable = false;
        }
        if (line.trim()) {
          parts.push({ type: 'text', content: line });
        }
      }
    });

    if (inTable && tableLines.length > 0) {
      parts.push({ type: 'table', lines: tableLines });
    }

    return (
      <div>
        {parts.map((part, pIdx) => {
          if (part.type === 'table') {
            const rows = part.lines
              .filter(l => !l.includes('---'))
              .map(l => l.split('|').map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length));
            const headers = rows[0] || [];
            const bodyRows = rows.slice(1);

            return (
              <table key={pIdx} className="sensor-table" style={{ margin: '10px 0', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                <thead>
                  <tr>
                    {headers.map((h, hIdx) => (
                      <th key={hIdx}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bodyRows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className={cIdx > 0 ? 'mono' : ''}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          }

          // Format bold text and bullet points
          const lineText = part.content;
          const formatted = lineText
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

          return (
            <div
              key={pIdx}
              style={{ marginBottom: '6px' }}
              dangerouslySetInnerHTML={{ __html: formatted }}
            />
          );
        })}
      </div>
    );
  }

  // Regular formatted text
  const formatted = text
    .replace(/\n/g, '<br/>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  return <div dangerouslySetInnerHTML={{ __html: formatted }} />;
}

export default function AiAssistantView({ activeAsset = 'test-rig-a' }) {
  const { assets } = useAssets();
  const assetName = assets[activeAsset]?.name || 'Test Rig A';
  const now = () => new Date().toLocaleTimeString('en-GB');

  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: `👋 Hello! I'm the **IAA Diagnostic AI Assistant**.\n\nI have read-only access to live sensor data from **${assetName}** and can help you:\n• Explain anomalies and alerts\n• Estimate remaining useful life\n• Recommend maintenance actions\n• Compare multiple assets\n\nAll insights are cited from sensor readings and ML model outputs. How can I help?`,
      time: now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const getAIReply = (q) => {
    const ql = q.toLowerCase();
    if (ql.includes('health') || ql.includes('status')) return AI_ANSWERS.health;
    if (ql.includes('anomaly') || ql.includes('vibration') || ql.includes('spike')) return AI_ANSWERS.anomaly;
    if (ql.includes('rul') || ql.includes('remaining') || ql.includes('life')) return AI_ANSWERS.rul;
    if (ql.includes('maint') || ql.includes('recommend') || ql.includes('action') || ql.includes('fix')) return AI_ANSWERS.maintenance;
    if (ql.includes('compar') || ql.includes('motor') || ql.includes('rig')) return AI_ANSWERS.compare;

    return `I reviewed live telemetry from **${assetName}**.\n\nCurrent status:\n• Vibration RMS: **3.42 mm/s** (nominal)\n• Bearing Temperature: **62.1 °C**\n• Shaft Speed: **1,482 RPM**\n• Anomaly Score: **0.23** (Low risk)\n\nTry asking about: **health status, anomalies, remaining useful life, or maintenance recommendations**. 🤖`;
  };

  const handleSend = (textToSend) => {
    const text = (typeof textToSend === 'string' ? textToSend : input).trim();
    if (!text) return;

    const userTime = now();
    setMessages(prev => [...prev, { role: 'user', text, time: userTime }]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const aiReply = getAIReply(text);
      setMessages(prev => [...prev, { role: 'ai', text: aiReply, time: now() }]);
    }, 900 + Math.random() * 400);
  };

  const quickPrompts = [
    { label: '🏥 Health status', prompt: 'What is the current health status of the asset?' },
    { label: '〰️ Explain anomaly', prompt: 'Explain the latest vibration anomaly detected.' },
    { label: '⏳ RUL estimate', prompt: 'How much remaining useful life does the bearing have?' },
    { label: '🔧 Recommendations', prompt: 'What maintenance actions do you recommend?' },
    { label: '⚖️ Compare assets', prompt: 'Compare vibration trends between Test Rig A and Motor 01.' }
  ];

  return (
    <>
      <div>
        <div className="page-title">💬 AI Diagnostic Assistant</div>
        <div className="page-title-sub">Ask questions about machine health, alerts, and sensor readings</div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            className="time-btn"
            onClick={() => handleSend(p.prompt)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="card chat-wrap" style={{ marginTop: '16px', height: '520px' }}>
        <div className="chat-messages" id="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-msg ${msg.role === 'user' ? 'user' : ''}`}>
              <div className={`chat-avatar ${msg.role === 'user' ? 'user' : 'ai'}`}>
                {msg.role === 'user' ? 'OP' : 'AI'}
              </div>
              <div>
                <div className={`chat-bubble ${msg.role === 'user' ? 'user' : 'ai'}`}>
                  {formatMessageText(msg.text)}
                </div>
                <div className="chat-time">{msg.time}</div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="chat-msg">
              <div className="chat-avatar ai">AI</div>
              <div>
                <div className="chat-bubble ai">
                  <div className="typing-indicator">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        <div className="chat-input-row">
          <input
            className="chat-input"
            id="chat-input"
            type="text"
            placeholder="Ask about machine health, anomalies, or sensor readings…"
            autoComplete="off"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button className="chat-send-btn" id="chat-send-btn" onClick={() => handleSend()}>
            Send →
          </button>
        </div>
      </div>
    </>
  );
}
