import React, { useState } from 'react';
import { User, Bot, BookOpen, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

export default function Message({ message }) {
  const isUser = message.role === 'user';
  const [showCitations, setShowCitations] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyContent = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: '1rem',
        padding: '1.25rem',
        background: isUser ? '#ffffff' : '#f8fafc',
        borderRadius: '0.75rem',
        border: '1px solid var(--border)',
        marginBottom: '1rem',
      }}
    >
      <div
        style={{
          width: '2.25rem',
          height: '2.25rem',
          borderRadius: '9999px',
          background: isUser ? '#e0e7ff' : '#dbeafe',
          color: isUser ? 'var(--primary)' : '#2563eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
              {isUser ? 'You' : 'PaperMind Assistant'}
            </span>
            {message.agent_used && (
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '0.125rem 0.375rem',
                  borderRadius: '0.25rem',
                  background: '#eef2ff',
                  color: 'var(--primary)',
                  fontWeight: 500,
                  textTransform: 'capitalize',
                }}
              >
                {message.agent_used} agent
              </span>
            )}
          </div>

          <button
            onClick={copyContent}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', padding: '0.25rem' }}
            title="Copy message"
          >
            {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
          </button>
        </div>

        <div style={{ fontSize: '0.925rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', color: '#1e293b' }}>
          {message.content}
        </div>

        {/* Source Citations */}
        {message.citations && message.citations.length > 0 && (
          <div style={{ marginTop: '0.875rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
            <button
              onClick={() => setShowCitations(!showCitations)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--primary)',
                background: 'none',
                border: 'none',
                padding: 0,
              }}
            >
              <BookOpen size={13} />
              <span>{message.citations.length} Verified Sources & Citations</span>
              {showCitations ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            {showCitations && (
              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {message.citations.map((cite, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                      Page {cite.page_number} {cite.relevance_score ? `(Relevance: ${(cite.relevance_score * 100).toFixed(0)}%)` : ''}
                    </div>
                    <div style={{ color: '#64748b', fontStyle: 'italic' }}>
                      "{cite.snippet}"
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
