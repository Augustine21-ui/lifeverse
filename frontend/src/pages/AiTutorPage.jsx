import { useState, useEffect, useRef } from 'react';
import { Bot, Send, Loader2, X, Paperclip } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function AiTutorPage() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const getToken = () => localStorage.getItem('token') || '';

  useEffect(() => {
    let id = localStorage.getItem('aiTutorConversationId');
    if (!id) {
      id = Date.now().toString();
      localStorage.setItem('aiTutorConversationId', id);
    }
    setConversationId(id);
    fetchHistory(id);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const fetchHistory = async (id) => {
    if (!id) return;
    setLoadingHistory(true);
    try {
      const token = getToken();
      if (!token) {
        setLoadingHistory(false);
        return;
      }
      const res = await fetch(`/api/tutor/conversation/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          const history = data.messages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'ai',
            content: msg.content,
          }));
          setConversation(history);
        }
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    // Generate preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(file.name);
    }
    // Upload the file
    await uploadFile(file);
    // Reset the file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadFile = async (file) => {
    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const token = getToken();
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setUploadedFileUrl(data.url);
        // Optionally add a system message about the file
        setConversation(prev => [
          ...prev,
          { role: 'ai', content: `📎 Uploaded: ${file.name}` }
        ]);
      } else {
        console.error('Upload failed', data);
        setFilePreview(null);
      }
    } catch (err) {
      console.error('Upload error', err);
      setFilePreview(null);
    } finally {
      setUploadingFile(false);
      setSelectedFile(null);
    }
  };

  const handleSend = async () => {
    if ((!message.trim() && !uploadedFileUrl) || loading) return;

    const userMessageContent = message + (uploadedFileUrl ? `\n[File: ${uploadedFileUrl}]` : '');
    const userMessage = { role: 'user', content: userMessageContent };
    setConversation(prev => [...prev, userMessage]);
    setMessage('');
    setLoading(true);

    try {
      const token = getToken();
      if (!token) {
        throw new Error('Please log in to use the AI Tutor.');
      }
      const response = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: message,
          conversationId: conversationId,
          fileUrl: uploadedFileUrl, // send file URL if any
        }),
      });
      const data = await response.json();
      if (response.ok && data.reply) {
        const aiMessage = { role: 'ai', content: data.reply };
        setConversation(prev => [...prev, aiMessage]);
        if (data.conversationId && data.conversationId !== conversationId) {
          setConversationId(data.conversationId);
          localStorage.setItem('aiTutorConversationId', data.conversationId);
        }
        // Clear uploaded file after successful send
        setUploadedFileUrl(null);
        setFilePreview(null);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('AI Tutor error:', error);
      const errorMessage = { role: 'ai', content: error.message || 'Sorry, I encountered an error.' };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Bot size={32} className="text-brand-400" />
        <h1 className="text-3xl font-bold">AI Tutor</h1>
      </div>
      <div className="card p-4 h-[500px] flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {loadingHistory ? (
            <div className="text-center text-white/40 mt-20">Loading history...</div>
          ) : conversation.length === 0 ? (
            <div className="text-center text-white/40 mt-20">
              Ask me anything about your studies, challenges, or career path.
            </div>
          ) : (
            conversation.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-xl ${msg.role === 'user' ? 'bg-brand-500 text-white' : 'bg-white/10 text-white'}`}>
                  {msg.content}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/10 p-3 rounded-xl">Thinking...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* File preview */}
        {filePreview && (
          <div className="mb-2 p-2 bg-white/5 rounded flex items-center gap-2">
            {filePreview.startsWith('data:image') ? (
              <img src={filePreview} alt="preview" className="max-h-12 rounded" />
            ) : (
              <span className="text-sm">{filePreview}</span>
            )}
            <button
              onClick={() => {
                setFilePreview(null);
                setUploadedFileUrl(null);
                setSelectedFile(null);
              }}
              className="text-red-400 hover:text-red-300"
            >
              <X size={16} />
            </button>
            {uploadingFile && <Loader2 size={16} className="animate-spin ml-auto" />}
          </div>
        )}

        <div className="flex gap-2 items-center">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            accept="image/*,.pdf,.txt"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary px-2 py-1"
            disabled={uploadingFile}
            title="Attach file"
          >
            <Paperclip size={18} />
          </button>
          <input
            type="text"
            className="flex-1 input"
            placeholder="Ask a question..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading || uploadingFile}
          />
          <button
            onClick={handleSend}
            disabled={loading || uploadingFile}
            className="btn-primary"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}