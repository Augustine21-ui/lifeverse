// frontend/src/pages/BridgePage.jsx
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { Loader2, Users, User, Megaphone, Copy, Send, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function BridgePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [connectionCode, setConnectionCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [students, setStudents] = useState([]);
  const [child, setChild] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [linking, setLinking] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentProgress, setStudentProgress] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [peerContacts, setPeerContacts] = useState([]);
  const [peerModalOpen, setPeerModalOpen] = useState(false);
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [peerConversationId, setPeerConversationId] = useState(null);
  const [peerMessages, setPeerMessages] = useState([]);
  const [peerMessageText, setPeerMessageText] = useState('');
  const [sendingPeer, setSendingPeer] = useState(false);
  const messagesEndRef = useRef(null);
  const peerMessagesEndRef = useRef(null);
  const pollInterval = useRef(null);
  const peerPollInterval = useRef(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const ann = await api.getBridgeAnnouncements();
      setAnnouncements(Array.isArray(ann) ? ann : []);
      if (user?.role === 'student') {
        const codeRes = await api.getBridgeCode();
        setConnectionCode(codeRes?.code || '');
        await loadConversations();
      } else if (user?.role === 'teacher') {
        const studentsList = await api.getBridgeStudents();
        setStudents(Array.isArray(studentsList) ? studentsList : []);
        if (studentsList?.length && !selectedStudent) setSelectedStudent(studentsList[0]);
        await loadConversations();
        await loadPeerContacts();
      } else if (user?.role === 'parent') {
        const childData = await api.getBridgeChild();
        if (childData) setChild(childData);
        if (childData && !selectedStudent) setSelectedStudent(childData);
        await loadConversations();
        await loadPeerContacts();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load bridge data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = async () => {
    try {
      const convs = await api.getBridgeConversations();
      if (!Array.isArray(convs)) {
        console.error('Expected array but got:', convs);
        setConversations([]);
        return;
      }
      // For students, show all conversations; for teachers/parents, filter only student-partner conversations in main list
      let filtered = convs;
      if (user?.role !== 'student') {
        filtered = convs.filter(conv => conv.partner_role === 'student');
      }
      const mapped = filtered.map(conv => ({
        id: conv.id,
        partnerId: parseInt(conv.partner_id, 10),
        partnerName: `${conv.partner_name} (${conv.partner_role})`,
        partnerRole: conv.partner_role,
        last_message: conv.last_message,
      }));
      // Deduplicate by id
      const unique = [];
      const seen = new Set();
      for (const conv of mapped) {
        if (!seen.has(conv.id)) {
          seen.add(conv.id);
          unique.push(conv);
        }
      }
      setConversations(unique);
      if (unique.length > 0 && !selectedConversation) {
        setSelectedConversation(unique[0]);
        await loadMessages(unique[0].id);
      } else if (selectedConversation) {
        await loadMessages(selectedConversation.id);
      }
    } catch (err) {
      console.error(err);
      setConversations([]);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const msgs = await api.getBridgeMessages(conversationId);
      setMessages(Array.isArray(msgs) ? msgs : []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error(err);
      setMessages([]);
    }
  };

  const loadPeerContacts = async () => {
    try {
      const contacts = await api.getBridgePeerContacts();
      if (!Array.isArray(contacts)) {
        setPeerContacts([]);
        return;
      }
      setPeerContacts(contacts);
    } catch (err) {
      console.error(err);
      setPeerContacts([]);
    }
  };

  const loadPeerConversation = async (peerId) => {
    try {
      const data = await api.getOrCreatePeerConversation(peerId);
      setPeerConversationId(data.conversationId);
      setPeerMessages(Array.isArray(data.messages) ? data.messages : []);
      setTimeout(() => peerMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error(err);
      showToast('Could not load conversation', 'error');
    }
  };

  const startPolling = () => {
    if (pollInterval.current) clearInterval(pollInterval.current);
    pollInterval.current = setInterval(() => {
      if (selectedConversation) loadMessages(selectedConversation.id);
      loadConversations();
    }, 5000);
  };

  useEffect(() => {
    loadData();
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
      if (peerPollInterval.current) clearInterval(peerPollInterval.current);
    };
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      startPolling();
    }
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [selectedConversation]);

  useEffect(() => {
    if (peerModalOpen && peerConversationId) {
      if (peerPollInterval.current) clearInterval(peerPollInterval.current);
      peerPollInterval.current = setInterval(async () => {
        try {
          const msgs = await api.getBridgeMessages(peerConversationId);
          setPeerMessages(Array.isArray(msgs) ? msgs : []);
          setTimeout(() => peerMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } catch (err) {}
      }, 5000);
    } else {
      if (peerPollInterval.current) clearInterval(peerPollInterval.current);
    }
    return () => {
      if (peerPollInterval.current) clearInterval(peerPollInterval.current);
    };
  }, [peerModalOpen, peerConversationId]);

  const generateCode = async () => {
    setGenerating(true);
    try {
      const res = await api.getBridgeCode();
      setConnectionCode(res.code);
      showToast('Your connection code is ready!');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(connectionCode);
    showToast('Code copied to clipboard');
  };

  const connectStudent = async () => {
    if (!inputCode.trim()) return;
    setLinking(true);
    try {
      await api.connectBridge(inputCode);
      showToast('Successfully connected!');
      setInputCode('');
      await loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLinking(false);
    }
  };

  const viewStudentProgress = async (studentId) => {
    try {
      const progress = await api.getBridgeStudentProgress(studentId);
      setStudentProgress(progress);
      setSelectedStudent(students.find(s => s.id === studentId) || child);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;
    const toUserId = selectedConversation.partnerId;
    if (!toUserId || isNaN(toUserId)) {
      showToast('Invalid recipient', 'error');
      return;
    }
    setSending(true);
    try {
      await api.sendBridgeMessage(toUserId, messageText);
      setMessageText('');
      await loadMessages(selectedConversation.id);
      await loadConversations();
      showToast('Message sent');
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  const openPeerChat = async (peer) => {
    setSelectedPeer(peer);
    setPeerModalOpen(true);
    await loadPeerConversation(peer.id);
  };

  const sendPeerMessage = async () => {
    if (!peerMessageText.trim() || !selectedPeer || !peerConversationId) return;
    setSendingPeer(true);
    try {
      await api.sendBridgeMessage(selectedPeer.id, peerMessageText);
      setPeerMessageText('');
      const msgs = await api.getBridgeMessages(peerConversationId);
      setPeerMessages(Array.isArray(msgs) ? msgs : []);
      setTimeout(() => peerMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      showToast('Message sent');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSendingPeer(false);
    }
  };

  if (loading) return <div className="p-6 flex justify-center"><Loader2 className="animate-spin" size={40} /></div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-2">Bridge – Safe Learning Space</h1>
      <p className="text-white/40 mb-6">Connect with students to monitor progress and communicate.</p>

      <div className="card p-5">
        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2"><Megaphone size={20} className="text-brand-400" /> Announcements</h2>
        {announcements.length === 0 ? <p className="text-white/40">No announcements yet.</p> :
          <div className="space-y-3">
            {announcements.map(a => (
              <div key={a.id} className="border-l-2 border-brand-400 pl-3">
                <p className="font-medium">{a.title}</p>
                <p className="text-sm text-white/60">{a.content}</p>
                <p className="text-xs text-white/30 mt-1">— {a.author_name}</p>
              </div>
            ))}
          </div>
        }
      </div>

      {user?.role === 'student' && (
        <div className="card p-5">
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">📋 Your Connection Code</h2>
          {connectionCode ? (
            <div className="flex items-center gap-3">
              <code className="bg-white/10 px-3 py-1 rounded text-lg font-mono">{connectionCode}</code>
              <button onClick={copyCode} className="btn-secondary flex items-center gap-1"><Copy size={14} /> Copy</button>
            </div>
          ) : (
            <button onClick={generateCode} disabled={generating} className="btn-primary">{generating ? <Loader2 size={16} className="animate-spin" /> : 'Generate Code'}</button>
          )}
          <p className="text-sm text-white/40 mt-3">Share this code with your parent or teacher.</p>
        </div>
      )}

      {(user?.role === 'parent' || user?.role === 'teacher') && (
        <div className="card p-5">
          <h2 className="text-xl font-semibold mb-3">Connect a Student</h2>
          <div className="flex gap-2">
            <input type="text" className="input flex-1" placeholder="Enter student's connection code" value={inputCode} onChange={(e) => setInputCode(e.target.value.toUpperCase())} />
            <button onClick={connectStudent} disabled={linking} className="btn-primary">{linking ? <Loader2 size={16} className="animate-spin" /> : 'Connect'}</button>
          </div>
        </div>
      )}

      {user?.role === 'teacher' && students.length > 0 && (
        <div className="card p-5">
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2"><Users size={20} className="text-brand-400" /> My Students</h2>
          <div className="grid gap-3">
            {students.map(s => (
              <div key={s.id} className="flex justify-between items-center border-b border-white/10 pb-2">
                <div><p className="font-medium">{s.full_name}</p><p className="text-sm text-white/40">Level {s.level} • {s.xp} XP</p></div>
                <button onClick={() => viewStudentProgress(s.id)} className="btn-secondary text-sm">View Progress</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {user?.role === 'parent' && child && (
        <div className="card p-5">
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2"><User size={20} className="text-brand-400" /> My Child</h2>
          <div className="flex justify-between items-center">
            <div><p className="font-medium">{child.full_name}</p><p className="text-sm text-white/40">Level {child.level} • {child.xp} XP</p></div>
            <button onClick={() => viewStudentProgress(child.id)} className="btn-secondary text-sm">View Progress</button>
          </div>
        </div>
      )}

      {(user?.role === 'teacher' || user?.role === 'parent') && peerContacts.length > 0 && (
        <div className="card p-5">
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">🤝 Other Contacts (Parents/Teachers)</h2>
          <div className="space-y-2">
            {peerContacts.map(peer => (
              <div key={peer.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-white/5">
                <div>
                  <p className="font-medium">{peer.full_name}</p>
                  <p className="text-xs text-white/40 capitalize">{peer.role}</p>
                </div>
                <button onClick={() => openPeerChat(peer)} className="btn-secondary text-sm">Message</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-5">
        <h2 className="text-xl font-semibold mb-3">💬 Messages with {user?.role === 'student' ? 'Parents/Teachers' : 'Students'}</h2>
        {conversations.length === 0 ? <p className="text-white/40">No conversations yet.</p> : (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="border-r border-white/10 pr-3 space-y-2 max-h-96 overflow-y-auto">
              {conversations.map(conv => (
                <button
                  key={`conv-${conv.id}`}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full text-left p-2 rounded-lg transition ${selectedConversation?.id === conv.id ? 'bg-brand-500/20 border border-brand-500/30' : 'hover:bg-white/5'}`}
                >
                  <p className="font-medium">{conv.partnerName}</p>
                  <p className="text-xs text-white/40 truncate">{conv.last_message || 'No messages yet'}</p>
                </button>
              ))}
            </div>
            <div className="md:col-span-2 flex flex-col h-96">
              {selectedConversation ? (
                <>
                  <div className="flex-1 overflow-y-auto mb-3 space-y-2 p-2 border border-white/10 rounded-lg">
                    {messages.length === 0 && <p className="text-white/40 text-center">No messages yet. Send a message to start a conversation.</p>}
                    {messages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] p-2 rounded-lg ${msg.sender_id === user?.id ? 'bg-brand-500/30 text-white' : 'bg-white/10 text-white'}`}>
                          <p className="text-xs text-white/60">{msg.sender_name} ({msg.sender_role})</p>
                          <p className="text-sm">{msg.content}</p>
                          <p className="text-xs text-white/40 text-right">{new Date(msg.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
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
                </>
              ) : (
                <div className="text-center text-white/40 mt-32">Select a conversation to start messaging.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {peerModalOpen && selectedPeer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setPeerModalOpen(false)}>
          <div className="w-full max-w-lg card p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Chat with {selectedPeer.full_name}</h3>
              <button onClick={() => setPeerModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="h-80 overflow-y-auto mb-3 space-y-2 p-2 border border-white/10 rounded-lg">
              {peerMessages.length === 0 && <p className="text-white/40 text-center">No messages yet. Send a message to start a conversation.</p>}
              {peerMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-2 rounded-lg ${msg.sender_id === user?.id ? 'bg-brand-500/30 text-white' : 'bg-white/10 text-white'}`}>
                    <p className="text-xs text-white/60">{msg.sender_name} ({msg.sender_role})</p>
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-xs text-white/40 text-right">{new Date(msg.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              <div ref={peerMessagesEndRef} />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 input"
                placeholder="Type a message..."
                value={peerMessageText}
                onChange={(e) => setPeerMessageText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendPeerMessage()}
              />
              <button onClick={sendPeerMessage} disabled={sendingPeer} className="btn-primary">
                {sendingPeer ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {studentProgress && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setStudentProgress(null)}>
          <div className="card p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Academic Progress: {selectedStudent.full_name}</h3>
            <div className="space-y-2">
              <p><span className="text-white/60">XP:</span> {studentProgress.xp}</p>
              <p><span className="text-white/60">Level:</span> {studentProgress.level}</p>
              <p><span className="text-white/60">Tasks completed:</span> {studentProgress.tasks}</p>
              <p><span className="text-white/60">Challenges completed:</span> {studentProgress.challenges}</p>
            </div>
            <button className="btn-primary mt-4 w-full" onClick={() => setStudentProgress(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
