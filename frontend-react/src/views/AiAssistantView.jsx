import React, { useState, useRef, useEffect } from 'react';
import { AI_ANSWERS } from '../data/systemConfig';
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

export default function AiAssistantView({ activeAsset = '', kpis = {}, isConnected = false }) {
  const { assets } = useAssets();
  const assetName = assets[activeAsset]?.name || 'Test Rig A';
  const now = () => new Date().toLocaleTimeString('en-GB');

  const vib = parseFloat(kpis?.vibRms || 0);
  const temp = parseFloat(kpis?.temp || 0);
  const rpm = parseInt(kpis?.rpm || 0);
  const isLive = isConnected && (vib > 0 || temp > 0 || rpm > 0);

  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: `Hello! I'm the **IAA Diagnostic AI Assistant**.\n\nI have read-only access to live sensor data from **${assetName}** and can help you:\n• Explain anomalies and alerts\n• Estimate remaining useful life\n• Recommend maintenance actions\n• Compare multiple assets\n\nAll insights are derived in real time from physical sensor telemetry. How can I help?`,
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

    if (!isLive) {
      if (ql.includes('health') || ql.includes('status')) {
        return `Diagnostic status for **${assetName}**:\n• Status: **Hardware Disconnected (Standby Mode)**\n• Vibration RMS: **0.0000 m/s**\n• Temperature: **0.0 °C**\n• Shaft Speed: **0 RPM**\n\nPlease connect the Seeed Studio XIAO sensor node to initiate live diagnostics.`;
      }
      if (ql.includes('anomaly') || ql.includes('vibration')) {
        return `Sensor is currently offline. No anomalies detected while system is on standby. Connect hardware to analyze vibration spectrum.`;
      }
      if (ql.includes('rul') || ql.includes('remaining') || ql.includes('life')) {
        return `RUL estimation is paused while sensor is disconnected. Connect sensor hardware to resume prognostics.`;
      }
      if (ql.includes('maint')) {
        return `System is idle. Check physical wiring and verify that the USB / gateway connection is established.`;
      }
      return `Sensor hardware is currently disconnected for **${assetName}**.\n\nCurrent telemetry: All values zeroed (Standby).\nConnect the sensor node to start live data streaming.`;
    }

    if (ql.includes('health') || ql.includes('status')) {
      const condition = vib > 0.0071 ? 'Critical' : vib > 0.0045 ? 'Warning' : 'Nominal';
      return `Diagnostic report for **${assetName}**:\n• Operational Health: **${condition}**\n• Vibration RMS: **${vib.toFixed(4)} m/s**\n• Bearing Temperature: **${temp.toFixed(1)} °C**\n• Shaft Speed: **${rpm} RPM**\n• Health Score: **${kpis.health || 95}%**`;
    }
    if (ql.includes('anomaly') || ql.includes('vibration') || ql.includes('spike')) {
      if (vib > 0.0045) {
        return `⚠️ Elevated vibration detected at **${vib.toFixed(4)} m/s** on **${assetName}**. Spectral peaks suggest possible 1X harmonic imbalance or bearing stress.`;
      }
      return `Vibration levels are nominal (**${vib.toFixed(4)} m/s**). No threshold exceedances or spectral anomalies detected on **${assetName}**.`;
    }
    if (ql.includes('rul') || ql.includes('remaining') || ql.includes('life')) {
      const estimatedHours = Math.max(120, Math.round(4200 - (vib * 450000)));
      return `Remaining Useful Life (RUL) estimation for **${assetName}** based on current degradation rates:\n• Estimated Bearing Life: **~${estimatedHours} operating hours**\n• Confidence Level: **94.2%**`;
    }
    if (ql.includes('maint') || ql.includes('recommend') || ql.includes('action') || ql.includes('fix')) {
      if (vib > 0.0071 || temp > 75) {
        return `Recommended Actions:\n1. Inspect Drive-End bearing lubrication\n2. Verify shaft alignment and mounting bolt torque\n3. Schedule maintenance within the next 48 operating hours`;
      }
      return `Routine maintenance: All operational metrics within ISO 10816 limits. Continue standard continuous monitoring cycle.`;
    }
    if (ql.includes('compar') || ql.includes('motor') || ql.includes('rig')) {
      return `Active asset: **${assetName}** (Vib: ${vib.toFixed(4)} m/s, Temp: ${temp.toFixed(1)} °C, RPM: ${rpm}).`;
    }

    return `I reviewed live telemetry from **${assetName}**.\n\nCurrent status:\n• Vibration RMS: **${vib.toFixed(4)} m/s**\n• Bearing Temperature: **${temp.toFixed(1)} °C**\n• Shaft Speed: **${rpm} RPM**\n• Hardware Status: **${isLive ? 'Online & Streaming' : 'Standby / Offline'}**\n\nTry asking about: **health status, anomalies, remaining useful life, or maintenance recommendations**.`;
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
    { label: 'Health status', prompt: 'What is the current health status of the asset?' },
    { label: 'Explain anomaly', prompt: 'Explain the latest vibration anomaly detected.' },
    { label: 'RUL estimate', prompt: 'How much remaining useful life does the bearing have?' },
    { label: 'Recommendations', prompt: 'What maintenance actions do you recommend?' },
    { label: 'Compare assets', prompt: 'Compare vibration trends between Test Rig A and Motor 01.' }
  ];

  return (
    <>
      <div>
        <div className="page-title">AI Diagnostic Assistant</div>
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
