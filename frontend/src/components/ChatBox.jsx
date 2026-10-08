import React, { useState } from 'react';
import { Send, Sparkles, BookOpen, Quote, ShieldAlert } from 'lucide-react';

export default function ChatBox({ onSendMessage, disabled }) {
  const [query, setQuery] = useState('');
  const [agentMode, setAgentMode] = useState('research');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || disabled) return;
    onSendMessage(query.trim(), agentMode);
    setQuery('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const quickPrompts = [
    { label: 'Explain methodology', prompt: 'Explain the core methodology and theoretical formulation in detail.', mode: 'research' },
    { label: 'List limitations', prompt: 'What limitations, trade-offs, and failure modes are identified in the paper?', mode: 'research' },
    { label: 'Generate Citations', prompt: 'Generate standard academic citations for this paper in BibTeX, APA, and IEEE formats.', mode: 'citation' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Quick Prompts */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {quickPrompts.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setQuery(item.prompt);
              setAgentMode(item.mode);
            }}
            className="btn btn-secondary"
            style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem', borderRadius: '9999px' }}
          >
            <Sparkles size={12} color="var(--primary)" />
            {item.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <textarea
          rows={3}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a technical question about the paper or methodology... (Enter to send, Shift+Enter for new line)"
          disabled={disabled}
          style={{
            width: '100%',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontSize: '0.9rem',
            lineHeight: 1.5,
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Active Agent:</span>
            <select
              value={agentMode}
              onChange={(e) => setAgentMode(e.target.value)}
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border)',
                background: '#f8fafc',
                color: 'var(--text-main)',
                cursor: 'pointer',
              }}
            >
              <option value="research">🔬 Research Agent (Deep Synthesis & RAG)</option>
              <option value="citation">📜 Citation Agent (BibTeX / APA / IEEE)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={!query.trim() || disabled}
            className="btn btn-primary"
            style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
          >
            <span>Ask PaperMind</span>
            <Send size={14} />
          </button>
        </div>
      </form>
    </div>
  );
}
