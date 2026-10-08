import React, { useState, useEffect } from 'react';
import { Search, Plus, BookOpen, Layers, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';
import { papersAPI } from '../services/api';
import PaperCard from '../components/PaperCard';
import PaperUpload from '../components/PaperUpload';

export default function Dashboard() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [error, setError] = useState('');

  const fetchPapers = async (query = '') => {
    try {
      setLoading(true);
      const res = await papersAPI.list({ search: query || undefined });
      setPapers(res.data);
    } catch (err) {
      setError('Could not load papers. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    fetchPapers(val);
  };

  const handleDeletePaper = async (paperId) => {
    if (!window.confirm('Are you sure you want to delete this paper and its vector index?')) return;
    try {
      await papersAPI.delete(paperId);
      setPapers(papers.filter((p) => p.id !== paperId));
    } catch (err) {
      alert('Failed to delete paper');
    }
  };

  const handleUploadSuccess = (newPaper) => {
    setPapers([newPaper, ...papers]);
    setShowUpload(false);
  };

  const totalPages = papers.reduce((acc, p) => acc + (p.total_pages || 0), 0);
  const totalChunks = papers.reduce((acc, p) => acc + (p.total_chunks || 0), 0);

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Research Corpus Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage your literature library and indexed multi-agent vector corpora
          </p>
        </div>

        <button
          onClick={() => setShowUpload(!showUpload)}
          className="btn btn-primary"
        >
          <Plus size={16} />
          {showUpload ? 'Close Uploader' : 'Upload Research Paper'}
        </button>
      </div>

      {/* Quick Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#e0e7ff', color: 'var(--primary)', padding: '0.75rem', borderRadius: '0.5rem' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{papers.length}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Indexed Papers</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#dcfce7', color: '#16a34a', padding: '0.75rem', borderRadius: '0.5rem' }}>
            <Layers size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalChunks}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Semantic Vector Chunks</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#fef3c7', color: '#d97706', padding: '0.75rem', borderRadius: '0.5rem' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalPages}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Pages Processed</div>
          </div>
        </div>
      </div>

      {/* Upload Drawer / Accordion */}
      {showUpload && (
        <div style={{ animation: 'fadeIn 0.2s ease-in-out' }}>
          <PaperUpload onUploadSuccess={handleUploadSuccess} />
        </div>
      )}

      {/* Search Input */}
      <div className="card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Search size={18} color="var(--text-muted)" />
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Search papers by title or abstract keywords..."
          style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.9rem' }}
        />
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', fontSize: '0.9rem' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Papers Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
          <p>Loading your research papers...</p>
        </div>
      ) : papers.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <BookOpen size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>No Papers Found</h3>
          <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Upload your first PDF to enable semantic chunking and RAG agent capabilities.
          </p>
          <button
            onClick={() => setShowUpload(true)}
            className="btn btn-primary"
            style={{ marginTop: '1rem' }}
          >
            <Plus size={16} />
            Upload PDF Now
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {papers.map((paper) => (
            <PaperCard key={paper.id} paper={paper} onDelete={handleDeletePaper} />
          ))}
        </div>
      )}
    </div>
  );
}
