import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/common/Icon';
import { stageLabel, getAppYear, todayISO } from '../../services/utils';

export const DOCUMENT_SPECS = [
  {
    key: 'pitchLink',
    docKey: 'pitchDeck',
    name: 'Presentation Pitch Deck',
    shortName: 'Pitch Deck',
    badgeClass: 'badge-info',
    desc: 'Startup presentation slide deck covering Problem, Solution, Tech & Budget.'
  },
  {
    key: 'consentLetterLink',
    docKey: 'consentLetter',
    name: 'College Consent Letter',
    shortName: 'Consent Letter',
    badgeClass: 'badge-warning',
    desc: 'Signed approval letter from Principal / HOD with institutional seal.'
  },
  {
    key: 'fundingTemplateLink',
    docKey: 'fundingTemplate',
    name: 'Detailed Budget Template',
    shortName: 'Budget Template',
    badgeClass: 'badge-neutral',
    desc: 'Itemized funding expenditure breakdown template for grant funds.'
  },
  {
    key: 'udyamCertLink',
    docKey: 'udyamCert',
    name: 'MSME Udyam Certificate',
    shortName: 'MSME Cert',
    badgeClass: 'badge-neutral',
    desc: 'Government of India MSME Udyam Certificate PDF.'
  },
  {
    key: 'bankProofLink',
    docKey: 'bankProof',
    name: 'Bank Passbook / Cheque Proof',
    shortName: 'Bank Proof',
    badgeClass: 'badge-success',
    desc: 'Cancelled cheque or passbook proof for Direct Benefit Transfer.'
  },
  {
    key: 'prototypeLink',
    docKey: 'prototype',
    name: 'Working Prototype Demo / Video',
    shortName: 'Prototype Demo',
    badgeClass: 'badge-info',
    desc: 'Drive video or photos showing working prototype demonstration.'
  }
];

export const getDocLink = (app, specKey) => {
  if (!app) return '';
  if (app[specKey]) return app[specKey];
  if (app.data && app.data[specKey]) return app.data[specKey];
  if (app.documents && typeof app.documents === 'object' && app.documents[specKey]) return app.documents[specKey];
  // Backward compatibility aliases
  if (specKey === 'consentLetterLink' && app.data && app.data.consentLetterFile) return app.data.consentLetterFile;
  if (specKey === 'fundingTemplateLink' && app.data && app.data.fundingTemplateFile) return app.data.fundingTemplateFile;
  return '';
};

