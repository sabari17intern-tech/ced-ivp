import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/common/Icon';
import { STAGES, stageLabel, stagePct, fmtDate, fmtMoney, getAppYear } from '../../services/utils';
import { exportApplicationsExcel } from '../../services/excelService';

const STAGE_PAGE_MAP = {
  registration: { page: 'applications', label: 'Applications Register' },
  bootcamp: { page: 'applications', label: 'Bootcamp Applicants' },
  ced_evaluation: { page: 'evaluations', label: 'CED Evaluation Panel' },
  data_collection: { page: 'applications', label: 'Data Collection Register' },
  ced_final: { page: 'evaluations', label: 'Final Evaluation Panel' },
  edi_evaluation: { page: 'edi', label: 'Grant Review Committee (EDI)' },
  approval: { page: 'grants', label: 'Grant Sanctions & Approval' },
  grant_phase1: { page: 'grants', label: 'Phase 1 Tranche Disbursements' },
  grant_phase2: { page: 'grants', label: 'Phase 2 Tranche Disbursements' },
  grant_phase3: { page: 'grants', label: 'Phase 3 Tranche Disbursements' },
  completed: { page: 'startups', label: 'Incubated Startups Directory' },
  // Compatibility aliases
  grant_review: { page: 'edi', label: 'Grant Review Committee (EDI)' },
  grant_approval: { page: 'grants', label: 'Grant Sanctions & Approval' },
  phase1: { page: 'grants', label: 'Phase 1 Tranche Disbursements' },
  phase2: { page: 'grants', label: 'Phase 2 Tranche Disbursements' },
  phase3: { page: 'grants', label: 'Phase 3 Tranche Disbursements' }
};

