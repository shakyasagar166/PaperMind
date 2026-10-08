import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { papersAPI } from '../services/api';

export default function PaperUpload({ onUploadSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Please upload a valid PDF document.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setIsUploading(true);
    setUploadProgress(10);

    try {
      const response = await papersAPI.upload(file, (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 90) / progressEvent.total
        );
        setUploadProgress(percentCompleted);
      });

      setUploadProgress(100);
      setSuccessMsg(`"${file.name}" indexed successfully!`);
      if (onUploadSuccess) {
        onUploadSuccess(response.data);
      }
    } catch (err) {
      setErrorMsg(
        err.response?.data?.detail || 'Failed to upload and parse paper.'
      );
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 3000);
    }
  };

  return (
    <div className="card" style={{ padding: '1.5rem', background: '#ffffff' }}>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--border)'}`,
          backgroundColor: isDragging ? 'var(--primary-light)' : '#f8fafc',
          borderRadius: '0.75rem',
          padding: '2.5rem 1.5rem',
          textAlign: 'center',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          style={{ display: 'none' }}
          onChange={handleFileChange}
          disabled={isUploading}
        />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            padding: '1rem',
            borderRadius: '9999px',
            display: 'flex'
          }}>
            {isUploading ? (
              <Loader2 size={32} className="animate-spin" />
            ) : (
              <UploadCloud size={32} />
            )}
          </div>

          <div>
            <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-main)' }}>
              {isUploading ? 'Ingesting & Chunking Research Paper...' : 'Click or drag PDF here to upload'}
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Academic papers, preprints, conference proceedings (PDF up to 50MB)
            </p>
          </div>
        </div>

        {uploadProgress > 0 && (
          <div style={{ marginTop: '1.25rem', width: '100%', maxWidth: '300px', margin: '1.25rem auto 0' }}>
            <div style={{ background: '#e2e8f0', borderRadius: '9999px', height: '6px', overflow: 'hidden' }}>
              <div
                style={{
                  background: 'var(--primary)',
                  height: '100%',
                  width: `${uploadProgress}%`,
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {uploadProgress}% processed
            </p>
          </div>
        )}
      </div>

      {errorMsg && (
        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', fontSize: '0.875rem' }}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontSize: '0.875rem' }}>
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  );
}
