import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, MessageSquare, LogOut, Sparkles } from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  return (
    <header style={{ borderBottom: '1px solid var(--border)', background: '#fff', position: 'sticky', top: 0, zIndex: 50 }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '4rem' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-main)' }}>
          <div style={{ background: 'var(--primary)', color: '#fff', padding: '0.5rem', borderRadius: '0.5rem', display: 'flex' }}>
            <BookOpen size={20} />
          </div>
          <span>Paper<span style={{ color: 'var(--primary)' }}>Mind</span></span>
        </Link>

        {user ? (
          <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>
              <BookOpen size={16} />
              Papers
            </Link>
            <Link to="/chat" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>
              <MessageSquare size={16} />
              Research Chat
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: '1rem', paddingLeft: '1rem', borderLeft: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>
                {user.username}
              </span>
              <button
                onClick={onLogout}
                className="btn btn-secondary"
                style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                title="Sign Out"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          </nav>
        ) : (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/login" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