const WorkflowPipeline = () => {
  const { db, openDrawer, openModal, navigate } = useAuth();
  const [selectedStage, setSelectedStage] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('all');

  const applications = db.applications || [];

  const stageCounts = STAGES.reduce((acc, s) => {
    acc[s.key] = applications.filter(a => a.stage === s.key).length;
    return acc;
  }, {});

  const filteredApps = applications.filter(app => {
    if (selectedStage !== 'all' && app.stage !== selectedStage) return false;
    if (selectedBatch !== 'all' && app.batch !== selectedBatch) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = app.applicationId && app.applicationId.toLowerCase().includes(q);
      const matchName = app.applicantName && app.applicantName.toLowerCase().includes(q);
      const matchIdea = app.ideaName && app.ideaName.toLowerCase().includes(q);
      const matchPhone = app.phone && app.phone.includes(q);
      if (!matchId && !matchName && !matchIdea && !matchPhone) return false;
    }
    return true;
  });

  const todoItems = applications.filter(a => a.status === 'pending' || a.stage === 'registration' || a.stage === 'ced_evaluation');

  // Latest registered students — sorted newest first
  const latestRegistrations = [...applications]
    .sort((a, b) => {
      const da = a.createdDate ? new Date(a.createdDate) : new Date(0);
      const db2 = b.createdDate ? new Date(b.createdDate) : new Date(0);
      return db2 - da;
    })
    .slice(0, 6);

  const handleStageClick = (stageKey) => {
    const isSame = selectedStage === stageKey;
    setSelectedStage(isSame ? 'all' : stageKey);
    setTimeout(() => {
      document.getElementById('applicationsTableSection')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Grant Workflow Pipeline</h1>
          <div className="desc">Centre for Entrepreneurship Development &middot; Anna University</div>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => openModal('sendNotification')}
            title="Broadcast a targeted notification to students, batches, or stages"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Icon name="megaphone" size={14} style={{ color: 'var(--amber-700)' }} /> Send Notice
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => openModal('excelImport')}>
            <Icon name="upload" /> Bulk Import Excel
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => exportApplicationsExcel(filteredApps)}>
            <Icon name="download" /> Export Excel
          </button>
        </div>
      </div>

      {/* Pipeline Rail */}
      <div className="pipeline-wrap">
        <div className="pipeline-title">
          <h3>Grant Lifecycle Stages</h3>
          <div style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
            Total Applications: <strong>{applications.length}</strong> &middot; Click any stage (1&ndash;10) to view particulars
          </div>
        </div>
        <div className="pipeline-rail">
          {STAGES.map((s, idx) => {
            const count = stageCounts[s.key] || 0;
            const isSelected = selectedStage === s.key;
            return (
              <div
                key={s.key}
                className={`pipeline-stage ${count > 0 ? 'has-items' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => handleStageClick(s.key)}
                title={`Step ${idx + 1}: Click to filter ${s.label}`}
              >
                <div className="line" />
                <div className="node">
                  {idx + 1}
                </div>
                <span className="stage-lbl">{s.short}</span>
                <div className="stage-count">{count}</div>
                {isSelected && (
                  <button
                    className="stage-redirect-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(STAGE_PAGE_MAP[s.key]?.page || 'applications');
                    }}
                    title={`Redirect to ${STAGE_PAGE_MAP[s.key]?.label || 'Stage Particulars'}`}
                  >
                    Open View &rarr;
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Latest Registrations ── */}
      <div style={{ marginBottom: '22px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--navy-900), var(--navy-700))',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Icon name="members" size={16} style={{ color: '#fff' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', margin: 0 }}>Latest Registrations</h3>
              <div style={{ fontSize: '12px', color: 'var(--slate-400)', marginTop: '1px' }}>
                Most recently registered — newest first
              </div>
            </div>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('applications')}
          >
            View All &rarr;
          </button>
        </div>

        {applications.length === 0 ? (
          <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--slate-400)' }}>
            <Icon name="members" size={32} />
            <p style={{ marginTop: '10px', fontSize: '14px' }}>No registrations yet.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '12px'
          }}>
            {latestRegistrations.map((app, idx) => {
              const isNew = idx === 0;
              const stageColors = {
                registration: { bg: '#E8F6F9', border: 'var(--cyan-300)', dot: 'var(--cyan-600)' },
                bootcamp:     { bg: '#FEF3E2', border: '#F5D8A0',         dot: 'var(--warning)' },
                ced_evaluation: { bg: '#EFEBF9', border: '#D4C9F5',       dot: 'var(--violet)' },
              };
              const sc = stageColors[app.stage] || { bg: 'var(--slate-50)', border: 'var(--slate-200)', dot: 'var(--slate-400)' };

              return (
                <div
                  key={app.applicationId}
                  style={{
                    background: '#fff',
                    borderRadius: '12px',
                    border: `1.5px solid ${isNew ? 'var(--cyan-300)' : 'var(--slate-200)'}`,
                    padding: '16px',
                    boxShadow: isNew ? '0 4px 16px rgba(14,124,155,.12)' : 'var(--shadow-sm)',
                    position: 'relative',
                    transition: 'box-shadow .2s, border-color .2s',
                    cursor: 'default',
                  }}
                >
                  {/* NEW badge for the very latest */}
                  {isNew && (
                    <div style={{
                      position: 'absolute', top: '-1px', right: '12px',
                      background: 'var(--cyan-600)', color: '#fff',
                      fontSize: '10px', fontWeight: 700, letterSpacing: '.05em',
                      padding: '2px 8px', borderRadius: '0 0 6px 6px',
                      textTransform: 'uppercase'
                    }}>
                      Latest
                    </div>
                  )}

                  {/* Index badge + name row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                      background: isNew
                        ? 'linear-gradient(135deg, var(--navy-900), var(--navy-700))'
                        : 'var(--slate-100)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '13px', fontWeight: 700,
                      color: isNew ? '#fff' : 'var(--slate-500)',
                    }}>
                      {app.applicantName ? app.applicantName.charAt(0).toUpperCase() : '#'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 700, fontSize: '14px', color: 'var(--navy-900)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        {app.applicantName}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--slate-400)', fontFamily: 'var(--font-mono)', marginTop: '1px' }}>
                        {app.applicationId}
                      </div>
                    </div>
                  </div>

                  {/* Info pills row */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    {app.ideaName && (
                      <span style={{
                        fontSize: '11.5px', fontWeight: 600,
                        background: 'var(--navy-900)', color: '#fff',
                        padding: '2px 8px', borderRadius: '6px',
                        maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        {app.ideaName}
                      </span>
                    )}
                    {app.batch && (
                      <span style={{
                        fontSize: '11px', background: 'var(--slate-100)',
                        color: 'var(--slate-600)', padding: '2px 8px', borderRadius: '6px', fontWeight: 600
                      }}>
                        {app.batch}
                      </span>
                    )}
                  </div>

                  {/* Stage + Date row */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: sc.bg, borderRadius: '8px', padding: '7px 10px',
                    border: `1px solid ${sc.border}`, marginBottom: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        width: '7px', height: '7px', borderRadius: '50%',
                        background: sc.dot, flexShrink: 0
                      }} />
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-700)' }}>
                        {stageLabel(app.stage)}
                      </span>
                    </div>
                    <span style={{ fontSize: '11.5px', color: 'var(--slate-500)' }}>
                      {fmtDate(app.createdDate)}
                    </span>
                  </div>

                  {/* Phone + Action */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    {app.phone ? (
                      <span style={{ fontSize: '12px', color: 'var(--slate-500)', fontFamily: 'var(--font-mono)' }}>
                        📞 {app.phone}
                      </span>
                    ) : <span />}
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ flexShrink: 0 }}
                      onClick={() => openDrawer(app.applicationId)}
                    >
                      <Icon name="eye" /> View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* To Do Action Panel */}
      {todoItems.length > 0 && (
        <div className="table-card" style={{ marginBottom: '22px', borderLeft: '4px solid var(--cyan-600)' }}>
          <div className="table-toolbar">
            <h3 style={{ fontSize: '14.5px' }}>Action Required / Pending Today ({todoItems.length})</h3>
          </div>
          <div>
            {todoItems.slice(0, 5).map(app => (
              <div key={app.applicationId} className="todo-row">
                <div className="tr-main">
                  <div className="tr-top">
                    <span className="tr-name">{app.applicantName}</span>
                    <span className="tr-id">{app.applicationId}</span>
                  </div>
                  <div className="tr-what">
                    {app.stage === 'registration' ? 'Pending bootcamp attendance' : 'CED evaluation pending'}
                  </div>
                  <div className="tr-meta">{stageLabel(app.stage)} &middot; {app.ideaName || 'No idea name'}</div>
                </div>
                <div className="tr-open">
                  <button className="btn btn-primary btn-sm" onClick={() => openDrawer(app.applicationId)}>
                    <Icon name="eye" /> Open Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filterable Applications Table */}
      <div className="table-card" id="applicationsTableSection">
        {selectedStage !== 'all' && (
          <div className="callout callout-info" style={{ margin: '16px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="filter" />
              <div>
                <strong style={{ fontSize: '14px' }}>Filtered by Stage: {stageLabel(selectedStage)}</strong>
                <span style={{ marginLeft: '8px', color: 'var(--slate-600)', fontSize: '12.5px' }}>
                  ({filteredApps.length} application{filteredApps.length !== 1 ? 's' : ''} total)
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate(STAGE_PAGE_MAP[selectedStage]?.page || 'applications')}
              >
                <Icon name="arrowRight" /> Go to {STAGE_PAGE_MAP[selectedStage]?.label || 'Stage Particulars'} &rarr;
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedStage('all')}
              >
                Show All Stages
              </button>
            </div>
          </div>
        )}

        <div className="table-toolbar">
          <div className="topbar-search grow" style={{ maxWidth: '300px' }}>
            <Icon name="search" />
            <input
              type="text"
              placeholder="Search name, grant ID, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="tbl-filter"
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
          >
            <option value="all">All Stages ({applications.length})</option>
            {STAGES.map(s => (
              <option key={s.key} value={s.key}>{s.label} ({stageCounts[s.key] || 0})</option>
            ))}
          </select>

          <select
            className="tbl-filter"
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
          >
            <option value="all">All Batches</option>
            {(db.meta.batches || ['2024-25', '2025-26', '2026-27']).map(b => (
              <option key={b} value={b}>Batch {b}</option>
            ))}
          </select>
        </div>

        <div className="tbl-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Grant ID</th>
                <th>Year / Batch</th>
                <th>Applicant Name</th>
                <th>Idea / Startup</th>
                <th>Sector</th>
                <th>Stage</th>
                <th>Sanctioned Amount</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.length > 0 ? (
                filteredApps.map(app => {
                  const yr = getAppYear(app);
                  return (
                    <tr key={app.applicationId}>
                      <td className="cell-id">{app.applicationId}</td>
                      <td>
                        <span className={`badge ${yr === '2026' ? 'badge-info' : yr === '2025' ? 'badge-warning' : 'badge-neutral'}`}>
                          {yr} ({app.batch || '2026-27'})
                        </span>
                      </td>
                      <td className="cell-strong">{app.applicantName}</td>
                      <td>{app.ideaName || '—'}</td>
                      <td>{app.sector || '—'}</td>
                      <td>
                        <span className="badge badge-info">{stageLabel(app.stage)}</span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--success)' }}>
                        {app.grant && app.grant.approvedAmount ? fmtMoney(app.grant.approvedAmount) : '—'}
                      </td>
                      <td>{fmtDate(app.lastUpdated)}</td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => openDrawer(app.applicationId)}>
                          <Icon name="eye" /> View Particulars
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="table-empty">
                    No applications match the selected stage filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WorkflowPipeline;
