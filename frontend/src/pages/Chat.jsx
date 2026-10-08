import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageSquare, Plus, BookOpen, Layers, Bot, Loader2, Sparkles } from 'lucide-react';
import { chatAPI, papersAPI } from '../services/api';
import Message from '../components/Message';
import ChatBox from '../components/ChatBox';

export default function Chat() {
  const [searchParams] = useSearchParams();
  const paperIdFromUrl = searchParams.get('paperId');

  const [papers, setPapers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedPaperId, setSelectedPaperId] = useState(paperIdFromUrl ? parseInt(paperIdFromUrl) : null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sendingMessage]);

  // Load user papers and existing sessions
  useEffect(() => {
    const initData = async () => {
      try {
        const [papersRes, sessionsRes] = await Promise.all([
          papersAPI.list(),
          chatAPI.listSessions(selectedPaperId || undefined)
        ]);
        setPapers(papersRes.data);
        setSessions(sessionsRes.data);

        // Auto-select or create session
        if (sessionsRes.data.length > 0) {
          selectSession(sessionsRes.data[0].id);
        } else {
          handleCreateNewSession();
        }
      } catch (err) {
        console.error('Failed to load chat data:', err);
      }
    };
    initData();
  }, [selectedPaperId]);

  const selectSession = async (sessionId) => {
    try {
      setLoadingHistory(true);
      const res = await chatAPI.getSessionHistory(sessionId);
      setActiveSession(res.data.session);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Failed to load session history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCreateNewSession = async () => {
    try {
      const res = await chatAPI.createSession({
        paper_id: selectedPaperId || undefined,
        title: selectedPaperId ? 'Paper Discussion' : 'General Research Chat'
      });
      const newSession = res.data;
      setSessions([newSession, ...sessions]);
      setActiveSession(newSession);
      setMessages([]);
    } catch (err) {
      console.error('Failed to create new session:', err);
    }
  };

  const handleSendMessage = async (query, agentMode) => {
    if (!activeSession) return;

    // Optimistically add user message
    const tempUserMsg = {
      id: Date.now(),
      session_id: activeSession.id,
      role: 'user',
      content: query,
      agent_used: agentMode,
      citations: [],
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setSendingMessage(true);

    try {
      const res = await chatAPI.sendMessage(activeSession.id, query, agentMode);
      setMessages((prev) => [...prev, res.data]);
    } catch (err) {
      const errorMsg = {
        id: Date.now() + 1,
        session_id: activeSession.id,
        role: 'assistant',
        content: `Error: ${err.response?.data?.detail || 'Failed to generate response. Please try again.'}`,
        agent_used: 'system',
        citations: [],
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSendingMessage(false);
    }
  };

  const currentPaper = papers.find((p) => p.id === activeSession?.paper_id);

  return (
    <div style={{ height: 'calc(100vh - 4rem)', display: 'flex', overflow: 'hidden' }}>
      {/* Sidebar: Conversation Sessions */}
      <aside
        style={{
          width: '280px',
          borderRight: '1px solid var(--border)',
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
          <button
            onClick={handleCreateNewSession}
            className="btn btn-primary"
            style={{ width: '100%', fontSize: '0.85rem' }}
          >
            <Plus size={16} />
            New Research Thread
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0.25rem 0.5rem' }}>
            Threads
          </div>

          {sessions.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.5rem' }}>No conversations yet.</p>
          ) : (
            sessions.map((sess) => {
              const isSelected = activeSession?.id === sess.id;
              return (
                <button
                  key={sess.id}
                  onClick={() => selectSession(sess.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.625rem 0.75rem',
                    borderRadius: '0.5rem',
                    textAlign: 'left',
                    background: isSelected ? 'var(--primary-light)' : 'transparent',
                    color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                    border: 'none',
                    fontWeight: isSelected ? 600 : 400,
                    fontSize: '0.85rem',
                    width: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <MessageSquare size={15} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sess.title || 'Untitled Session'}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Chat Workspace */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0, background: '#f8fafc' }}>
        {/* Context Header */}
        <div
          style={{
            padding: '0.875rem 1.5rem',
            background: '#ffffff',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
            <div style={{ background: '#e0e7ff', color: 'var(--primary)', padding: '0.4rem', borderRadius: '0.375rem', display: 'flex' }}>
              <Bot size={18} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeSession?.title || 'Research Session'}
              </h2>
              {currentPaper && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Context: <strong>{currentPaper.title}</strong> ({currentPaper.total_chunks} chunks)
                </p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Focus Paper:</span>
            <select
              value={activeSession?.paper_id || ''}
              onChange={(e) => {
                const val = e.target.value ? parseInt(e.target.value) : null;
                setSelectedPaperId(val);
                handleCreateNewSession();
              }}
              style={{
                fontSize: '0.8rem',
                padding: '0.3rem 0.5rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border)',
                outline: 'none',
                maxWidth: '220px',
              }}
            >
              <option value="">All Papers (Global Corpus)</option>
              {papers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title.length > 30 ? p.title.slice(0, 30) + '...' : p.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Message Stream */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          {loadingHistory ? (
            <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)' }}>
              <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
              <p style={{ fontSize: '0.85rem' }}>Loading conversation history...</p>
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', margin: 'auto', maxWidth: '480px', color: 'var(--text-muted)' }}>
              <div style={{ background: '#e0e7ff', color: 'var(--primary)', padding: '1rem', borderRadius: '1rem', display: 'inline-flex', marginBottom: '1rem' }}>
                <Sparkles size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Ask PaperMind Multi-Agent Assistant
              </h3>
              <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', lineHeight: 1.5 }}>
                Query technical concepts, extract algorithms, compare hypotheses, or generate citations verified with exact page numbers.
              </p>
            </div>
          ) : (
            messages.map((msg) => <Message key={msg.id} message={msg} />)
          )}

          {sendingMessage && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px dashed var(--border)', marginBottom: '1rem' }}>
              <Loader2 size={18} className="animate-spin" color="var(--primary)" />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Agent analyzing indexed vector embeddings and formulating citations...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div style={{ padding: '1rem 1.5rem', background: '#ffffff', borderTop: '1px solid var(--border)' }}>
          <ChatBox onSendMessage={handleSendMessage} disabled={sendingMessage || !activeSession} />
        </div>
      </main>
    </div>
  );
}
