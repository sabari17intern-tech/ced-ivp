import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/common/Icon';
import { fmtDate, stageLabel, getAppYear } from '../../services/utils';
import { exportApplicationsExcel } from '../../services/excelService';

const ApplicationsList = () => {
  const { db, openDrawer, openModal, trashApplications, navigate } = useAuth();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [selected, setSelected] = useState(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);

  const apps = db.applications || [];
  const filtered = apps.filter(a => {
    if (stageFilter !== 'all' && a.stage !== stageFilter) return false;
    if (yearFilter !== 'all' && getAppYear(a) !== yearFilter && a.batch !== yearFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        (a.applicantName && a.applicantName.toLowerCase().includes(q)) ||
        (a.applicationId && a.applicationId.toLowerCase().includes(q)) ||
        (a.ideaName && a.ideaName.toLowerCase().includes(q)) ||
        (a.phone && a.phone.includes(q))
      );
    }
    return true;
  });

  /* ── Selection helpers ── */
  const allFilteredIds = filtered.map(a => a.applicationId);
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selected.has(id));
  const someSelected = allFilteredIds.some(id => selected.has(id));
  const selectedCount = [...selected].filter(id => allFilteredIds.includes(id)).length;

  const toggleRow = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected(prev => {
        const next = new Set(prev);
        allFilteredIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelected(prev => {
        const next = new Set(prev);
        allFilteredIds.forEach(id => next.add(id));
        return next;
      });
    }
  };

  const handleTrash = () => {
    const ids = [...selected].filter(id => allFilteredIds.includes(id));
    if (!ids.length) return;
    trashApplications(ids);
    setSelected(new Set());
    setConfirmDelete(false);
  };

  const trashCount = (db.trash || []).length;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Applications Management ({apps.length})</h1>
          <div className="desc">Manage, review, and filter all grant applicants by year &amp; stage</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary btn-sm" onClick={() => openModal('addApp')}>
            <Icon name="plus" /> New Application
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => openModal('excelImport')}>
            <Icon name="upload" /> Bulk Import Excel
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => exportApplicationsExcel(filtered)}>
            <Icon name="download" /> Export Excel
          </button>
          {trashCount > 0 && (
            <button
              className="btn btn-secondary btn-sm"
              style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
              onClick={() => navigate('settings')}
              title="View trash in Settings"
            >
              <Icon name="trashBin" />
              Trash ({trashCount})
            </button>
          )}
        </div>
      </div>

      {/* ── Bulk-action bar (slides in when selection > 0) ── */}
      {selectedCount > 0 && (
        <div style={{
          background: 'var(--navy-900)', color: '#fff', borderRadius: '10px',
          padding: '12px 18px', marginBottom: '16px',
          display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap',
          boxShadow: '0 4px 16px rgba(10,34,64,.25)',
          animation: 'fadeIn .2s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '6px',
              background: 'rgba(255,255,255,.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Icon name="checkSquare" size={15} />
            </div>
            <span style={{ fontWeight: 700, fontSize: '14px' }}>
              {selectedCount} participant{selectedCount !== 1 ? 's' : ''} selected
            </span>
          </div>

          <div style={{ flex: 1, display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary btn-sm"
              style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', color: '#fff' }}
              onClick={() => setSelected(new Set())}
            >
              Clear Selection
            </button>

            {!confirmDelete ? (
              <button
                className="btn btn-sm"
                style={{
                  background: 'rgba(185,28,28,.85)', border: '1px solid rgba(185,28,28,.5)',
                  color: '#fff', display: 'flex', alignItems: 'center', gap: '6px'
                }}
                onClick={() => setConfirmDelete(true)}
              >
                <Icon name="trash" size={14} />
                Move to Trash
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,.8)' }}>
                  Confirm delete {selectedCount} record{selectedCount !== 1 ? 's' : ''}?
                </span>
                <button
                  className="btn btn-sm"
                  style={{ background: 'var(--danger)', border: 'none', color: '#fff', fontWeight: 700 }}
                  onClick={handleTrash}
                >
                  Yes, Move to Trash
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', color: '#fff' }}
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="table-card">
        <div className="table-toolbar">
          <div className="topbar-search grow" style={{ maxWidth: '300px' }}>
            <Icon name="search" />
            <input
              type="text"
              placeholder="Search Grant ID, name, idea..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select className="tbl-filter" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
            <option value="all">All Years / Batches</option>
            <option value="2026">2026 Cohort (Batch 2026-27)</option>
            <option value="2025">2025 Cohort (Batch 2025-26)</option>
            <option value="2024">2024 Cohort (Batch 2024-25)</option>
          </select>

          <select className="tbl-filter" value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
            <option value="all">All Stages</option>
            <option value="registration">Registration</option>
            <option value="bootcamp">Bootcamp</option>
            <option value="ced_evaluation">CED Evaluation</option>
            <option value="data_collection">Data Collection</option>
            <option value="ced_final">CED Final Evaluation</option>
            <option value="edi_evaluation">Grant Review</option>
            <option value="approval">Grant Approval</option>
          </select>
        </div>

        {/* Select-all info strip */}
        {someSelected && (
          <div style={{
            background: 'var(--cyan-50)', borderBottom: '1px solid var(--cyan-200)',
            padding: '8px 16px', fontSize: '13px', color: 'var(--cyan-700)',
            display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <Icon name="info" size={14} />
            <span>
              <strong>{selectedCount}</strong> of <strong>{filtered.length}</strong> visible rows selected.
            </span>
            {!allSelected && (
              <button
                style={{ color: 'var(--cyan-700)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '13px' }}
                onClick={toggleAll}
              >
                Select all {filtered.length} →
              </button>
            )}
            <button
              style={{ color: 'var(--slate-500)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '13px', marginLeft: 'auto' }}
              onClick={() => setSelected(new Set())}
            >
              Clear
            </button>
          </div>
        )}

        <div className="tbl-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                    onChange={toggleAll}
                    title={allSelected ? 'Deselect all' : 'Select all visible'}
                    style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: 'var(--cyan-600)' }}
                  />
                </th>
                <th>Grant ID</th>
                <th>Year / Batch</th>
                <th>Applicant Name</th>
                <th>Phone</th>
                <th>Idea / Startup</th>
                <th>Stage</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map(a => {
                  const yr = getAppYear(a);
                  const isSelected = selected.has(a.applicationId);
                  return (
                    <tr
                      key={a.applicationId}
                      style={{
                        background: isSelected ? 'var(--cyan-50)' : undefined,
                        outline: isSelected ? '1.5px solid var(--cyan-300)' : undefined,
                        outlineOffset: '-1px',
                      }}
                    >
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(a.applicationId)}
                          style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: 'var(--cyan-600)' }}
                        />
                      </td>
                      <td className="cell-id">{a.applicationId}</td>
                      <td>
                        <span className={`badge ${yr === '2026' ? 'badge-info' : yr === '2025' ? 'badge-warning' : 'badge-neutral'}`}>
                          {yr} ({a.batch || yr})
                        </span>
                      </td>
                      <td className="cell-strong">{a.applicantName}</td>
                      <td>{a.phone}</td>
                      <td>{a.ideaName || '—'}</td>
                      <td><span className="badge badge-info">{stageLabel(a.stage)}</span></td>
                      <td><span className={`badge ${a.status === 'selected' ? 'badge-success' : 'badge-neutral'}`}>{a.status}</span></td>
                      <td>{fmtDate(a.createdDate)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openDrawer(a.applicationId)}>
                            <Icon name="eye" /> View
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--danger)' }}
                            title="Move to trash"
                            onClick={() => {
                              setSelected(new Set([a.applicationId]));
                              setConfirmDelete(true);
                              setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                            }}
                          >
                            <Icon name="trash" size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="10" className="table-empty">
                    No applications found for the selected search and year filters.
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

export default ApplicationsList;
