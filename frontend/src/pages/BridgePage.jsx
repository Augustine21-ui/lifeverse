// frontend/src/pages/BridgePage.jsx
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { Loader2, Users, User, Megaphone, Copy, Send, X, LinkIcon, RefreshCw, Check, Eye, FileText, MessageCircle, Plus, Calendar, Award, TrendingUp, Download, Upload, Bell, Settings, LogOut } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import PageBackground from '../components/PageBackground';

export default function BridgePage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // State
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
  const [copied, setCopied] = useState(false);
  const [codeExpiry, setCodeExpiry] = useState(null);
  const messagesEndRef = useRef(null);
  const peerMessagesEndRef = useRef(null);
  const pollInterval = useRef(null);
  const peerPollInterval = useRef(null);

  // Teacher specific state
  const [activeTab, setActiveTab] = useState('students');
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', targetRoles: ['student'] });
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [submittingAnnouncement, setSubmittingAnnouncement] = useState(false);
  const [showReportCardModal, setShowReportCardModal] = useState(false);
  const [reportCardData, setReportCardData] = useState({ studentId: '', title: '', description: '', fileUrl: '', grade: '', subject: '' });
  const [submittingReportCard, setSubmittingReportCard] = useState(false);

  // Load data
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

  const loadData = async () => {
    setLoading(true);
    try {
      const ann = await api.getBridgeAnnouncements();
      setAnnouncements(Array.isArray(ann) ? ann : []);
      if (user?.role === 'student') {
        const codeRes = await api.getBridgeCode();
        setConnectionCode(codeRes?.code || '');
        setCodeExpiry(codeRes?.expires_at || null);
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
        unread_count: conv.unread_count || 0,
      }));
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

  // Student code functions
  const generateCode = async () => {
    setGenerating(true);
    try {
      const res = await api.getBridgeCode();
      setConnectionCode(res.code);
      setCodeExpiry(res.expires_at || null);
      showToast('Your connection code is ready!');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = async () => {
    if (!connectionCode) return;
    try {
      await navigator.clipboard.writeText(connectionCode);
      setCopied(true);
      showToast('Code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const input = document.createElement('input');
      input.value = connectionCode;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      showToast('Code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
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

  // Teacher functions
  const createAnnouncement = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    setSubmittingAnnouncement(true);
    try {
      await api.createBridgeAnnouncement(
        newAnnouncement.title,
        newAnnouncement.content,
        newAnnouncement.targetRoles
      );
      showToast('Announcement published!');
      setNewAnnouncement({ title: '', content: '', targetRoles: ['student'] });
      setShowAnnouncementForm(false);
      const ann = await api.getBridgeAnnouncements();
      setAnnouncements(Array.isArray(ann) ? ann : []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmittingAnnouncement(false);
    }
  };

  const handleReportCardSubmit = async (e) => {
    e.preventDefault();
    if (!reportCardData.studentId || !reportCardData.title) {
      showToast('Please fill in required fields', 'error');
      return;
    }
    setSubmittingReportCard(true);
    try {
      await api.uploadReportCard(reportCardData);
      showToast('Report card uploaded!');
      setShowReportCardModal(false);
      setReportCardData({ studentId: '', title: '', description: '', fileUrl: '', grade: '', subject: '' });
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmittingReportCard(false);
    }
  };

  // Calculate days until expiry
  const getDaysUntilExpiry = () => {
    if (!codeExpiry) return null;
    const now = new Date();
    const expiry = new Date(codeExpiry);
    const diff = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (loading) return <div className="p-6 flex justify-center"><Loader2 className="animate-spin" size={40} /></div>;

  // ============================================================
  // STUDENT VIEW
  // ============================================================
  if (user?.role === 'student') {
    return (
      <PageBackground imageUrl="/bridge-bg.jpg">
        <div className="max-w-5xl mx-auto p-6 space-y-6">
          <h1 className="text-3xl font-bold mb-2">Bridge – Safe Learning Space</h1>
          <p className="text-white/40 mb-6">Connect with your parents or teachers to share progress.</p>

          {/* Announcements */}
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

          {/* Connection Code */}
          <div className="card p-5">
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <LinkIcon size={20} className="text-brand-400" /> Your Connection Code
            </h2>
            {connectionCode ? (
              <>
                <div className="mt-3 flex items-center bg-black/30 rounded-xl border border-white/10 overflow-hidden focus-within:border-brand-500/50 transition">
                  <code className="flex-1 px-4 py-3 text-2xl font-mono font-bold text-brand-400 tracking-wider bg-transparent outline-none">
                    {connectionCode}
                  </code>
                  <button
                    onClick={copyCode}
                    className={`px-4 py-3 transition flex items-center gap-2 border-l border-white/10 ${
                      copied ? 'text-green-400' : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                    title="Copy code"
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                    <span className="text-sm hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <p className="mt-3 text-sm text-white/60">
                  Share this code with your parent or teacher so they can connect with you on Bridge.
                </p>
                <div className="mt-2 flex items-center gap-4 text-xs">
                  <span className="text-white/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                    Active
                  </span>
                  {getDaysUntilExpiry() !== null && (
                    <span className="text-white/30">
                      Expires in {getDaysUntilExpiry()} days
                    </span>
                  )}
                </div>
                <button
                  onClick={generateCode}
                  disabled={generating}
                  className="mt-3 text-xs text-white/30 hover:text-white/60 transition flex items-center gap-1"
                >
                  {generating ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                  {generating ? 'Generating...' : 'Regenerate code'}
                </button>
              </>
            ) : (
              <button onClick={generateCode} disabled={generating} className="btn-primary">
                {generating ? <Loader2 size={16} className="animate-spin" /> : 'Generate Code'}
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="card p-5">
            <h2 className="text-xl font-semibold mb-3">💬 Messages with Parents/Teachers</h2>
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
                      {conv.unread_count > 0 && (
                        <span className="text-xs text-brand-400">({conv.unread_count} unread)</span>
                      )}
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
        </div>
      </PageBackground>
    );
  }

  // ============================================================
  // PARENT VIEW
  // ============================================================
  if (user?.role === 'parent') {
    return (
      <PageBackground imageUrl="/bridge-bg.jpg">
        <div className="max-w-5xl mx-auto p-6 space-y-6">
          <h1 className="text-3xl font-bold mb-2">Bridge – Safe Learning Space</h1>
          <p className="text-white/40 mb-6">Connect with your child to monitor progress and communicate.</p>

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

          <div className="card p-5">
            <h2 className="text-xl font-semibold mb-3">Connect a Student</h2>
            <div className="flex gap-2">
              <input
                type="text"
                className="input flex-1"
                placeholder="Enter student's connection code"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              />
              <button onClick={connectStudent} disabled={linking} className="btn-primary">
                {linking ? <Loader2 size={16} className="animate-spin" /> : 'Connect'}
              </button>
            </div>
          </div>

          {child && (
            <div className="card p-5">
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2"><User size={20} className="text-brand-400" /> My Child</h2>
              <div className="flex justify-between items-center">
                <div><p className="font-medium">{child.full_name}</p><p className="text-sm text-white/40">Level {child.level} • {child.xp} XP</p></div>
                <button onClick={() => viewStudentProgress(child.id)} className="btn-secondary text-sm">View Progress</button>
              </div>
            </div>
          )}

          {peerContacts.length > 0 && (
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
            <h2 className="text-xl font-semibold mb-3">💬 Messages with Students</h2>
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
        </div>
      </PageBackground>
    );
  }

  // ============================================================
  // TEACHER VIEW - Enhanced with Parents Tab
  // ============================================================
  if (user?.role === 'teacher') {
    // Filter parent contacts from peerContacts
    const parentContacts = peerContacts.filter(p => p.role === 'parent');

    return (
      <PageBackground imageUrl="/bridge-bg.jpg">
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-1">👨‍🏫 Teacher Bridge</h1>
              <p className="text-white/40">Manage your students, parents, announcements, and communication.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Megaphone size={16} />
                New Announcement
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-white/10 overflow-x-auto">
            {['students', 'parents', 'announcements', 'messages', 'progress'].map(tab => (
              <button
                key={tab}
                className={`px-4 py-2 capitalize transition whitespace-nowrap ${
                  activeTab === tab ? 'border-b-2 border-brand-500 text-white' : 'text-white/40 hover:text-white'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'students' && '👥 Students'}
                {tab === 'parents' && '👨‍👩‍👧 Parents'}
                {tab === 'announcements' && '📢 Announcements'}
                {tab === 'messages' && '💬 Messages'}
                {tab === 'progress' && '📊 Progress'}
              </button>
            ))}
          </div>

          {/* ===== STUDENTS TAB ===== */}
          {activeTab === 'students' && (
            <div className="space-y-4">
              {students.length === 0 ? (
                <div className="card p-8 text-center text-white/40">
                  <Users size={40} className="mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium text-white/60">No students connected yet</p>
                  <p className="text-sm">Share your connection code or ask students to connect.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {students.map(s => (
                    <div key={s.id} className="card p-4 flex items-center justify-between hover:border-white/20 transition">
                      <div>
                        <p className="font-semibold">{s.full_name}</p>
                        <p className="text-sm text-white/40">Level {s.level} • {s.xp} XP</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewStudentProgress(s.id)}
                          className="btn-secondary text-sm flex items-center gap-1"
                        >
                          <Eye size={14} />
                          View
                        </button>
                        <button
                          onClick={() => {
                            setSelectedConversation(
                              conversations.find(c => c.partnerId === s.id) || null
                            );
                            setActiveTab('messages');
                          }}
                          className="btn-primary text-sm flex items-center gap-1"
                        >
                          <MessageCircle size={14} />
                          Message
                        </button>
                        <button
                          onClick={() => {
                            setReportCardData(prev => ({ ...prev, studentId: s.id }));
                            setShowReportCardModal(true);
                          }}
                          className="btn-secondary text-sm flex items-center gap-1"
                        >
                          <Upload size={14} />
                          Report
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== PARENTS TAB ===== */}
          {activeTab === 'parents' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">👨‍👩‍👧 Parents of Your Students</h2>
              {parentContacts.length === 0 ? (
                <div className="card p-8 text-center text-white/40">
                  <Users size={40} className="mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium text-white/60">No parents connected yet</p>
                  <p className="text-sm">Parents will appear here once they connect to your students.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {parentContacts.map(p => (
                    <div key={p.id} className="card p-4 flex items-center justify-between hover:border-white/20 transition">
                      <div>
                        <p className="font-semibold">{p.full_name}</p>
                        <p className="text-sm text-white/40 capitalize">{p.role}</p>
                      </div>
                      <button
                        onClick={() => openPeerChat(p)}
                        className="btn-primary text-sm flex items-center gap-1"
                      >
                        <MessageCircle size={14} />
                        Message
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== ANNOUNCEMENTS TAB ===== */}
          {activeTab === 'announcements' && (
            <div className="space-y-4">
              {showAnnouncementForm && (
                <div className="card p-5 border-brand-500/30">
                  <h3 className="text-lg font-semibold mb-3">Create Announcement</h3>
                  <form onSubmit={createAnnouncement} className="space-y-3">
                    <input
                      type="text"
                      className="input w-full"
                      placeholder="Title"
                      value={newAnnouncement.title}
                      onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                      required
                    />
                    <textarea
                      className="input w-full resize-none"
                      rows="3"
                      placeholder="Content..."
                      value={newAnnouncement.content}
                      onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                      required
                    />
                    <div className="flex items-center gap-4">
                      <label className="text-sm text-white/60">Target:</label>
                      <select
                        className="input"
                        value={newAnnouncement.targetRoles[0]}
                        onChange={(e) => setNewAnnouncement({...newAnnouncement, targetRoles: [e.target.value]})}
                      >
                        <option value="student">Students</option>
                        <option value="parent">Parents</option>
                        <option value="teacher">Teachers</option>
                        <option value="all">All</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" disabled={submittingAnnouncement} className="btn-primary">
                        {submittingAnnouncement ? <Loader2 size={16} className="animate-spin" /> : 'Publish'}
                      </button>
                      <button type="button" onClick={() => setShowAnnouncementForm(false)} className="btn-secondary">
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {announcements.length === 0 ? (
                <div className="card p-8 text-center text-white/40">
                  <Megaphone size={40} className="mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium text-white/60">No announcements yet</p>
                  <p className="text-sm">Create your first announcement to communicate with students and parents.</p>
                </div>
              ) : (
                announcements.map(a => (
                  <div key={a.id} className="card p-4 border-l-4 border-brand-500">
                    <h3 className="font-semibold text-lg">{a.title}</h3>
                    <p className="text-white/80 mt-1">{a.content}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                      <span>Posted by {a.author_name}</span>
                      <span>•</span>
                      <span>{new Date(a.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="capitalize">Target: {a.target_roles?.join(', ') || 'All'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ===== MESSAGES TAB ===== */}
          {activeTab === 'messages' && (
            <div className="card p-5">
              <h2 className="text-xl font-semibold mb-3">💬 Messages with Students</h2>
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
                        {conv.unread_count > 0 && (
                          <span className="text-xs text-brand-400">({conv.unread_count} unread)</span>
                        )}
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
          )}

          {/* ===== PROGRESS TAB ===== */}
          {activeTab === 'progress' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">📊 Student Progress Overview</h2>
              {students.length === 0 ? (
                <div className="card p-8 text-center text-white/40">
                  <Users size={40} className="mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium text-white/60">No students connected</p>
                  <p className="text-sm">Connect with students to track their progress.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {students.map(s => (
                    <div key={s.id} className="card p-4 hover:border-white/20 transition cursor-pointer" onClick={() => viewStudentProgress(s.id)}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold">
                          {s.full_name?.[0] || 'S'}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{s.full_name}</p>
                          <p className="text-xs text-white/40">Level {s.level} • {s.xp} XP</p>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-between text-sm">
                        <span className="text-white/40">Streak</span>
                        <span className="text-amber-400">🔥 {s.streak_days || 0}d</span>
                      </div>
                      <button
                        className="mt-2 w-full btn-secondary text-sm"
                        onClick={(e) => { e.stopPropagation(); viewStudentProgress(s.id); }}
                      >
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Report Card Modal */}
          {showReportCardModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowReportCardModal(false)}>
              <div className="card max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Upload Report Card</h3>
                  <button onClick={() => setShowReportCardModal(false)} className="text-white/40 hover:text-white">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleReportCardSubmit} className="space-y-3">
                  <div>
                    <label className="text-sm text-white/60">Student</label>
                    <select
                      className="input w-full"
                      value={reportCardData.studentId}
                      onChange={(e) => setReportCardData({...reportCardData, studentId: e.target.value})}
                      required
                    >
                      <option value="">Select student</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.full_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-white/60">Title *</label>
                    <input
                      type="text"
                      className="input w-full"
                      placeholder="e.g., Mid-Term Report"
                      value={reportCardData.title}
                      onChange={(e) => setReportCardData({...reportCardData, title: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-white/60">Subject (optional)</label>
                    <input
                      type="text"
                      className="input w-full"
                      placeholder="e.g., Mathematics"
                      value={reportCardData.subject}
                      onChange={(e) => setReportCardData({...reportCardData, subject: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-white/60">Grade (optional)</label>
                    <input
                      type="text"
                      className="input w-full"
                      placeholder="e.g., A+"
                      value={reportCardData.grade}
                      onChange={(e) => setReportCardData({...reportCardData, grade: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-white/60">Description (optional)</label>
                    <textarea
                      className="input w-full resize-none"
                      rows="2"
                      placeholder="Additional notes..."
                      value={reportCardData.description}
                      onChange={(e) => setReportCardData({...reportCardData, description: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-white/60">File URL (optional)</label>
                    <input
                      type="url"
                      className="input w-full"
                      placeholder="https://..."
                      value={reportCardData.fileUrl}
                      onChange={(e) => setReportCardData({...reportCardData, fileUrl: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={submittingReportCard} className="btn-primary flex-1">
                      {submittingReportCard ? <Loader2 size={16} className="animate-spin" /> : 'Upload Report Card'}
                    </button>
                    <button type="button" onClick={() => setShowReportCardModal(false)} className="btn-secondary">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Progress Modal */}
          {studentProgress && selectedStudent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setStudentProgress(null)}>
              <div className="card max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">📊 {selectedStudent.full_name}'s Progress</h3>
                  <button onClick={() => setStudentProgress(null)} className="text-white/40 hover:text-white">
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded">
                    <span className="text-white/60">XP</span>
                    <span className="text-xl font-bold text-yellow-400">{studentProgress.xp || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded">
                    <span className="text-white/60">Level</span>
                    <span className="text-xl font-bold text-brand-400">{studentProgress.level || 1}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded">
                    <span className="text-white/60">Tasks Completed</span>
                    <span className="text-xl font-bold text-green-400">{studentProgress.tasks || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded">
                    <span className="text-white/60">Challenges</span>
                    <span className="text-xl font-bold text-purple-400">{studentProgress.challenges || 0}</span>
                  </div>
                  <button className="mt-2 w-full btn-secondary" onClick={() => setStudentProgress(null)}>Close</button>
                </div>
              </div>
            </div>
          )}

          {/* Peer Chat Modal (for messaging parents) */}
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
        </div>
      </PageBackground>
    );
  }

  // Fallback
  return (
    <PageBackground imageUrl="/bridge-bg.jpg">
      <div className="p-6 text-center text-white/60">Role not recognized.</div>
    </PageBackground>
  );
}