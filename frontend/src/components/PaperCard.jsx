import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, MessageSquare, ExternalLink, Trash2, Download, Layers } from 'lucide-react';
import { papersAPI } from '../services/api';

export default function PaperCard({ paper, onDelete }) {
  const getBadgeClass = (status) => {
    switch (status) {
      case 'ready': return 'badge-ready';
      case 'processing': return 'badge-processing';
      case 'failed': return 'badge-failed';
      default: return 'badge-processing';
    }
  };

  return (
    <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.3 }}>
          <Link to={`/papers/${paper.id}`} style={{ color: 'inherit' }}>
            {paper.title || 'Untitled Paper'}
          </Link>
        </h3>
        <span className={`badge ${getBadgeClass(paper.status)}`}>
          {paper.status}
        </span>
      </div>

      <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
        {paper.authors ? `${paper.authors} ` : 'Authors not identified'}
        {paper.year ? `• (${paper.year})` : ''}
      </div>

      {paper.abstract && (
        <p style={{
          fontSize: '0.85rem',
          color: '#475569',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: 1.4
        }}>
          {paper.abstract}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <FileText size={14} />
          {paper.total_pages} {paper.total_pages === 1 ? 'Page' : 'Pages'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Layers size={14} />
          {paper.total_chunks} Chunks
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <a
            href={papersAPI.downloadUrl(paper.id)}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.5rem' }}
            title="Download PDF"
          >
            <Download size={13} />
          </a>
          <Link
            to={`/chat?paperId=${paper.id}`}
            className="btn btn-primary"
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
          >
            <MessageSquare size={13} />
            Chat
          </Link>
          <button
            onClick={() => onDelete(paper.id)}
            className="btn btn-danger"
            style={{ padding: '0.35rem 0.5rem' }}
            title="Delete Paper"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