const DocumentsView = () => {
  const { db, updateDb, openDrawer, openModal, showToast } = useAuth();
  const applications = db.applications || [];

  const [search, setSearch] = useState('');
  const [docFilter, setDocFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'has_docs' | 'missing_docs'
  const [editingAppId, setEditingAppId] = useState(null);
  const [editingDocKey, setEditingDocKey] = useState('pitchLink');
  const [newLinkVal, setNewLinkVal] = useState('');

  // Statistics
  const pitchCount = applications.filter(a => getDocLink(a, 'pitchLink')).length;
  const consentCount = applications.filter(a => getDocLink(a, 'consentLetterLink') || a.data?.consentLetter).length;
  const budgetCount = applications.filter(a => getDocLink(a, 'fundingTemplateLink') || a.data?.fundingTemplate).length;
  const bankCount = applications.filter(a => getDocLink(a, 'bankProofLink') || a.bank?.accountNumber).length;

  const filtered = applications.filter(a => {
    if (statusFilter === 'has_docs') {
      const hasAny = DOCUMENT_SPECS.some(d => getDocLink(a, d.key));
      if (!hasAny) return false;
    }
    if (statusFilter === 'missing_docs') {
      const hasAll = getDocLink(a, 'pitchLink') && getDocLink(a, 'consentLetterLink') && getDocLink(a, 'fundingTemplateLink');
      if (hasAll) return false;
    }
    if (docFilter !== 'all') {
      if (!getDocLink(a, docFilter)) return false;
    }

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (a.applicantName && a.applicantName.toLowerCase().includes(q)) ||
      (a.ideaName && a.ideaName.toLowerCase().includes(q)) ||
      (a.applicationId && a.applicationId.toLowerCase().includes(q)) ||
      (a.phone && a.phone.includes(q))
    );
  });

  const handleSaveDocLink = (appId) => {
    if (!newLinkVal.trim()) return;

    const updatedApps = db.applications.map(a => {
      if (a.applicationId === appId) {
        const spec = DOCUMENT_SPECS.find(d => d.key === editingDocKey);
        const specName = spec ? spec.name : editingDocKey;
        const curData = a.data || {};

        return {
          ...a,
          [editingDocKey]: newLinkVal.trim(),
          data: {
            ...curData,
            [editingDocKey]: newLinkVal.trim(),
            ...(editingDocKey === 'consentLetterLink' ? { consentLetter: true } : {}),
            ...(editingDocKey === 'fundingTemplateLink' ? { fundingTemplate: true } : {})
          },
          history: [
            ...(a.history || []),
            {
              date: todayISO(),
              time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
              user: 'Admin',
              action: `Document Link Attached: ${specName}`,
              from: '',
              to: 'Drive Link',
              remarks: newLinkVal.trim()
            }
          ],
          lastUpdated: todayISO()
        };
      }
      return a;
    });

    updateDb({ ...db, applications: updatedApps });
    setEditingAppId(null);
    setNewLinkVal('');
    showToast('Drive link attached successfully.', 'success');
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Student Documents &amp; Drive Links Repository</h1>
          <div className="desc">
            Organized repository of specific Google Drive / cloud links attached per startup: Pitch Decks, Consent Letters, Budget Templates &amp; MSME Certificates.
          </div>
        </div>

        <div className="page-actions">
          <button
            className="btn btn-primary btn-sm"
            onClick={() => openModal('sendNotification', {
              targetType: 'all',
              targetValue: '',
            })}
          >
            <Icon name="megaphone" size={14} /> Send Document Reminder
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="stat-grid" style={{ marginBottom: '22px' }}>
        <div className="stat-card">
          <div className="icn" style={{ background: 'var(--cyan-50)', color: 'var(--cyan-700)' }}>
            <Icon name="file" />
          </div>
          <div className="val">{pitchCount} / {applications.length}</div>
          <div className="lbl">Pitch Decks Attached</div>
        </div>

        <div className="stat-card">
          <div className="icn" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
            <Icon name="checkSquare" />
          </div>
          <div className="val">{consentCount} / {applications.length}</div>
          <div className="lbl">Consent Letters Submitted</div>
        </div>

        <div className="stat-card">
          <div className="icn" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--violet)' }}>
            <Icon name="clipboardList" />
          </div>
          <div className="val">{budgetCount} / {applications.length}</div>
          <div className="lbl">Budget Templates Submitted</div>
        </div>

        <div className="stat-card">
          <div className="icn" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
            <Icon name="bank" />
          </div>
          <div className="val">{bankCount} / {applications.length}</div>
          <div className="lbl">Bank Proofs / Details Provided</div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div style={{
        background: '#fff',
        padding: '16px 20px',
        borderRadius: '12px',
        border: '1px solid var(--slate-200)',
        marginBottom: '22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div className="topbar-search" style={{ maxWidth: '340px', flex: 1, minWidth: '220px' }}>
          <Icon name="search" />
          <input
            type="text"
            placeholder="Search startup name, founder, ID, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="tbl-filter"
            value={docFilter}
            onChange={(e) => setDocFilter(e.target.value)}
          >
            <option value="all">All Document Types</option>
            {DOCUMENT_SPECS.map(d => (
              <option key={d.key} value={d.key}>Filter: Has {d.shortName}</option>
            ))}
          </select>

          <select
            className="tbl-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Submission Statuses</option>
            <option value="has_docs">Has Drive Links Attached</option>
            <option value="missing_docs">Pending / Missing Required Docs</option>
          </select>

          {(search || docFilter !== 'all' || statusFilter !== 'all') && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { setSearch(''); setDocFilter('all'); setStatusFilter('all'); }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Applications Document List */}
      {filtered.length === 0 ? (
        <div className="table-empty" style={{ padding: '60px 20px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid var(--slate-200)' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📁</div>
          <h3 style={{ fontSize: '16px', color: 'var(--navy-900)', margin: '0 0 6px 0' }}>No Document Records Found</h3>
          <p style={{ color: 'var(--slate-500)', fontSize: '13px', margin: 0 }}>Try clearing filters or searching for another student.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.map(app => {
            const yr = getAppYear(app);
            const isEditingThis = editingAppId === app.applicationId;

            return (
              <div
                key={app.applicationId}
                className="card"
                style={{
                  padding: '20px',
                  background: '#fff',
                  borderTop: '3px solid var(--navy-800)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {/* Header row: Startup name, Founder, Stage, Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px', color: 'var(--cyan-700)', fontWeight: 700 }}>
                        {app.applicationId}
                      </span>
                      <span className="badge badge-info">{yr}</span>
                      <span className="sc-stage" style={{ fontSize: '11px', padding: '2px 8px' }}>
                        {stageLabel(app.stage)}
                      </span>
                      {app.registration?.udyamNumber && (
                        <span className="badge badge-neutral" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                          MSME: {app.registration.udyamNumber}
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy-900)', margin: '0 0 4px 0' }}>
                      {app.ideaName || app.applicantName}
                    </h3>
                    <div style={{ fontSize: '12.5px', color: 'var(--slate-500)' }}>
                      Founder: <strong>{app.applicantName}</strong> &middot; 📞 {app.phone} &middot; 🏫 {app.college || 'Anna University'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => openDrawer(app.applicationId)}
                    >
                      <Icon name="eye" size={13} /> View Full Drawer
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setEditingAppId(app.applicationId);
                        setEditingDocKey('pitchLink');
                        setNewLinkVal(getDocLink(app, 'pitchLink'));
                      }}
                    >
                      <Icon name="plus" size={13} /> Attach / Edit Link
                    </button>
                  </div>
                </div>

                {/* Inline Attach Link Bar (when active) */}
                {isEditingThis && (
                  <div style={{
                    background: 'var(--cyan-50)',
                    border: '1.5px solid var(--cyan-500)',
                    padding: '14px 16px',
                    borderRadius: '8px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--navy-900)', marginBottom: '8px' }}>
                      Attach Specific Google Drive / Cloud Link:
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <select
                        value={editingDocKey}
                        onChange={e => {
                          setEditingDocKey(e.target.value);
                          setNewLinkVal(getDocLink(app, e.target.value));
                        }}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--slate-300)', fontWeight: 600, fontSize: '13px', minWidth: '220px' }}
                      >
                        {DOCUMENT_SPECS.map(d => (
                          <option key={d.key} value={d.key}>{d.name}</option>
                        ))}
                      </select>

                      <input
                        type="url"
                        placeholder="https://drive.google.com/file/d/.../view"
                        value={newLinkVal}
                        onChange={e => setNewLinkVal(e.target.value)}
                        style={{ flex: 1, minWidth: '260px', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--slate-300)', fontSize: '13px' }}
                      />

                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleSaveDocLink(app.applicationId)}
                      >
                        <Icon name="save" size={13} /> Save Link
                      </button>

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setEditingAppId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Specific Documents Grid (What Doc — Link Accordingly) */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
                  gap: '10px'
                }}>
                  {DOCUMENT_SPECS.map(spec => {
                    const link = getDocLink(app, spec.key);
                    const isAttached = Boolean(link);

                    return (
                      <div
                        key={spec.key}
                        style={{
                          background: isAttached ? '#f8fafc' : '#fff',
                          border: isAttached ? '1px solid var(--slate-200)' : '1px dashed var(--slate-300)',
                          borderRadius: '8px',
                          padding: '12px 14px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '8px'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--navy-900)' }}>
                              {spec.name}
                            </span>
                            <span className={`badge ${isAttached ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                              {isAttached ? '✓ LINKED' : 'PENDING'}
                            </span>
                          </div>

                          <div style={{ fontSize: '11px', color: 'var(--slate-400)', lineHeight: 1.4, marginBottom: '6px' }}>
                            {spec.desc}
                          </div>
                        </div>

                        {isAttached ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', paddingTop: '6px', borderTop: '1px solid var(--slate-100)' }}>
                            <a
                              href={link}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary btn-xs"
                              style={{
                                color: 'var(--cyan-700)',
                                textDecoration: 'none',
                                fontWeight: 700,
                                fontSize: '11.5px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Icon name="externalLink" size={12} /> Open Drive Link ↗
                            </a>

                            <button
                              type="button"
                              className="btn btn-xs"
                              style={{ background: 'none', border: 'none', color: 'var(--slate-400)', cursor: 'pointer' }}
                              onClick={() => {
                                navigator.clipboard?.writeText(link);
                                showToast(`Copied ${spec.shortName} link to clipboard`, 'info');
                              }}
                              title="Copy Drive link"
                            >
                              <Icon name="copy" size={13} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px dashed var(--slate-200)' }}>
                            <span style={{ fontSize: '11px', color: 'var(--slate-400)', fontStyle: 'italic' }}>
                              No link uploaded
                            </span>
                            <button
                              type="button"
                              className="btn btn-secondary btn-xs"
                              style={{ fontSize: '11px', padding: '2px 8px' }}
                              onClick={() => {
                                setEditingAppId(app.applicationId);
                                setEditingDocKey(spec.key);
                                setNewLinkVal('');
                              }}
                            >
                              + Attach Link
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DocumentsView;
