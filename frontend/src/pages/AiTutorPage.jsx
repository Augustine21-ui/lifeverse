import { useState } from 'react';
import { Bot, Send } from 'lucide-react';

export default function AiTutorPage() {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    const userMessage = { role: 'user', content: message };
    setConversation(prev => [...prev, userMessage]);
    setMessage('');
    setLoading(true);
    // Simulate AI response – replace with actual API call later
    setTimeout(() => {
      const aiResponse = { role: 'ai', content: "I'm your AI learning assistant. This feature is coming soon!" };
      setConversation(prev => [...prev, aiResponse]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Bot size={32} className="text-brand-400" />
        <h1 className="text-3xl font-bold">AI Tutor</h1>
      </div>
      <div className="card p-4 h-[500px] flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {conversation.length === 0 && (
            <div className="text-center text-white/40 mt-20">
              Ask me anything about your studies, challenges, or career path.
            </div>
          )}
          {conversation.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-xl ${msg.role === 'user' ? 'bg-brand-500 text-white' : 'bg-white/10 text-white'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/10 p-3 rounded-xl">Thinking...</div>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 input"
            placeholder="Ask a question..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <button onClick={handleSend} disabled={loading} className="btn-primary">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}