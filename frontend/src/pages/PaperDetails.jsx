import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText,
  MessageSquare,
  Download,
  Copy,
  Check,
  Sparkles,
  BookOpen,
  Layers,
  Calendar,
  User,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { papersAPI, summaryAPI } from '../services/api';

export default function PaperDetails() {
  const { id } = useParams();
  const [paper, setPaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryMode, setSummaryMode] = useState('comprehensive');
  const [citations, setCitations] = useState(null);
  const [copiedFormat, setCopiedFormat] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPaper = async () => {
      try {
        setLoading(true);
        const res = await papersAPI.get(id);
        setPaper(res.data);
      } catch (err) {
        setError('Failed to fetch paper details.');
      } finally {
        setLoading(false);
      }
    };
    fetchPaper();
  }, [id]);

  const handleGenerateSummary = async (mode = summaryMode) => {
    try {
      setSummaryLoading(true);
      const res = await summaryAPI.getSummary(id, mode);
      setSummary(res.data);
    } catch (err) {
      alert('Failed to generate summary.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleFetchCitations = async () => {
    try {
      const res = await summaryAPI.getCitations(id, 'bibtex');
      setCitations(res.data.all_formats);
    } catch (err) {
      alert('Failed to fetch citations.');
    }
  };

  const copyToClipboard = (text, format) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>
        <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
        <p>Loading document details...</p>
      </div>
    );
  }

  if (error || !paper) {
    return (
      <div className="container" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
          <AlertCircle size={20} />
          <span>{error || 'Paper not found.'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner */}
      <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <span className="badge badge-ready" style={{ marginBottom: '0.5rem' }}>{paper.status}</span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.3 }}>{paper.title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <User size={15} />
                <span>{paper.authors || 'Authors unspecified'}</span>
              </div>
              {paper.year && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={15} />
                  <span>{paper.year}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <FileText size={15} />
                <span>{paper.total_pages} Pages</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Layers size={15} />
                <span>{paper.total_chunks} Vector Chunks</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a
              href={papersAPI.downloadUrl(paper.id)}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
            >
              <Download size={16} />
              Original PDF
            </a>
            <Link to={`/chat?paperId=${paper.id}`} className="btn btn-primary">
              <MessageSquare size={16} />
              Chat with Paper
            </Link>
          </div>
        </div>

        {paper.abstract && (
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              Abstract
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6 }}>{paper.abstract}</p>
          </div>
        )}
      </div>

      {/* Structured Multi-Agent Summary Section */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} color="var(--primary)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Autonomous Summarizer Agent</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <select
              value={summaryMode}
              onChange={(e) => {
                setSummaryMode(e.target.value);
                handleGenerateSummary(e.target.value);
              }}
              style={{
                fontSize: '0.85rem',
                padding: '0.4rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border)',
                outline: 'none',
              }}
            >
              <option value="comprehensive">Comprehensive Breakdown</option>
              <option value="executive">Executive Digest</option>
              <option value="methodology">Methodology Focus</option>
              <option value="tldr">TL;DR Key Points</option>
            </select>

            <button
              onClick={() => handleGenerateSummary(summaryMode)}
              disabled={summaryLoading}
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
            >
              {summaryLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Regenerate
            </button>
          </div>
        </div>

        {summaryLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
            <p>Synthesizing paper sections and extracting key insights...</p>
          </div>
        ) : summary ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {summary.executive_summary && (
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  Executive Summary
                </h4>
                <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.6 }}>{summary.executive_summary}</p>
              </div>
            )}

            {summary.key_contributions && summary.key_contributions.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  Key Scientific Contributions
                </h4>
                <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem', color: '#334155', lineHeight: 1.6 }}>
                  {summary.key_contributions.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: '0.25rem' }}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {summary.methodology && (
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  Methodological Overview
                </h4>
                <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.6 }}>{summary.methodology}</p>
              </div>
            )}

            {summary.limitations && (
              <div style={{ background: '#fffbeb', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #fef3c7' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#92400e', marginBottom: '0.25rem' }}>
                  Limitations & Edge Cases
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#78350f', lineHeight: 1.5 }}>{summary.limitations}</p>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '0.875rem' }}>Click below to generate an AI digest of this document.</p>
            <button
              onClick={() => handleGenerateSummary(summaryMode)}
              className="btn btn-primary"
              style={{ marginTop: '0.75rem' }}
            >
              <Sparkles size={15} />
              Generate Summary
            </button>
          </div>
        )}
      </div>

      {/* Citations Agent Section */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={20} color="var(--primary)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Citation Agent Formatter</h2>
          </div>

          {!citations && (
            <button onClick={handleFetchCitations} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
              Load Citations
            </button>
          )}
        </div>

        {citations ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>BIBTEX</span>
                <button
                  onClick={() => copyToClipboard(citations.bibtex, 'bibtex')}
                  className="btn btn-secondary"
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                >
                  {copiedFormat === 'bibtex' ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                  Copy BibTeX
                </button>
              </div>
              <pre style={{ background: '#0f172a', color: '#f8fafc', padding: '0.75rem', borderRadius: '0.375rem', fontSize: '0.75rem', overflowX: 'auto', fontFamily: 'monospace' }}>
                {citations.bibtex}
              </pre>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>APA FORMAT</span>
                  <button
                    onClick={() => copyToClipboard(citations.apa, 'apa')}
                    className="btn btn-secondary"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                  >
                    {copiedFormat === 'apa' ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                    Copy
                  </button>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid var(--border)', padding: '0.75rem', borderRadius: '0.375rem', fontSize: '0.825rem' }}>
                  {citations.apa}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>IEEE FORMAT</span>
                  <button
                    onClick={() => copyToClipboard(citations.ieee, 'ieee')}
                    className="btn btn-secondary"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                  >
                    {copiedFormat === 'ieee' ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                    Copy
                  </button>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid var(--border)', padding: '0.75rem', borderRadius: '0.375rem', fontSize: '0.825rem' }}>
                  {citations.ieee}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Generate and export bibliographic citations formatted according to major scientific publication venues.
          </p>
        )}
      </div>
    </div>
  );
}
