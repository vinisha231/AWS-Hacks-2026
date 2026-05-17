// src/components/EstimateChat.jsx
import { useState } from 'react';

export function EstimateChat({ onNegotiateUpdate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const sendMessage = (text) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Simple mock response
    setTimeout(() => {
      const botMsg = { role: 'assistant', content: `You said: "${text}". This is a demo. Real AI will answer soon.` };
      setMessages(prev => [...prev, botMsg]);
    }, 500);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full p-4 shadow-lg z-50 transition-all"
      >
        💬
      </button>

      {/* Chat drawer */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 flex flex-col border-l border-neutral-200">
          <div className="flex items-center justify-between p-4 border-b bg-emerald-50">
            <h3 className="font-bold text-emerald-800">Rta AI</h3>
            <button onClick={() => setIsOpen(false)} className="text-neutral-500">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-neutral-100'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && sendMessage(input)}
                placeholder="Ask about benefits..."
                className="flex-1 border rounded-xl px-4 py-2"
              />
              <button onClick={() => sendMessage(input)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl">Send</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}