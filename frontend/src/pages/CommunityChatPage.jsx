import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { Loader2, Send, Users, ChevronLeft } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function CommunityChatPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);
  const pollInterval = useRef(null);

  const loadCommunity = async () => {
    try {
      const data = await api.getCommunityById(id);
      setCommunity(data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load community', 'error');
    }
  };

  const loadMessages = async () => {
    try {
      const msgs = await api.getCommunityMessages(id);
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMembers = async () => {
    try {
      const mems = await api.getCommunityMembers(id);
      setMembers(mems);
    } catch (err) {
      console.error(err);
    }
  };

  const startPolling = () => {
    if (pollInterval.current) clearInterval(pollInterval.current);
    pollInterval.current = setInterval(() => {
      loadMessages();
    }, 3000);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadCommunity(), loadMessages(), loadMembers()]);
      setLoading(false);
      startPolling();
    };
    loadData();
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [id]);

  const sendMessage = async () => {
    if (!messageText.trim()) return;
    setSending(true);
    try {
      await api.sendCommunityMessage(id, messageText);
      setMessageText('');
      await loadMessages();
      showToast('Message sent');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="p-6 flex justify-center"><Loader2 className="animate-spin" size={40} /></div>;
  }

  if (!community) {
    return <div className="p-6 text-center">Community not found.</div>;
  }

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar with member list */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <Link to="/communities" className="flex items-center gap-2 text-white/60 hover:text-white mb-2">
            <ChevronLeft size={20} /> Back to Communities
          </Link>
          <h2 className="text-xl font-bold">{community.name}</h2>
          <p className="text-sm text-white/40 mt-1">{community.description}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2"><Users size={16} /> Members ({members.length})</h3>
          <div className="space-y-2">
            {members.map(member => (
              <div key={member.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-xs font-bold">
                    {(member.full_name?.[0] || member.username?.[0]).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{member.full_name || member.username}</p>
                    <p className="text-xs text-white/40">{member.role}</p>
                  </div>
                </div>
                {member.id === user?.id && <span className="text-xs bg-brand-500/20 px-2 py-0.5 rounded">You</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-white/40 mt-20">No messages yet. Be the first to say something!</div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] p-3 rounded-lg ${msg.sender_id === user?.id ? 'bg-brand-600 text-white' : 'bg-gray-700 text-white'}`}>
                {msg.sender_id !== user?.id && (
                  <p className="text-xs text-white/60 mb-1">{msg.sender_name}</p>
                )}
                <p className="text-sm break-words">{msg.content}</p>
                <p className="text-xs text-white/40 text-right mt-1">{new Date(msg.created_at).toLocaleTimeString()}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-4 border-t border-gray-700 bg-gray-800">
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 input"
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button onClick={sendMessage} disabled={sending} className="btn-primary">
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
