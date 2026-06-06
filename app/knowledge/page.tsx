'use client';

import './knowledge.css';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type DocType = 'playbook' | 'past_contract' | 'template' | 'policy';

type DocSummary = {
  overview: string;
  keyPositions: string[];
  nonNegotiables: string[];
  favorableTerms: string[];
  watchPoints: string[];
};

type KnowledgeDocument = {
  id: string;
  file_name: string;
  document_type: DocType;
  summary: DocSummary | null;
  created_at: string;
};

const DOC_TYPES: { value: DocType; label: string }[] = [
  { value: 'playbook',      label: 'Playbook'       },
  { value: 'past_contract', label: 'Past Contract'  },
  { value: 'template',      label: 'Template'       },
  { value: 'policy',        label: 'Policy'         },
];

const TYPE_LABELS: Record<DocType, string> = {
  playbook:      'Playbook',
  past_contract: 'Past Contract',
  template:      'Template',
  policy:        'Policy',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const SUM_SECTIONS: { key: keyof Omit<DocSummary, 'overview'>; label: string }[] = [
  { key: 'keyPositions',   label: 'Key Positions'    },
  { key: 'nonNegotiables', label: 'Non-Negotiables'  },
  { key: 'favorableTerms', label: 'Favorable Terms'  },
  { key: 'watchPoints',    label: 'Watch Points'     },
];

export default function KnowledgePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [docType, setDocType] = useState<DocType>('playbook');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ kind: 'idle' | 'processing' | 'error' | 'success'; msg: string }>({ kind: 'idle', msg: '' });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Auth check + load documents
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/auth'); return; }
      setAccessToken(session.access_token);
      setUserEmail(session.user.email ?? null);
      await loadDocuments();
    });
  }, [router]);

  const loadDocuments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('knowledge_documents')
      .select('id, file_name, document_type, summary, created_at')
      .order('created_at', { ascending: false });

    if (!error && data) setDocuments(data as KnowledgeDocument[]);
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setUploadStatus({ kind: 'idle', msg: '' });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0] ?? null;
    if (file) { setSelectedFile(file); setUploadStatus({ kind: 'idle', msg: '' }); }
  };

  const handleUpload = async () => {
    if (!selectedFile || !accessToken) return;
    setUploading(true);
    setUploadStatus({ kind: 'processing', msg: 'Extracting text and analysing with AI…' });

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('documentType', docType);
      formData.append('accessToken', accessToken);

      const res = await fetch('/api/knowledge/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? 'Upload failed.');

      setUploadStatus({ kind: 'success', msg: 'Document added to your knowledge base.' });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadDocuments();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      setUploadStatus({ kind: 'error', msg });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Remove this document from your knowledge base?')) return;
    setDeletingId(id);
    const { error } = await supabase.from('knowledge_documents').delete().eq('id', id);
    if (!error) {
      setDocuments(prev => prev.filter(d => d.id !== id));
      if (expandedId === id) setExpandedId(null);
    }
    setDeletingId(null);
  };

  if (loading) return <div className="kb-loading">Loading knowledge base…</div>;

  return (
    <div className="kb-root">
      {/* Nav */}
      <nav className="kb-nav">
        <div className="kb-nav-inner">
          <Link href="/" className="kb-brand">
            <div className="kb-badge">§</div>
            <div className="kb-brand-name">ClausePal</div>
          </Link>
          <div className="kb-nav-right">
            <Link href="/analyze" className="kb-pill">Analyze</Link>
            <Link href="/history" className="kb-pill">History</Link>
            <Link href="/knowledge" className="kb-pill active">Knowledge</Link>
            <button
              type="button"
              className="kb-pill"
              onClick={() => supabase.auth.signOut().then(() => router.push('/auth'))}
            >
              Sign out
            </button>
            {userEmail && <div className="kb-avatar">{userEmail[0].toUpperCase()}</div>}
          </div>
        </div>
      </nav>

      <div className="kb-page">
        {/* Header */}
        <div className="kb-eyebrow">Knowledge Base · {documents.length} {documents.length === 1 ? 'document' : 'documents'}</div>
        <h1 className="kb-h1">Your legal <em>knowledge base.</em></h1>
        <p className="kb-sub">
          Upload your playbooks, past contracts, templates, and policies. ClausePal reads them
          to calibrate every future analysis to your standards.
        </p>

        {/* Upload card */}
        <div className="kb-upload-card">
          <div className="kb-upload-card-title">Add a document</div>

          {/* Document type selector */}
          <div className="kb-type-chips">
            {DOC_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                className={`kb-type-chip${docType === t.value ? ' active' : ''}`}
                onClick={() => setDocType(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Drop zone */}
          <div
            className={`kb-dropzone${dragOver ? ' drag-over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.csv,.xlsx"
              onChange={handleFileChange}
              onClick={e => e.stopPropagation()}
            />
            {selectedFile ? (
              <div className="kb-dz-file-selected">
                <span>§</span>
                <span>{selectedFile.name}</span>
                <span style={{ color: 'rgba(26,22,18,.4)', fontSize: 12 }}>
                  {(selectedFile.size / 1024).toFixed(0)} KB
                </span>
              </div>
            ) : (
              <>
                <div className="kb-dz-icon">§</div>
                <div className="kb-dz-label">Click to choose a file, or drag it here</div>
                <div className="kb-dz-sub">PDF, TXT, CSV, XLSX · max 10 MB</div>
              </>
            )}
          </div>

          {/* Upload controls */}
          <div className="kb-upload-row">
            <button
              type="button"
              className="kb-upload-btn"
              disabled={!selectedFile || uploading}
              onClick={handleUpload}
            >
              {uploading ? 'Analysing…' : 'Add to Knowledge Base →'}
            </button>

            {uploadStatus.kind !== 'idle' && (
              <span className={`kb-upload-status${uploadStatus.kind === 'error' ? ' error' : uploadStatus.kind === 'success' ? ' success' : ''}`}>
                {uploadStatus.kind === 'processing' && (
                  <span style={{ animation: 'pulse 1.5s infinite', opacity: .7 }}>▋</span>
                )}
                {uploadStatus.msg}
              </span>
            )}
          </div>
        </div>

        {/* Documents list */}
        <div className="kb-section-head">
          <span className="kb-section-label">Uploaded Documents</span>
          {documents.length > 0 && (
            <span className="kb-doc-count">{documents.length} total</span>
          )}
        </div>

        {documents.length === 0 ? (
          <div className="kb-empty">
            <div className="kb-empty-icon">§</div>
            <div className="kb-empty-title">No documents yet</div>
            <div className="kb-empty-sub">Upload your first document above to build your knowledge base.</div>
          </div>
        ) : (
          <div>
            {documents.map(doc => {
              const isExpanded = expandedId === doc.id;
              const isDeleting = deletingId === doc.id;

              return (
                <div key={doc.id} className="kb-doc-card">
                  <button
                    type="button"
                    className="kb-doc-header"
                    onClick={() => setExpandedId(isExpanded ? null : doc.id)}
                  >
                    <div className="kb-doc-icon">§</div>

                    <div className="kb-doc-main">
                      <div className="kb-doc-name">{doc.file_name}</div>
                      <div className="kb-doc-meta">
                        <span className={`kb-doc-type t-${doc.document_type}`}>
                          {TYPE_LABELS[doc.document_type]}
                        </span>
                        <span className="kb-doc-date">{formatDate(doc.created_at)}</span>
                        {(doc.summary?.keyPositions?.length ?? 0) > 0 && (
                          <span className="kb-doc-date">
                            {doc.summary!.keyPositions.length} key positions
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="kb-delete-btn"
                      disabled={isDeleting}
                      onClick={e => handleDelete(doc.id, e)}
                    >
                      {isDeleting ? '…' : 'Remove'}
                    </button>

                    {isExpanded
                      ? <ChevronUp className="kb-chevron" style={{ width: 16, height: 16 }} />
                      : <ChevronDown className="kb-chevron" style={{ width: 16, height: 16 }} />
                    }
                  </button>

                  {isExpanded && doc.summary && (
                    <div className="kb-summary">
                      {doc.summary.overview && (
                        <p className="kb-summary-overview">{doc.summary.overview}</p>
                      )}
                      {SUM_SECTIONS.map(({ key, label }) => {
                        const items = doc.summary![key];
                        if (!items || items.length === 0) return null;
                        return (
                          <div key={key} className="kb-sum-section">
                            <div className="kb-sum-label">{label}</div>
                            <ul className="kb-sum-list">
                              {items.map((item, i) => (
                                <li key={i}>
                                  <span className="kb-sum-bullet">·</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
