// frontend/src/pages/AiTutorPage.jsx
import { useState, useEffect, useRef } from 'react';
import { Bot, Send, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';  // ✅ use the api service
import PageBackground from '../components/PageBackground';

export default function AiTutorPage() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  // Initialize conversation ID (client-side only)
  useEffect(() => {
    let id = localStorage.getItem('aiTutorConversationId');
    if (!id) {
      id = Date.now().toString();
      localStorage.setItem('aiTutorConversationId', id);
    }
    setConversationId(id);
    // Optionally load a welcome message
    if (conversation.length === 0) {
      setConversation([
        { role: 'ai', content: 'Hello! I\'m your AI Tutor. Ask me anything about your studies, and I\'ll help you learn. 🎓' }
      ]);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const handleSend = async () => {
    if (!message.trim() || loading) return;

    const userMessage = { role: 'user', content: message.trim() };
    setConversation(prev => [...prev, userMessage]);
    setMessage('');
    setLoading(true);

    try {
      // ✅ Use the api service method
      const response = await api.aiTutorChat(message.trim());
      const aiMessage = { role: 'ai', content: response.reply || 'I apologize, I could not generate a response. Please try again.' };
      setConversation(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI Tutor error:', error);
      const errorMessage = { role: 'ai', content: error.message || 'Sorry, I encountered an error. Please try again later.' };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageBackground imageUrl="/ai-tutor-bg.jpg">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Bot size={36} className="text-brand-400" />
          <h1 className="text-3xl font-bold text-white">AI Tutor</h1>
        </div>

        {/* Chat container */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-4 h-[500px] flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            {conversation.length === 0 ? (
              <div className="text-center text-white/40 mt-20">
                Ask me anything about your studies, challenges, or career path.
              </div>
            ) : (
              conversation.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] p-3 rounded-xl ${
                      msg.role === 'user'
                        ? 'bg-brand-500 text-white'
                        : 'bg-white/10 text-white/90'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/10 p-3 rounded-xl text-white/60 flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area – fixed layout */}
          <div className="flex gap-2 items-center border-t border-white/10 pt-3">
            <input
              type="text"
              className="flex-1 input py-2.5 text-base"
              placeholder="Ask a question..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !message.trim()}
              className="btn-primary px-4 py-2.5 flex items-center gap-1 disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>

        {/* Optional: Context hint */}
        <p className="text-xs text-white/30 text-center mt-3">
          Your conversation is stored locally and will be cleared on logout.
        </p>
      </div>
    </PageBackground>
  );
}