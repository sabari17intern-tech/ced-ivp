import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/common/Icon';
import { DOCUMENT_SPECS, getDocLink } from '../Admin/DocumentsView';
import { todayISO } from '../../services/utils';

const MyDocuments = () => {
  const { db, updateDb, currentUser, showToast } = useAuth();

  const app = (db.applications || []).find(a => 
    (currentUser?.linkedApplicationId && a.applicationId === currentUser.linkedApplicationId) ||
    (a.phone && currentUser?.username && a.phone.replace(/\D/g, '').slice(-10) === currentUser.username.replace(/\D/g, '').slice(-10)) ||
    (currentUser?.name && a.applicantName === currentUser.name)
  );

  const [editingKey, setEditingKey] = useState(null);
  const [tempLink, setTempLink] = useState('');

  if (!app) {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
        <h3>No active application found</h3>
      </div>
    );
  }

  const handleStartEdit = (key, currentVal) => {
    setEditingKey(key);
    setTempLink(currentVal || '');
  };

  const handleSaveLink = (key) => {
    if (!tempLink.trim()) {
      showToast('Please enter a valid Google Drive / cloud URL.', 'warning');
      return;
    }

    const spec = DOCUMENT_SPECS.find(d => d.key === key);
    const specName = spec ? spec.name : key;
    const curData = app.data || {};

    const updatedApps = db.applications.map(a => {
      if (a.applicationId === app.applicationId) {
        return {
          ...a,
          [key]: tempLink.trim(),
          data: {
            ...curData,
            [key]: tempLink.trim(),
            ...(key === 'consentLetterLink' ? { consentLetter: true } : {}),
            ...(key === 'fundingTemplateLink' ? { fundingTemplate: true } : {})
          },
          history: [
            ...(a.history || []),
            {
              date: todayISO(),
              time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
              user: app.applicantName,
              action: `Attached Document Drive Link: ${specName}`,
              from: '',
              to: 'Uploaded',
              remarks: tempLink.trim()
            }
          ],
          lastUpdated: todayISO()
        };
      }
      return a;
    });

    updateDb({ ...db, applications: updatedApps });
    setEditingKey(null);
    setTempLink('');
    showToast(`Saved ${specName} Drive link!`, 'success');
  };

  const attachedCount = DOCUMENT_SPECS.filter(d => getDocLink(app, d.key)).length;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Uploaded Documents &amp; Presentation Drive Links</h1>
          <div className="desc">
            Grant ID: <strong style={{ fontFamily: 'var(--font-mono)' }}>{app.applicationId}</strong> &middot; Attach specific Google Drive links for your startup documentation.
          </div>
        </div>
        <div className="page-actions">
          <span className="badge badge-info" style={{ fontSize: '13px', padding: '6px 14px' }}>
            {attachedCount} of {DOCUMENT_SPECS.length} Documents Attached
          </span>
        </div>
      </div>

      {/* Helpful Google Drive Sharing Callout */}
      <div className="callout callout-info" style={{ marginBottom: '22px' }}>
        <Icon name="info" size={18} />
        <div style={{ fontSize: '13px', lineHeight: 1.5 }}>
          <strong>Google Drive Sharing Guide:</strong> Make sure your file sharing permissions are set to{' '}
          <strong style={{ color: 'var(--cyan-800)' }}>"Anyone with the link can view"</strong> so CED reviewers and committee evaluators can access and inspect your presentation slides, signed letters, and budget sheets without delay.
        </div>
      </div>

      {/* Grid of All Document Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
        {DOCUMENT_SPECS.map((spec, idx) => {
          const currentLink = getDocLink(app, spec.key);
          const isAttached = Boolean(currentLink);
          const isEditing = editingKey === spec.key;

          return (
            <div
              key={spec.key}
              className="card"
              style={{
                padding: '20px',
                background: '#fff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderTop: `3px solid ${isAttached ? 'var(--success)' : 'var(--warning)'}`,
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div>
                {/* Header: Title and Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '6px',
                      background: isAttached ? 'var(--success-bg)' : 'var(--slate-100)',
                      color: isAttached ? 'var(--success)' : 'var(--slate-500)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: 800
                    }}>
                      {idx + 1}
                    </div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--navy-900)', margin: 0 }}>
                      {spec.name}
                    </h3>
                  </div>

                  <span className={`badge ${isAttached ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '10.5px' }}>
                    {isAttached ? '✓ ATTACHED' : 'PENDING'}
                  </span>
                </div>

                {/* Description */}
                <p style={{ fontSize: '12.5px', color: 'var(--slate-500)', margin: '0 0 14px 0', lineHeight: 1.5 }}>
                  {spec.desc}
                </p>

                {/* Attached Link View */}
                {isAttached && !isEditing && (
                  <div style={{
                    background: 'var(--slate-50)',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--slate-200)',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px'
                  }}>
                    <a
                      href={currentLink}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: 'var(--cyan-700)',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        wordBreak: 'break-all',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Icon name="externalLink" size={13} /> Open Drive Link ↗
                    </a>

                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: 'var(--slate-400)', cursor: 'pointer', padding: '2px' }}
                      onClick={() => {
                        navigator.clipboard?.writeText(currentLink);
                        showToast(`Copied ${spec.shortName} link to clipboard`, 'info');
                      }}
                      title="Copy Link"
                    >
                      <Icon name="copy" size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Edit / Input Form or Action Buttons */}
              <div>
                {isEditing ? (
                  <div style={{
                    background: 'var(--cyan-50)',
                    border: '1px solid var(--cyan-500)',
                    padding: '12px',
                    borderRadius: '8px'
                  }}>
                    <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--navy-900)', display: 'block', marginBottom: '4px' }}>
                      Paste Google Drive / Cloud Link:
                    </label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/file/d/.../view"
                      value={tempLink}
                      onChange={e => setTempLink(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--slate-300)',
                        fontSize: '12.5px',
                        marginBottom: '8px'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        onClick={() => { setEditingKey(null); setTempLink(''); }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary btn-xs"
                        onClick={() => handleSaveLink(spec.key)}
                      >
                        <Icon name="save" size={12} /> Save Drive Link
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid var(--slate-100)' }}>
                    {isAttached ? (
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '12px' }}
                        onClick={() => handleStartEdit(spec.key, currentLink)}
                      >
                        <Icon name="edit" size={12} /> Update Link
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '12px' }}
                        onClick={() => handleStartEdit(spec.key, '')}
                      >
                        <Icon name="plus" size={12} /> Attach Drive Link
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyDocuments;
