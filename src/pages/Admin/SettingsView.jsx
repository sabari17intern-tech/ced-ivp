import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/common/Icon';
import { downloadTextFile } from '../../services/excelService';
import { todayISO, fmtDate } from '../../services/utils';

const SettingsView = () => {
  const { db, updateDb, showToast, restoreApplications, permanentDeleteApplications } = useAuth();
  const [currentBatch, setCurrentBatch] = useState(db.meta ? db.meta.currentBatch || '2026-27' : '2026-27');

  // Trash state
  const trash = db.trash || [];
  const [trashSelected, setTrashSelected] = useState(new Set());
  const [confirmPermanent, setConfirmPermanent] = useState(false);
  const [trashSearch, setTrashSearch] = useState('');

  const filteredTrash = trash.filter(a => {
    if (!trashSearch.trim()) return true;
    const q = trashSearch.toLowerCase();
    return (
      (a.applicantName && a.applicantName.toLowerCase().includes(q)) ||
      (a.applicationId && a.applicationId.toLowerCase().includes(q)) ||
      (a.phone && a.phone.includes(q))
    );
  });

  const allTrashIds = filteredTrash.map(a => a.applicationId);
  const allTrashSelected = allTrashIds.length > 0 && allTrashIds.every(id => trashSelected.has(id));
  const someTrashSelected = allTrashIds.some(id => trashSelected.has(id));
  const trashSelectedCount = [...trashSelected].filter(id => allTrashIds.includes(id)).length;

  const toggleTrashRow = (id) => {
    setTrashSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAllTrash = () => {
    if (allTrashSelected) {
      setTrashSelected(prev => {
        const next = new Set(prev);
        allTrashIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setTrashSelected(prev => {
        const next = new Set(prev);
        allTrashIds.forEach(id => next.add(id));
        return next;
      });
    }
  };

  const handleRestore = () => {
    const ids = [...trashSelected].filter(id => allTrashIds.includes(id));
    if (!ids.length) return;
    restoreApplications(ids);
    setTrashSelected(new Set());
  };

  const handlePermanentDelete = () => {
    const ids = [...trashSelected].filter(id => allTrashIds.includes(id));
    if (!ids.length) return;
    permanentDeleteApplications(ids);
    setTrashSelected(new Set());
    setConfirmPermanent(false);
  };

  const handleEmptyTrash = () => {
    permanentDeleteApplications(trash.map(a => a.applicationId));
    setTrashSelected(new Set());
    setConfirmPermanent(false);
  };

  /* ── Backup handlers ── */
  const handleExportBackup = () => {
    const json = JSON.stringify(db, null, 2);
    downloadTextFile(`ced-grant-backup-${todayISO()}.json`, json, 'application/json');
    showToast('Database exported successfully as JSON.', 'success');
  };

  const handleRestoreBackup = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed && Array.isArray(parsed.applications) && Array.isArray(parsed.members)) {
          updateDb(parsed);
          showToast('Database restored successfully from backup.', 'success');
        } else {
          showToast('Invalid backup file format.', 'danger');
        }
      } catch (err) {
        showToast('Could not parse backup JSON file.', 'danger');
      }
    };
    reader.readAsText(file);
  };

  const handleSaveBatch = () => {
    updateDb({ ...db, meta: { ...db.meta, currentBatch } });
    showToast('Batch settings saved.', 'success');
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>System Settings &amp; Database Backups</h1>
          <div className="desc">Manage database state, backup JSON exports, batch cohorts &amp; trash</div>
        </div>
      </div>

      {/* ── Top settings grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '28px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>Database Backup &amp; Restore</h3>
          <p style={{ fontSize: '13px', color: 'var(--slate-500)', marginBottom: '16px' }}>
            Export full JSON database snapshot containing all applications, scores, sanction letters, and audit logs.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary" onClick={handleExportBackup}>
              <Icon name="download" /> Export Full Database JSON
            </button>
            <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
              <Icon name="upload" /> Restore JSON
              <input type="file" accept=".json" style={{ display: 'none' }} onChange={(e) => handleRestoreBackup(e.target.files[0])} />
            </label>
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>Batch / Cohort Configuration</h3>
          <p style={{ fontSize: '13px', color: 'var(--slate-500)', marginBottom: '14px' }}>
            Active Batch Cohort assigned to newly self-registering student applications.
          </p>
          <div className="form-field" style={{ marginBottom: '14px' }}>
            <label>Current Active Batch</label>
            <input type="text" value={currentBatch} onChange={(e) => setCurrentBatch(e.target.value)} />
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleSaveBatch}>
            <Icon name="save" /> Save Batch Setting
          </button>
        </div>
      </div>

      {/* ── Trash Management ── */}
      <div className="table-card" style={{ borderTop: '3px solid var(--danger)' }}>
        {/* Header */}
        <div style={{
          padding: '18px 20px',
          borderBottom: '1px solid var(--slate-200)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '8px',
              background: 'var(--danger-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--danger-border)'
            }}>
              <Icon name="trashBin" size={18} style={{ color: 'var(--danger)' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', margin: 0 }}>
                Trash
                {trash.length > 0 && (
                  <span style={{
                    marginLeft: '8px', fontSize: '12px', fontWeight: 700,
                    background: 'var(--danger)', color: '#fff',
                    padding: '2px 8px', borderRadius: '999px'
                  }}>
                    {trash.length}
                  </span>
                )}
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--slate-400)', marginTop: '2px' }}>
                Deleted participants are held here. Restore to recover, or permanently delete.
              </div>
            </div>
          </div>

          {trash.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div className="topbar-search" style={{ maxWidth: '200px' }}>
                <Icon name="search" />
                <input
                  type="text"
                  placeholder="Search trash..."
                  value={trashSearch}
                  onChange={e => setTrashSearch(e.target.value)}
                />
              </div>
              {!confirmPermanent ? (
                <button
                  className="btn btn-sm"
                  style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger-border)', fontWeight: 700 }}
                  onClick={() => setConfirmPermanent(true)}
                >
                  <Icon name="trashBin" size={13} /> Empty Trash
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12.5px', color: 'var(--danger)', fontWeight: 600 }}>
                    Permanently delete all {trash.length} records?
                  </span>
                  <button
                    className="btn btn-sm"
                    style={{ background: 'var(--danger)', color: '#fff', border: 'none', fontWeight: 700 }}
                    onClick={handleEmptyTrash}
                  >
                    Yes, Empty Trash
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setConfirmPermanent(false)}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bulk action bar for trash selection */}
        {trashSelectedCount > 0 && (
          <div style={{
            background: 'var(--navy-900)', color: '#fff',
            padding: '12px 18px',
            display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="checkSquare" size={15} />
              <span style={{ fontWeight: 700, fontSize: '14px' }}>
                {trashSelectedCount} selected
              </span>
            </div>
            <div style={{ flex: 1, display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                className="btn btn-sm"
                style={{ background: 'rgba(21,128,61,.85)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={handleRestore}
                title="Restore selected back to live applications"
              >
                <Icon name="restore" size={13} /> Restore Selected
              </button>
              <button
                className="btn btn-sm"
                style={{ background: 'var(--danger)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={handlePermanentDelete}
                title="Permanently delete — cannot be undone"
              >
                <Icon name="trashBin" size={13} /> Delete Permanently
              </button>
              <button
                className="btn btn-secondary btn-sm"
                style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', color: '#fff' }}
                onClick={() => setTrashSelected(new Set())}
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Trash table */}
        {trash.length === 0 ? (
          <div style={{ padding: '56px', textAlign: 'center', color: 'var(--slate-400)' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '14px',
              background: 'var(--slate-100)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 14px'
            }}>
              <Icon name="trashBin" size={24} />
            </div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--slate-600)', marginBottom: '6px' }}>
              Trash is empty
            </div>
            <div style={{ fontSize: '13px' }}>
              Deleted participants will appear here. You can restore or permanently delete them.
            </div>
          </div>
        ) : (
          <div className="tbl-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={allTrashSelected}
                      ref={el => { if (el) el.indeterminate = someTrashSelected && !allTrashSelected; }}
                      onChange={toggleAllTrash}
                      style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: 'var(--cyan-600)' }}
                    />
                  </th>
                  <th>Grant ID</th>
                  <th>Applicant Name</th>
                  <th>Phone</th>
                  <th>Idea / Startup</th>
                  <th>Stage (at deletion)</th>
                  <th>Deleted On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrash.length > 0 ? filteredTrash.map(a => {
                  const isSelected = trashSelected.has(a.applicationId);
                  const trashedDate = a._trashedAt ? fmtDate(a._trashedAt.slice(0, 10)) : '—';
                  return (
                    <tr
                      key={a.applicationId}
                      style={{
                        background: isSelected ? 'var(--danger-bg)' : undefined,
                        opacity: 0.92,
                      }}
                    >
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleTrashRow(a.applicationId)}
                          style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: 'var(--cyan-600)' }}
                        />
                      </td>
                      <td className="cell-id" style={{ textDecoration: 'line-through', opacity: .7 }}>
                        {a.applicationId}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--slate-600)' }}>{a.applicantName}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{a.phone || '—'}</td>
                      <td>{a.ideaName || '—'}</td>
                      <td>
                        <span className="badge badge-neutral" style={{ opacity: .8 }}>
                          {a.stage || '—'}
                        </span>
                      </td>
                      <td style={{ fontSize: '12.5px', color: 'var(--danger)', fontWeight: 600 }}>
                        {trashedDate}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ color: 'var(--success)', borderColor: 'var(--success-border)' }}
                            onClick={() => restoreApplications([a.applicationId])}
                            title="Restore this participant"
                          >
                            <Icon name="restore" size={13} /> Restore
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--danger)' }}
                            onClick={() => permanentDeleteApplications([a.applicationId])}
                            title="Permanently delete"
                          >
                            <Icon name="trashBin" size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="8" className="table-empty">No trash items match the search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsView;
