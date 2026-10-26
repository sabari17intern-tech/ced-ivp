import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Icon from '../common/Icon';
import { fmtDate, fmtMoney, stageLabel, stagePct, STAGES, STAGE_KEYS, stageIndex, todayISO } from '../../services/utils';
import { printStudentReport } from '../../services/pdfService';
import { DOCUMENT_SPECS, getDocLink } from '../../pages/Admin/DocumentsView';

const Drawer = () => {
  const { db, updateDb, drawerAppId, closeDrawer, showToast, openModal } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [noteText, setNoteText] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Document link editor state
  const [editingDrawerDocKey, setEditingDrawerDocKey] = useState(null);
  const [drawerDocLinkInput, setDrawerDocLinkInput] = useState('');

  // Phase disbursement inline editor state
  const [editingPhase, setEditingPhase] = useState(null); // 'phase1' | 'phase2' | 'phase3'
  const [phaseFormData, setPhaseFormData] = useState({
    status: 'released',
    releaseDate: todayISO(),
    refNumber: '',
    remarks: ''
  });

  // Bank details inline editor state
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [bankFormData, setBankFormData] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
    ifscCode: '',
    branch: ''
  });

  // Team member add state
  const [showAddTeamMember, setShowAddTeamMember] = useState(false);
  const [newMemberData, setNewMemberData] = useState({
    name: '',
    role: 'Co-founder',
    phone: '',
    email: '',
    rollNo: '',
    dept: ''
  });

  // Edit startup details state
  const [editFormData, setEditFormData] = useState(null);

  if (!drawerAppId) return null;

  const app = (db.applications || []).find(a => a.applicationId === drawerAppId);
  if (!app) return null;

  // Initialize edit forms when app opens or changes
  const initEditForm = () => {
    setEditFormData({
      ideaName: app.ideaName || '',
      sector: app.sector || '',
      fundingRequested: app.fundingRequested || 0,
      pitchLink: app.pitchLink || '',
      problemStatement: app.problemStatement || '',
      proposedSolution: app.proposedSolution || '',
      applicantName: app.applicantName || '',
      phone: app.phone || '',
      email: app.email || '',
      college: app.college || '',
      department: app.department || '',
      year: app.year || '',
      rollNumber: app.rollNumber || '',
      district: app.district || '',
      startupRegistered: app.startupRegistered || 'No',
      udyamNumber: (app.registration && app.registration.udyamNumber) || (app.data && app.data.msmeNumber) || ''
    });
    setIsEditing(true);
  };

  const handleSaveStartupDetails = (e) => {
    e.preventDefault();
    if (!editFormData) return;

    const cleanPhone = editFormData.phone.replace(/\D/g, '').slice(-10);

    const updatedApps = db.applications.map(a => {
      if (a.applicationId === app.applicationId) {
        const history = [
          ...(a.history || []),
          {
            date: todayISO(),
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            user: 'Admin',
            action: 'Startup Details Updated',
            from: a.ideaName,
            to: editFormData.ideaName,
            remarks: 'Modified by Administrator via Drawer.'
          }
        ];

        return {
          ...a,
          ideaName: editFormData.ideaName,
          sector: editFormData.sector,
          fundingRequested: Number(editFormData.fundingRequested) || 0,
          pitchLink: editFormData.pitchLink,
          problemStatement: editFormData.problemStatement,
          proposedSolution: editFormData.proposedSolution,
          applicantName: editFormData.applicantName,
          phone: cleanPhone || editFormData.phone,
          email: editFormData.email,
          college: editFormData.college,
          department: editFormData.department,
          year: editFormData.year,
          rollNumber: editFormData.rollNumber,
          district: editFormData.district,
          startupRegistered: editFormData.startupRegistered,
          registration: {
            ...(a.registration || {}),
            udyamNumber: editFormData.udyamNumber
          },
          data: {
            ...(a.data || {}),
            msmeNumber: editFormData.udyamNumber,
            msmeRegistered: Boolean(editFormData.udyamNumber)
          },
          history,
          lastUpdated: todayISO()
        };
      }
      return a;
    });

    // Also sync user if phone or name changed
    let updatedUsers = [...(db.users || [])];
    if (cleanPhone) {
      const fixedPassword = cleanPhone.slice(-4) + 'ivp';
      const uIdx = updatedUsers.findIndex(u => u.linkedApplicationId === app.applicationId || u.username === cleanPhone);
      if (uIdx >= 0) {
        updatedUsers[uIdx] = {
          ...updatedUsers[uIdx],
          username: cleanPhone,
          password: fixedPassword,
          name: editFormData.applicantName,
          phone: cleanPhone
        };
      }
    }

    updateDb({ ...db, applications: updatedApps, users: updatedUsers });
    setIsEditing(false);
    showToast('Startup details updated successfully.', 'success');
  };

  const handleCopyId = () => {
    navigator.clipboard?.writeText(app.applicationId);
    setCopiedId(true);
    showToast(`Copied ${app.applicationId} to clipboard`, 'info');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleStageChange = (newStage) => {
    if (newStage === app.stage) return;
    const updatedApps = db.applications.map(a => {
      if (a.applicationId === app.applicationId) {
        const history = [
          ...(a.history || []),
          {
            date: todayISO(),
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            user: 'Admin',
            action: `Stage moved to ${stageLabel(newStage)}`,
            from: stageLabel(a.stage),
            to: stageLabel(newStage),
            remarks: 'Updated via Application Drawer.'
          }
        ];
        return { ...a, stage: newStage, history, lastUpdated: todayISO() };
      }
      return a;
    });
    updateDb({ ...db, applications: updatedApps });
    showToast(`Moved to ${stageLabel(newStage)}`, 'success');
  };

  const handleAdvanceNextStage = () => {
    const curIdx = stageIndex(app.stage);
    if (curIdx < STAGE_KEYS.length - 1) {
      const nextStage = STAGE_KEYS[curIdx + 1];
      handleStageChange(nextStage);
    } else {
      showToast('Application is already at the final stage.', 'info');
    }
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    const newNote = {
      date: todayISO(),
      by: 'Admin',
      text: noteText.trim()
    };
    const updatedApps = db.applications.map(a => {
      if (a.applicationId === app.applicationId) {
        return { ...a, notes: [newNote, ...(a.notes || [])] };
      }
      return a;
    });
    updateDb({ ...db, applications: updatedApps });
    setNoteText('');
    showToast('Internal note saved.', 'success');
  };

  const handleDeleteNote = (index) => {
    const updatedApps = db.applications.map(a => {
      if (a.applicationId === app.applicationId) {
        const notes = (a.notes || []).filter((_, i) => i !== index);
        return { ...a, notes };
      }
      return a;
    });
    updateDb({ ...db, applications: updatedApps });
    showToast('Note deleted.', 'info');
  };

  // Toggle document status (consentLetter, fundingTemplate, msmeRegistered)
  const handleToggleDoc = (docKey) => {
    const updatedApps = db.applications.map(a => {
      if (a.applicationId === app.applicationId) {
        const curData = a.data || {};
        const newVal = !curData[docKey];
        const newData = { ...curData, [docKey]: newVal };
        const history = [
          ...(a.history || []),
          {
            date: todayISO(),
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            user: 'Admin',
            action: `Document ${docKey} marked as ${newVal ? 'VERIFIED' : 'PENDING'}`,
            from: curData[docKey] ? 'Verified' : 'Pending',
            to: newVal ? 'Verified' : 'Pending',
            remarks: 'Updated via Drawer.'
          }
        ];
        return { ...a, data: newData, history, lastUpdated: todayISO() };
      }
      return a;
    });
    updateDb({ ...db, applications: updatedApps });
    showToast('Document status updated.', 'success');
  };

  const handleSaveDrawerDocLink = (key) => {
    if (!drawerDocLinkInput.trim()) return;
    const spec = DOCUMENT_SPECS.find(d => d.key === key);
    const specName = spec ? spec.name : key;
    const curData = app.data || {};

    const updatedApps = db.applications.map(a => {
      if (a.applicationId === app.applicationId) {
        return {
          ...a,
          [key]: drawerDocLinkInput.trim(),
          data: {
            ...curData,
            [key]: drawerDocLinkInput.trim(),
            ...(key === 'consentLetterLink' ? { consentLetter: true } : {}),
            ...(key === 'fundingTemplateLink' ? { fundingTemplate: true } : {})
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
              remarks: drawerDocLinkInput.trim()
            }
          ],
          lastUpdated: todayISO()
        };
      }
      return a;
    });

    updateDb({ ...db, applications: updatedApps });
    setEditingDrawerDocKey(null);
    setDrawerDocLinkInput('');
    showToast(`Saved ${specName} Drive link!`, 'success');
  };

  // Save Bank Details
  const handleSaveBank = (e) => {
    e.preventDefault();
    const updatedApps = db.applications.map(a => {
      if (a.applicationId === app.applicationId) {
        const history = [
          ...(a.history || []),
          {
            date: todayISO(),
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            user: 'Admin',
            action: 'Bank Details Updated',
            from: '',
            to: bankFormData.bankName,
            remarks: `A/C: ${bankFormData.accountNumber}, IFSC: ${bankFormData.ifscCode}`
          }
        ];
        return { ...a, bank: { ...bankFormData }, history, lastUpdated: todayISO() };
      }
      return a;
    });
    updateDb({ ...db, applications: updatedApps });
    setIsEditingBank(false);
    showToast('Bank details updated successfully.', 'success');
  };

  // Phase release handler
  const handleOpenPhaseEditor = (phaseKey) => {
    const pData = (app.grant && app.grant[phaseKey]) || {};
    setEditingPhase(phaseKey);
    setPhaseFormData({
      status: pData.status === 'released' ? 'released' : 'released',
      releaseDate: pData.releaseDate || todayISO(),
      refNumber: pData.refNumber || '',
      remarks: pData.remarks || ''
    });
  };

  const handleSavePhaseDisbursement = (e) => {
    e.preventDefault();
    if (!editingPhase) return;

    const phaseName = editingPhase === 'phase1' ? 'Phase 1 (40%)' : editingPhase === 'phase2' ? 'Phase 2 (40%)' : 'Phase 3 (20%)';
    const updatedApps = db.applications.map(a => {
      if (a.applicationId === app.applicationId) {
        const curGrant = a.grant || {};
        const curPhase = curGrant[editingPhase] || {};

        const updatedPhase = {
          ...curPhase,
          status: phaseFormData.status,
          releaseDate: phaseFormData.status === 'released' ? phaseFormData.releaseDate : '',
          refNumber: phaseFormData.refNumber.trim(),
          remarks: phaseFormData.remarks.trim()
        };

        const history = [
          ...(a.history || []),
          {
            date: todayISO(),
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            user: 'Admin',
            action: `${phaseName} Grant marked as ${phaseFormData.status.toUpperCase()}`,
            from: curPhase.status || 'pending',
            to: phaseFormData.status,
            remarks: `Ref: ${phaseFormData.refNumber || 'N/A'}. ${phaseFormData.remarks || ''}`
          }
        ];

        return {
          ...a,
          grant: {
            ...curGrant,
            [editingPhase]: updatedPhase
          },
          history,
          lastUpdated: todayISO()
        };
      }
      return a;
    });

    updateDb({ ...db, applications: updatedApps });
    setEditingPhase(null);
    showToast(`${phaseName} disbursement recorded.`, 'success');
  };

  // Team member add handler
  const handleAddTeamMember = (e) => {
    e.preventDefault();
    if (!newMemberData.name.trim()) return;

    const memSeq = (db.members || []).length + 1;
    const newMem = {
      memberId: 'MEM-' + String(memSeq).padStart(3, '0'),
      fullName: newMemberData.name.trim(),
      role: newMemberData.role,
      phone: newMemberData.phone.replace(/\D/g, '').slice(-10),
      email: newMemberData.email.trim(),
      college: app.college,
      department: newMemberData.dept || app.department,
      rollNumber: newMemberData.rollNo || '',
      teamId: app.teamId || app.applicationId,
      joinedDate: todayISO(),
      active: true
    };

    const updatedApps = db.applications.map(a => {
      if (a.applicationId === app.applicationId) {
        return {
          ...a,
          teamId: a.teamId || a.applicationId,
          type: 'team',
          history: [
            ...(a.history || []),
            {
              date: todayISO(),
              time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
              user: 'Admin',
              action: `Added Team Member: ${newMemberData.name.trim()} (${newMemberData.role})`,
              from: '',
              to: 'Team',
              remarks: 'Added via Admin Drawer.'
            }
          ]
        };
      }
      return a;
    });

    updateDb({
      ...db,
      members: [...(db.members || []), newMem],
      applications: updatedApps
    });

    setShowAddTeamMember(false);
    setNewMemberData({ name: '', role: 'Co-founder', phone: '', email: '', rollNo: '', dept: '' });
    showToast(`Added ${newMem.fullName} to team.`, 'success');
  };

  // Co-founders / team members
  const teamMembers = (db.members || []).filter(m => 
    (app.teamId && m.teamId === app.teamId && m.memberId !== app.memberId) ||
    (m.memberId && m.memberId === app.memberId)
  );

  const cleanPhone = (app.phone || '').replace(/\D/g, '').slice(-10);
  const whatsAppUrl = cleanPhone ? `https://wa.me/91${cleanPhone}?text=Hello%20${encodeURIComponent(app.applicantName)},%20regarding%20your%20CED%20Grant%20Application%20(${app.applicationId})%20for%20${encodeURIComponent(app.ideaName || 'your startup')}:` : null;

  return (
    <div
      id="appDrawer"
      className="drawer-backdrop show"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 95,
        display: 'flex',
        justifyContent: 'flex-end',
        background: 'rgba(10, 25, 47, 0.65)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={closeDrawer}
    >
      <div
        className="drawer-content open"
        style={{
          width: '100%',
          maxWidth: '740px',
          height: '100%',
          background: '#fff',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-12px 0 40px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Top Header ── */}
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, var(--navy-900) 0%, var(--navy-800) 100%)',
          color: '#fff',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          {/* Top Row: IDs, Badges, Close */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12.5px',
                  color: 'var(--cyan-300)',
                  fontWeight: 700,
                  background: 'rgba(6, 182, 212, 0.15)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
                onClick={handleCopyId}
                title="Click to copy Application ID"
              >
                {app.applicationId}
                <Icon name={copiedId ? "check" : "copy"} size={12} />
              </span>

              <span className="badge badge-info" style={{ fontSize: '11px' }}>
                Batch {app.batch || '2026-27'}
              </span>

              <span className={`badge ${app.status === 'selected' ? 'badge-success' : app.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '11px' }}>
                {app.status ? app.status.toUpperCase() : 'PENDING'}
              </span>
            </div>

            <button
              className="drawer-close"
              aria-label="Close"
              onClick={closeDrawer}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              title="Close Drawer (Esc)"
            >
              <Icon name="x" size={18} />
            </button>
          </div>

          {/* Startup / Idea Title */}
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', marginBottom: '4px', letterSpacing: '-0.3px', wordBreak: 'break-word' }}>
            {app.ideaName || 'Untitled Startup Idea'}
          </h2>

          {/* Founder info subtitle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '13px', color: 'var(--slate-300)', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, color: '#fff' }}>
              👤 {app.applicantName}
            </span>
            <span>
              📞 <a href={`tel:${app.phone}`} style={{ color: 'var(--cyan-300)', textDecoration: 'none' }}>{app.phone}</a>
            </span>
            {app.email && (
              <span>
                ✉️ <a href={`mailto:${app.email}`} style={{ color: 'var(--cyan-300)', textDecoration: 'none' }}>{app.email}</a>
              </span>
            )}
          </div>

          {/* Header Action Ribbon */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-sm"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
              onClick={() => printStudentReport(app)}
              title="Print official PDF report summary"
            >
              <Icon name="download" size={14} /> Print PDF Report
            </button>

            {whatsAppUrl && (
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-sm"
                style={{ background: '#25D366', color: '#fff', border: 'none', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Icon name="whatsapp" size={14} /> WhatsApp Founder
              </a>
            )}

            {!isEditing ? (
              <button
                className="btn btn-sm"
                style={{ background: 'var(--cyan-600)', color: '#fff', border: 'none' }}
                onClick={initEditForm}
              >
                <Icon name="edit" size={14} /> Edit Details
              </button>
            ) : (
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setIsEditing(false)}
              >
                <Icon name="x" size={14} /> Cancel Edit
              </button>
            )}

            <button
              className="btn btn-sm"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
              onClick={() => openModal('scoreSheet', { app, round: 1 })}
            >
              <Icon name="evaluations" size={14} /> Score Round 1
            </button>
          </div>
        </div>

        {/* ── Pipeline Stage Tracker & Quick Mover ── */}
        <div style={{
          padding: '12px 24px',
          background: 'var(--slate-50)',
          borderBottom: '1px solid var(--slate-200)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--slate-500)', fontWeight: 800 }}>
              Stage:
            </span>
            <select
              className="tbl-filter"
              style={{ fontWeight: 700, padding: '6px 10px', fontSize: '12.5px', maxWidth: '220px' }}
              value={app.stage}
              onChange={(e) => handleStageChange(e.target.value)}
            >
              {STAGES.map(s => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
            <div style={{ flex: 1, minWidth: '100px' }}>
              <div className="progress-track" style={{ height: '6px' }}>
                <div className="progress-fill" style={{ width: `${stagePct(app.stage)}%` }} />
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--slate-400)', marginTop: '2px', textAlign: 'right' }}>
                {stagePct(app.stage)}% completed
              </div>
            </div>
          </div>

          <button
            className="btn btn-primary btn-sm"
            onClick={handleAdvanceNextStage}
            title="Advance application to the next pipeline stage"
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            Advance Next Stage <Icon name="arrowRight" size={13} />
          </button>
        </div>

        {/* ── Tab Navigation ── */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--slate-200)',
          background: '#fff',
          padding: '0 16px',
          overflowX: 'auto'
        }}>
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'evaluation', label: 'Evaluations & Scores' },
            { id: 'data', label: 'Data & Documents' },
            { id: 'grant', label: 'Grant & Disbursement' },
            { id: 'team', label: `Team (${teamMembers.length || 1})` },
            { id: 'history', label: `Notes & History (${(app.notes || []).length})` }
          ].map(tab => (
            <button
              key={tab.id}
              style={{
                padding: '12px 14px',
                border: 'none',
                background: 'transparent',
                fontSize: '12.5px',
                fontWeight: activeTab === tab.id ? 700 : 600,
                color: activeTab === tab.id ? 'var(--navy-900)' : 'var(--slate-500)',
                borderBottom: activeTab === tab.id ? '2.5px solid var(--navy-900)' : '2.5px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'color 0.15s'
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Main Tab Content Body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: 'var(--slate-50)' }}>

          {/* ═════════ INLINE EDIT MODE (When active) ═════════ */}
          {isEditing && editFormData && (
            <form onSubmit={handleSaveStartupDetails} className="card" style={{ padding: '22px', marginBottom: '24px', border: '2px solid var(--cyan-500)', background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--slate-200)', paddingBottom: '10px' }}>
                <h3 style={{ fontSize: '16px', margin: 0, color: 'var(--navy-900)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon name="edit" size={18} /> Edit Startup &amp; Applicant Details
                </h3>
                <span style={{ fontSize: '11.5px', color: 'var(--slate-400)' }}>Modifying {app.applicationId}</span>
              </div>

              <div className="form-grid" style={{ marginBottom: '16px' }}>
                <div className="form-field span-2">
                  <label>Startup / Idea Name <span className="req">*</span></label>
                  <input
                    type="text"
                    required
                    value={editFormData.ideaName}
                    onChange={e => setEditFormData({ ...editFormData, ideaName: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Sector / Domain</label>
                  <input
                    type="text"
                    value={editFormData.sector}
                    onChange={e => setEditFormData({ ...editFormData, sector: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Funding Requested (₹)</label>
                  <input
                    type="number"
                    value={editFormData.fundingRequested}
                    onChange={e => setEditFormData({ ...editFormData, fundingRequested: e.target.value })}
                  />
                </div>

                <div className="form-field span-2">
                  <label>Pitch Deck Link / Drive URL</label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/..."
                    value={editFormData.pitchLink}
                    onChange={e => setEditFormData({ ...editFormData, pitchLink: e.target.value })}
                  />
                </div>

                <div className="form-field span-2">
                  <label>Problem Statement</label>
                  <textarea
                    rows="2"
                    value={editFormData.problemStatement}
                    onChange={e => setEditFormData({ ...editFormData, problemStatement: e.target.value })}
                  />
                </div>

                <div className="form-field span-2">
                  <label>Proposed Solution</label>
                  <textarea
                    rows="2"
                    value={editFormData.proposedSolution}
                    onChange={e => setEditFormData({ ...editFormData, proposedSolution: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Applicant Full Name <span className="req">*</span></label>
                  <input
                    type="text"
                    required
                    value={editFormData.applicantName}
                    onChange={e => setEditFormData({ ...editFormData, applicantName: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Phone Number (10 digits) <span className="req">*</span></label>
                  <input
                    type="tel"
                    required
                    value={editFormData.phone}
                    onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>College / Institution</label>
                  <input
                    type="text"
                    value={editFormData.college}
                    onChange={e => setEditFormData({ ...editFormData, college: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Department</label>
                  <input
                    type="text"
                    value={editFormData.department}
                    onChange={e => setEditFormData({ ...editFormData, department: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Roll / Reg Number</label>
                  <input
                    type="text"
                    value={editFormData.rollNumber}
                    onChange={e => setEditFormData({ ...editFormData, rollNumber: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>MSME / Udyam Number</label>
                  <input
                    type="text"
                    placeholder="UDYAM-TN-..."
                    value={editFormData.udyamNumber}
                    onChange={e => setEditFormData({ ...editFormData, udyamNumber: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Icon name="save" /> Save Changes
                </button>
              </div>
            </form>
          )}

          {/* ═════════ TAB 1: OVERVIEW ═════════ */}
          {activeTab === 'overview' && (
            <div>
              {/* Quick Metrics Bar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                <div className="stat-card" style={{ padding: '12px 14px' }}>
                  <div className="val" style={{ fontSize: '16px' }}>{fmtMoney(app.fundingRequested)}</div>
                  <div className="lbl" style={{ fontSize: '11px' }}>Requested</div>
                </div>

                <div className="stat-card" style={{ padding: '12px 14px' }}>
                  <div className="val" style={{ fontSize: '16px', color: app.grant?.approvedAmount > 0 ? 'var(--success)' : 'var(--slate-400)' }}>
                    {app.grant?.approvedAmount > 0 ? fmtMoney(app.grant.approvedAmount) : 'Pending'}
                  </div>
                  <div className="lbl" style={{ fontSize: '11px' }}>Sanctioned</div>
                </div>

                <div className="stat-card" style={{ padding: '12px 14px' }}>
                  <div className="val" style={{ fontSize: '16px', color: app.rounds?.r1 ? 'var(--cyan-700)' : 'var(--slate-400)' }}>
                    {app.rounds?.r1 ? `${app.rounds.r1.scoreOutOf10 || 0}/10` : '—'}
                  </div>
                  <div className="lbl" style={{ fontSize: '11px' }}>Round 1</div>
                </div>

                <div className="stat-card" style={{ padding: '12px 14px' }}>
                  <div className="val" style={{ fontSize: '16px', color: app.rounds?.r2 ? 'var(--violet)' : 'var(--slate-400)' }}>
                    {app.rounds?.r2 ? `${app.rounds.r2.scoreOutOf10 || 0}/10` : '—'}
                  </div>
                  <div className="lbl" style={{ fontSize: '11px' }}>Round 2</div>
                </div>
              </div>

              {/* Startup & Project Info Card */}
              <div className="card" style={{ padding: '20px', marginBottom: '20px', background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h4 style={{ fontSize: '14.5px', margin: 0, color: 'var(--navy-900)' }}>
                    Startup &amp; Innovation Information
                  </h4>
                  <button className="btn btn-secondary btn-xs" onClick={initEditForm}>
                    <Icon name="edit" size={12} /> Edit
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: 'var(--slate-400)', display: 'block', fontSize: '11.5px', textTransform: 'uppercase', fontWeight: 700 }}>
                      Sector / Industry
                    </span>
                    <strong style={{ color: 'var(--slate-800)', fontSize: '13.5px' }}>{app.sector || 'General / Tech'}</strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--slate-400)', display: 'block', fontSize: '11.5px', textTransform: 'uppercase', fontWeight: 700 }}>
                      Grant Funding Requested
                    </span>
                    <strong style={{ color: 'var(--cyan-700)', fontSize: '14px' }}>{fmtMoney(app.fundingRequested)}</strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--slate-400)', display: 'block', fontSize: '11.5px', textTransform: 'uppercase', fontWeight: 700 }}>
                      Startup Registered
                    </span>
                    <strong style={{ color: 'var(--slate-800)' }}>
                      {app.startupRegistered || 'Not Registered'}
                    </strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--slate-400)', display: 'block', fontSize: '11.5px', textTransform: 'uppercase', fontWeight: 700 }}>
                      MSME / Udyam Number
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {(app.registration && app.registration.udyamNumber) || (app.data && app.data.msmeNumber) || 'Not Provided'}
                    </span>
                  </div>
                </div>

                {/* Pitch Deck Link */}
                <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--slate-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <span style={{ color: 'var(--slate-400)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                      Pitch Deck / Presentation
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--slate-600)' }}>
                      {app.pitchLink ? app.pitchLink.slice(0, 45) + '...' : 'No pitch deck link uploaded yet.'}
                    </span>
                  </div>

                  {app.pitchLink ? (
                    <a
                      href={app.pitchLink}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ textDecoration: 'none' }}
                    >
                      <Icon name="externalLink" size={13} /> Open Pitch Deck ↗
                    </a>
                  ) : (
                    <button className="btn btn-secondary btn-sm" onClick={initEditForm}>
                      <Icon name="plus" size={13} /> Add Pitch Link
                    </button>
                  )}
                </div>
              </div>

              {/* Problem Statement & Solution */}
              <div className="card" style={{ padding: '20px', marginBottom: '20px', background: '#fff' }}>
                <h4 style={{ fontSize: '14.5px', marginBottom: '14px', color: 'var(--navy-900)' }}>
                  Problem Statement &amp; Solution
                </h4>

                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--slate-400)', fontWeight: 700, marginBottom: '4px' }}>
                    Identified Problem
                  </div>
                  <div style={{ fontSize: '13.5px', color: 'var(--slate-800)', lineHeight: 1.6, background: 'var(--slate-50)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--slate-200)' }}>
                    {app.problemStatement || 'No problem statement detailed.'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--slate-400)', fontWeight: 700, marginBottom: '4px' }}>
                    Proposed Innovation / Solution
                  </div>
                  <div style={{ fontSize: '13.5px', color: 'var(--slate-800)', lineHeight: 1.6, background: 'var(--slate-50)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--slate-200)' }}>
                    {app.proposedSolution || 'No solution description detailed.'}
                  </div>
                </div>
              </div>

              {/* Founder & Academic Profile */}
              <div className="card" style={{ padding: '20px', marginBottom: '20px', background: '#fff' }}>
                <h4 style={{ fontSize: '14.5px', marginBottom: '14px', color: 'var(--navy-900)' }}>
                  Applicant Founder &amp; Academic Details
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: 'var(--slate-400)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Founder Name</span>
                    <strong style={{ fontSize: '14px', color: 'var(--slate-900)' }}>{app.applicantName}</strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--slate-400)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Mobile Number</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>{app.phone}</strong>
                      {whatsAppUrl && (
                        <a href={whatsAppUrl} target="_blank" rel="noreferrer" title="Message on WhatsApp" style={{ color: '#25D366' }}>
                          <Icon name="whatsapp" size={14} />
                        </a>
                      )}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: 'var(--slate-400)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Email Address</span>
                    <span style={{ color: 'var(--cyan-700)' }}>{app.email || '—'}</span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--slate-400)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>College / Institution</span>
                    <span>{app.college || 'Anna University'}</span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--slate-400)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Department / Degree</span>
                    <span>{app.department || '—'}</span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--slate-400)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Year / Roll Number</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{app.year ? `Year ${app.year}` : ''} {app.rollNumber ? `(${app.rollNumber})` : '—'}</span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--slate-400)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>District / Location</span>
                    <span>{app.district || 'Tamil Nadu'}</span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--slate-400)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Registration Date</span>
                    <span>{fmtDate(app.createdDate)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═════════ TAB 2: EVALUATIONS ═════════ */}
          {activeTab === 'evaluation' && (
            <div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button className="btn btn-primary btn-sm" onClick={() => openModal('scoreSheet', { app, round: 1 })}>
                  <Icon name="evaluations" /> Score Round 1 Evaluation
                </button>
                <button className="btn btn-accent btn-sm" onClick={() => openModal('scoreSheet', { app, round: 2 })}>
                  <Icon name="evaluations" /> Score Round 2 Evaluation
                </button>
              </div>

              {/* Round 1 Evaluation Card */}
              <div className="card" style={{ padding: '20px', marginBottom: '18px', background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h4 style={{ fontSize: '15px', margin: 0, color: 'var(--navy-900)' }}>
                      Round 1: Initial Pitch Evaluation
                    </h4>
                    <div style={{ fontSize: '12px', color: 'var(--slate-400)', marginTop: '2px' }}>
                      Reviewer: Arun Kumar R &middot; Online Mode
                    </div>
                  </div>

                  {app.rounds?.r1 ? (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--cyan-700)' }}>
                        {app.rounds.r1.scoreOutOf10 || 0} <span style={{ fontSize: '13px', color: 'var(--slate-400)' }}>/ 10</span>
                      </div>
                      <span className={`badge ${app.rounds.r1.status === 'selected' ? 'badge-success' : app.rounds.r1.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                        {app.rounds.r1.status ? app.rounds.r1.status.toUpperCase() : 'SCORED'}
                      </span>
                    </div>
                  ) : (
                    <span className="badge badge-neutral">NOT SCORED</span>
                  )}
                </div>

                {app.rounds?.r1 ? (
                  <div style={{ marginTop: '12px', fontSize: '13px' }}>
                    <div style={{ background: 'var(--slate-50)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--slate-200)', marginBottom: '12px' }}>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--slate-400)', fontWeight: 700, marginBottom: '2px' }}>
                        Evaluator Remarks:
                      </div>
                      <div style={{ color: 'var(--slate-700)' }}>{app.rounds.r1.remarks || 'No specific remarks entered.'}</div>
                    </div>

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => openModal('scoreSheet', { app, round: 1 })}
                    >
                      <Icon name="edit" size={13} /> Edit / Re-score Round 1
                    </button>
                  </div>
                ) : (
                  <div style={{ color: 'var(--slate-400)', fontSize: '13px', padding: '12px 0' }}>
                    Round 1 evaluation has not been conducted yet. Click "Score Round 1 Evaluation" above to record evaluator criteria.
                  </div>
                )}
              </div>

              {/* Round 2 Evaluation Card */}
              <div className="card" style={{ padding: '20px', background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h4 style={{ fontSize: '15px', margin: 0, color: 'var(--navy-900)' }}>
                      Round 2: Final Expert Pitch Evaluation
                    </h4>
                    <div style={{ fontSize: '12px', color: 'var(--slate-400)', marginTop: '2px' }}>
                      Reviewer: Sakthivel S &middot; Online Mode
                    </div>
                  </div>

                  {app.rounds?.r2 ? (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--violet)' }}>
                        {app.rounds.r2.scoreOutOf10 || 0} <span style={{ fontSize: '13px', color: 'var(--slate-400)' }}>/ 10</span>
                      </div>
                      <span className={`badge ${app.rounds.r2.status === 'selected' ? 'badge-success' : app.rounds.r2.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                        {app.rounds.r2.status ? app.rounds.r2.status.toUpperCase() : 'SCORED'}
                      </span>
                    </div>
                  ) : (
                    <span className="badge badge-neutral">NOT SCORED</span>
                  )}
                </div>

                {app.rounds?.r2 ? (
                  <div style={{ marginTop: '12px', fontSize: '13px' }}>
                    <div style={{ background: 'var(--slate-50)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--slate-200)', marginBottom: '12px' }}>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--slate-400)', fontWeight: 700, marginBottom: '2px' }}>
                        Evaluator Remarks:
                      </div>
                      <div style={{ color: 'var(--slate-700)' }}>{app.rounds.r2.remarks || 'No specific remarks entered.'}</div>
                    </div>

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => openModal('scoreSheet', { app, round: 2 })}
                    >
                      <Icon name="edit" size={13} /> Edit / Re-score Round 2
                    </button>
                  </div>
                ) : (
                  <div style={{ color: 'var(--slate-400)', fontSize: '13px', padding: '12px 0' }}>
                    Round 2 evaluation has not been conducted yet. Click "Score Round 2 Evaluation" above to score market potential, prototype readiness, and commercialisation.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═════════ TAB 3: DATA & DOCUMENTS ═════════ */}
          {activeTab === 'data' && (
            <div>
              {/* Compliance & Document Checklist Card */}
              <div className="card" style={{ padding: '20px', marginBottom: '20px', background: '#fff' }}>
                <h4 style={{ fontSize: '15px', marginBottom: '4px', color: 'var(--navy-900)' }}>
                  Mandatory Documents &amp; Verification Checklist
                </h4>
                <p style={{ fontSize: '12.5px', color: 'var(--slate-500)', marginBottom: '16px' }}>
                  Verify that all required documents and registrations have been verified by CED Programme Office.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Consent Letter */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', background: 'var(--slate-50)', borderRadius: '8px', border: '1px solid var(--slate-200)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '6px',
                        background: app.data?.consentLetter ? 'var(--success-bg)' : 'var(--slate-200)',
                        color: app.data?.consentLetter ? 'var(--success)' : 'var(--slate-500)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Icon name={app.data?.consentLetter ? "check" : "file"} size={16} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--slate-800)' }}>
                          Student &amp; College Consent Letter
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--slate-400)' }}>
                          Signed by Principal / HOD with institutional seal
                        </div>
                      </div>
                    </div>

                    <button
                      className={`btn btn-xs ${app.data?.consentLetter ? 'btn-success' : 'btn-secondary'}`}
                      onClick={() => handleToggleDoc('consentLetter')}
                    >
                      {app.data?.consentLetter ? '✓ Verified' : 'Mark Verified'}
                    </button>
                  </div>

                  {/* Funding Application Template */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', background: 'var(--slate-50)', borderRadius: '8px', border: '1px solid var(--slate-200)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '6px',
                        background: app.data?.fundingTemplate ? 'var(--success-bg)' : 'var(--slate-200)',
                        color: app.data?.fundingTemplate ? 'var(--success)' : 'var(--slate-500)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Icon name={app.data?.fundingTemplate ? "check" : "file"} size={16} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--slate-800)' }}>
                          Funding Application Detailed Budget Template
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--slate-400)' }}>
                          Line-item budget and expenditure milestones
                        </div>
                      </div>
                    </div>

                    <button
                      className={`btn btn-xs ${app.data?.fundingTemplate ? 'btn-success' : 'btn-secondary'}`}
                      onClick={() => handleToggleDoc('fundingTemplate')}
                    >
                      {app.data?.fundingTemplate ? '✓ Submitted' : 'Mark Submitted'}
                    </button>
                  </div>

                  {/* MSME Udyam Registration */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', background: 'var(--slate-50)', borderRadius: '8px', border: '1px solid var(--slate-200)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '6px',
                        background: (app.data?.msmeNumber || app.registration?.udyamNumber) ? 'var(--success-bg)' : 'var(--slate-200)',
                        color: (app.data?.msmeNumber || app.registration?.udyamNumber) ? 'var(--success)' : 'var(--slate-500)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Icon name="check" size={16} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--slate-800)' }}>
                          MSME Udyam Certificate
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--slate-500)', fontFamily: 'var(--font-mono)' }}>
                          {app.data?.msmeNumber || app.registration?.udyamNumber || 'No Udyam number registered'}
                        </div>
                      </div>
                    </div>

                    <button className="btn btn-secondary btn-xs" onClick={initEditForm}>
                      <Icon name="edit" size={12} /> Edit Udyam No.
                    </button>
                  </div>
                </div>
              </div>

              {/* Bank Account Details for Disbursement Card */}
              <div className="card" style={{ padding: '20px', marginBottom: '20px', background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h4 style={{ fontSize: '15px', margin: 0, color: 'var(--navy-900)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon name="bank" size={17} /> Bank Account for Grant Disbursal
                  </h4>

                  {!isEditingBank && (
                    <button
                      className="btn btn-secondary btn-xs"
                      onClick={() => {
                        setBankFormData({
                          accountName: app.bank?.accountName || app.applicantName || '',
                          accountNumber: app.bank?.accountNumber || '',
                          bankName: app.bank?.bankName || '',
                          ifscCode: app.bank?.ifscCode || '',
                          branch: app.bank?.branch || ''
                        });
                        setIsEditingBank(true);
                      }}
                    >
                      <Icon name="edit" size={12} /> Edit Bank Details
                    </button>
                  )}
                </div>

                {isEditingBank ? (
                  <form onSubmit={handleSaveBank} style={{ background: 'var(--slate-50)', padding: '16px', borderRadius: '8px', border: '1px solid var(--slate-200)' }}>
                    <div className="form-grid" style={{ marginBottom: '14px' }}>
                      <div className="form-field span-2">
                        <label>Account Holder Name</label>
                        <input
                          type="text"
                          required
                          value={bankFormData.accountName}
                          onChange={e => setBankFormData({ ...bankFormData, accountName: e.target.value })}
                        />
                      </div>
                      <div className="form-field">
                        <label>Account Number</label>
                        <input
                          type="text"
                          required
                          value={bankFormData.accountNumber}
                          onChange={e => setBankFormData({ ...bankFormData, accountNumber: e.target.value })}
                        />
                      </div>
                      <div className="form-field">
                        <label>IFSC Code</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. SBIN0000800"
                          value={bankFormData.ifscCode}
                          onChange={e => setBankFormData({ ...bankFormData, ifscCode: e.target.value.toUpperCase() })}
                        />
                      </div>
                      <div className="form-field">
                        <label>Bank Name</label>
                        <input
                          type="text"
                          placeholder="e.g. State Bank of India"
                          value={bankFormData.bankName}
                          onChange={e => setBankFormData({ ...bankFormData, bankName: e.target.value })}
                        />
                      </div>
                      <div className="form-field">
                        <label>Branch</label>
                        <input
                          type="text"
                          placeholder="e.g. Anna University Branch"
                          value={bankFormData.branch}
                          onChange={e => setBankFormData({ ...bankFormData, branch: e.target.value })}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsEditingBank(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary btn-sm">
                        <Icon name="save" size={13} /> Save Bank Details
                      </button>
                    </div>
                  </form>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', fontSize: '13px' }}>
                    <div>
                      <span style={{ color: 'var(--slate-400)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                        Beneficiary Name
                      </span>
                      <strong style={{ color: 'var(--slate-800)' }}>
                        {app.bank?.accountName || app.applicantName}
                      </strong>
                    </div>

                    <div>
                      <span style={{ color: 'var(--slate-400)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                        Account Number
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {app.bank?.accountNumber || 'Not Provided'}
                      </span>
                    </div>

                    <div>
                      <span style={{ color: 'var(--slate-400)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                        Bank Name &amp; Branch
                      </span>
                      <span>
                        {app.bank?.bankName ? `${app.bank.bankName} (${app.bank.branch || 'Main'})` : 'Not Provided'}
                      </span>
                    </div>

                    <div>
                      <span style={{ color: 'var(--slate-400)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                        IFSC Code
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--cyan-700)' }}>
                        {app.bank?.ifscCode || 'Not Provided'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Attached Specific Drive Links Card */}
              <div className="card" style={{ padding: '20px', marginBottom: '20px', background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <h4 style={{ fontSize: '15px', margin: 0, color: 'var(--navy-900)' }}>
                      Specific Google Drive / Cloud Document Links
                    </h4>
                    <div style={{ fontSize: '11.5px', color: 'var(--slate-400)', marginTop: '2px' }}>
                      All specific document links attached to this startup application
                    </div>
                  </div>
                </div>

                {/* Inline Doc Link Editor */}
                {editingDrawerDocKey && (
                  <div style={{
                    background: 'var(--cyan-50)',
                    border: '1.5px solid var(--cyan-500)',
                    padding: '14px',
                    borderRadius: '8px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '6px' }}>
                      Attach Link for: {DOCUMENT_SPECS.find(d => d.key === editingDrawerDocKey)?.name}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="url"
                        placeholder="https://drive.google.com/file/d/.../view"
                        value={drawerDocLinkInput}
                        onChange={e => setDrawerDocLinkInput(e.target.value)}
                        style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--slate-300)', fontSize: '12.5px' }}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        onClick={() => { setEditingDrawerDocKey(null); setDrawerDocLinkInput(''); }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary btn-xs"
                        onClick={() => handleSaveDrawerDocLink(editingDrawerDocKey)}
                      >
                        <Icon name="save" size={12} /> Save
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {DOCUMENT_SPECS.map(spec => {
                    const link = getDocLink(app, spec.key);
                    const isAttached = Boolean(link);

                    return (
                      <div
                        key={spec.key}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '8px',
                          background: isAttached ? '#f8fafc' : '#fff',
                          border: isAttached ? '1px solid var(--slate-200)' : '1px dashed var(--slate-300)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '10px'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ fontSize: '13px', color: 'var(--navy-900)' }}>
                              {spec.name}
                            </strong>
                            <span className={`badge ${isAttached ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '10px' }}>
                              {isAttached ? '✓ ATTACHED' : 'PENDING'}
                            </span>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--slate-400)', marginTop: '2px' }}>
                            {spec.desc}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          {isAttached ? (
                            <>
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
                                <Icon name="externalLink" size={12} /> Open Link ↗
                              </a>
                              <button
                                type="button"
                                className="btn btn-xs"
                                style={{ background: 'none', border: 'none', color: 'var(--slate-400)', cursor: 'pointer' }}
                                onClick={() => {
                                  navigator.clipboard?.writeText(link);
                                  showToast(`Copied ${spec.shortName} link to clipboard`, 'info');
                                }}
                                title="Copy Link"
                              >
                                <Icon name="copy" size={13} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary btn-xs"
                                style={{ fontSize: '11px', padding: '3px 8px' }}
                                onClick={() => {
                                  setEditingDrawerDocKey(spec.key);
                                  setDrawerDocLinkInput(link);
                                }}
                              >
                                Edit
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-primary btn-xs"
                              style={{ fontSize: '11.5px', padding: '3px 10px' }}
                              onClick={() => {
                                setEditingDrawerDocKey(spec.key);
                                setDrawerDocLinkInput('');
                              }}
                            >
                              + Attach Link
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ═════════ TAB 4: GRANT & DISBURSEMENT ═════════ */}
          {activeTab === 'grant' && (
            <div>
              {/* Grant Sanction Status Card */}
              <div className="card" style={{ padding: '20px', marginBottom: '20px', background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h4 style={{ fontSize: '15px', margin: 0, color: 'var(--navy-900)' }}>
                    CED Grant Sanction Status
                  </h4>
                  <button className="btn btn-primary btn-sm" onClick={() => openModal('sanctionGrant', { app })}>
                    <Icon name="edit" size={13} /> {app.grant?.approvedAmount > 0 ? 'Edit Grant Sanction' : 'Record Grant Sanction'}
                  </button>
                </div>

                {app.grant && app.grant.approvedAmount > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', fontSize: '13px' }}>
                    <div>
                      <span style={{ color: 'var(--slate-400)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                        Sanction Letter No.
                      </span>
                      <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--navy-900)', fontSize: '13.5px' }}>
                        {app.grant.sanctionLetterNo || 'CED/IVP/2026/01'}
                      </strong>
                    </div>

                    <div>
                      <span style={{ color: 'var(--slate-400)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                        Sanction Approval Date
                      </span>
                      <strong>{fmtDate(app.grant.approvalDate)}</strong>
                    </div>

                    <div>
                      <span style={{ color: 'var(--slate-400)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                        Total Sanctioned Grant
                      </span>
                      <strong style={{ color: 'var(--success)', fontSize: '18px', fontWeight: 800 }}>
                        {fmtMoney(app.grant.approvedAmount)}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: 'var(--slate-500)', fontSize: '13.5px', background: 'var(--slate-50)', padding: '16px', borderRadius: '8px', border: '1px solid var(--slate-200)' }}>
                    Grant has not been sanctioned yet for this startup. Click <strong>Record Grant Sanction</strong> above to enter Sanction Letter Number and sanction up to ₹3,00,000.
                  </div>
                )}
              </div>

              {/* 3 Milestone Release Phases */}
              <h4 style={{ fontSize: '14.5px', marginBottom: '12px', color: 'var(--navy-900)' }}>
                3-Phase Grant Milestone Releases
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                {[
                  { key: 'phase1', name: 'Phase 1: Initial Release (40%)', pct: 0.4 },
                  { key: 'phase2', name: 'Phase 2: Mid-term Milestone (40%)', pct: 0.4 },
                  { key: 'phase3', name: 'Phase 3: Final Product / Demo (20%)', pct: 0.2 }
                ].map(({ key, name, pct }) => {
                  const pData = (app.grant && app.grant[key]) || {};
                  const isReleased = pData.status === 'released';
                  const amount = pData.amount || Math.round((app.grant?.approvedAmount || 0) * pct);

                  return (
                    <div key={key} className="card" style={{ padding: '18px', background: '#fff', borderLeft: `4px solid ${isReleased ? 'var(--success)' : 'var(--warning)'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '14.5px', color: 'var(--navy-900)' }}>
                            {name}
                          </div>
                          <div style={{ fontSize: '18px', fontWeight: 800, color: isReleased ? 'var(--success)' : 'var(--slate-700)', marginTop: '2px' }}>
                            {fmtMoney(amount)}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className={`badge ${isReleased ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '12px', padding: '4px 10px' }}>
                            {isReleased ? '✓ RELEASED' : 'PENDING DISBURSEMENT'}
                          </span>

                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenPhaseEditor(key)}
                          >
                            <Icon name="edit" size={13} /> {isReleased ? 'Update Ref / UTR' : 'Disburse Grant'}
                          </button>
                        </div>
                      </div>

                      {isReleased && (
                        <div style={{ background: 'var(--slate-50)', padding: '10px 14px', borderRadius: '6px', fontSize: '12.5px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                          <div>
                            <span style={{ color: 'var(--slate-400)' }}>Release Date: </span>
                            <strong>{fmtDate(pData.releaseDate)}</strong>
                          </div>
                          {pData.refNumber && (
                            <div>
                              <span style={{ color: 'var(--slate-400)' }}>UTR / Bank Ref: </span>
                              <strong style={{ fontFamily: 'var(--font-mono)' }}>{pData.refNumber}</strong>
                            </div>
                          )}
                          {pData.remarks && (
                            <div>
                              <span style={{ color: 'var(--slate-400)' }}>Remarks: </span>
                              <span>{pData.remarks}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Inline Phase Disburse Modal Form */}
              {editingPhase && (
                <div className="card" style={{ padding: '20px', border: '2px solid var(--cyan-600)', background: '#fff', marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '15px', marginBottom: '12px', color: 'var(--navy-900)' }}>
                    Record / Update {editingPhase === 'phase1' ? 'Phase 1 (40%)' : editingPhase === 'phase2' ? 'Phase 2 (40%)' : 'Phase 3 (20%)'} Disbursement
                  </h4>

                  <form onSubmit={handleSavePhaseDisbursement}>
                    <div className="form-grid" style={{ marginBottom: '14px' }}>
                      <div className="form-field">
                        <label>Disbursement Status</label>
                        <select
                          value={phaseFormData.status}
                          onChange={e => setPhaseFormData({ ...phaseFormData, status: e.target.value })}
                        >
                          <option value="released">Released / Disbursed</option>
                          <option value="pending">Pending</option>
                        </select>
                      </div>

                      <div className="form-field">
                        <label>Release Date</label>
                        <input
                          type="date"
                          value={phaseFormData.releaseDate}
                          onChange={e => setPhaseFormData({ ...phaseFormData, releaseDate: e.target.value })}
                        />
                      </div>

                      <div className="form-field span-2">
                        <label>Bank UTR / Transaction Reference Number</label>
                        <input
                          type="text"
                          placeholder="e.g. SBIN-UTR-20261017-00129"
                          value={phaseFormData.refNumber}
                          onChange={e => setPhaseFormData({ ...phaseFormData, refNumber: e.target.value })}
                        />
                      </div>

                      <div className="form-field span-2">
                        <label>Remarks</label>
                        <input
                          type="text"
                          placeholder="e.g. Transferred to founder account after milestone review"
                          value={phaseFormData.remarks}
                          onChange={e => setPhaseFormData({ ...phaseFormData, remarks: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingPhase(null)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary btn-sm">
                        <Icon name="check" size={14} /> Save Disbursement
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ═════════ TAB 5: TEAM MEMBERS ═════════ */}
          {activeTab === 'team' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h4 style={{ fontSize: '15px', margin: 0, color: 'var(--navy-900)' }}>
                    Founder &amp; Team Members ({teamMembers.length || 1})
                  </h4>
                  <div style={{ fontSize: '12px', color: 'var(--slate-400)' }}>
                    Team ID: {app.teamId || app.applicationId}
                  </div>
                </div>

                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowAddTeamMember(!showAddTeamMember)}
                >
                  <Icon name="plus" size={13} /> Add Team Member
                </button>
              </div>

              {/* Add Team Member inline form */}
              {showAddTeamMember && (
                <form onSubmit={handleAddTeamMember} className="card" style={{ padding: '16px', marginBottom: '18px', background: '#fff', border: '1.5px solid var(--cyan-600)' }}>
                  <h5 style={{ fontSize: '13.5px', marginBottom: '12px', color: 'var(--navy-900)' }}>Add New Co-founder / Member</h5>
                  <div className="form-grid" style={{ marginBottom: '12px' }}>
                    <div className="form-field">
                      <label>Full Name <span className="req">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh K"
                        value={newMemberData.name}
                        onChange={e => setNewMemberData({ ...newMemberData, name: e.target.value })}
                      />
                    </div>
                    <div className="form-field">
                      <label>Role</label>
                      <input
                        type="text"
                        placeholder="e.g. Co-founder / CTO"
                        value={newMemberData.role}
                        onChange={e => setNewMemberData({ ...newMemberData, role: e.target.value })}
                      />
                    </div>
                    <div className="form-field">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        placeholder="10-digit mobile"
                        value={newMemberData.phone}
                        onChange={e => setNewMemberData({ ...newMemberData, phone: e.target.value })}
                      />
                    </div>
                    <div className="form-field">
                      <label>Email Address</label>
                      <input
                        type="email"
                        placeholder="member@example.com"
                        value={newMemberData.email}
                        onChange={e => setNewMemberData({ ...newMemberData, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddTeamMember(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary btn-sm">
                      <Icon name="check" size={13} /> Save Member
                    </button>
                  </div>
                </form>
              )}

              {/* Team list cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Lead Founder Card */}
                <div className="card" style={{ padding: '16px', background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{
                        width: '42px', height: '42px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--navy-900), var(--cyan-700))',
                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '16px', fontWeight: 800
                      }}>
                        {app.applicantName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '14.5px', color: 'var(--slate-900)' }}>
                          {app.applicantName}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--cyan-700)', fontWeight: 600 }}>
                          Lead Applicant &amp; Founder
                        </div>
                      </div>
                    </div>
                    <span className="badge badge-info">LEAD FOUNDER</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '14px', fontSize: '12.5px' }}>
                    <div><span style={{ color: 'var(--slate-400)' }}>Phone:</span> <strong>{app.phone}</strong></div>
                    <div><span style={{ color: 'var(--slate-400)' }}>Email:</span> <strong>{app.email || '—'}</strong></div>
                    <div><span style={{ color: 'var(--slate-400)' }}>Dept:</span> <strong>{app.department || '—'}</strong></div>
                  </div>
                </div>

                {/* Other members */}
                {teamMembers.filter(m => m.fullName !== app.applicantName).map(m => (
                  <div key={m.memberId} className="card" style={{ padding: '16px', background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '50%',
                          background: 'var(--slate-200)', color: 'var(--slate-700)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '15px', fontWeight: 700
                        }}>
                          {m.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '14px' }}>{m.fullName}</div>
                          <div style={{ fontSize: '12px', color: 'var(--slate-500)' }}>{m.role || 'Co-founder'}</div>
                        </div>
                      </div>
                      <span className="badge badge-neutral">{m.memberId}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '12px', fontSize: '12.5px' }}>
                      <div><span style={{ color: 'var(--slate-400)' }}>Phone:</span> <strong>{m.phone || '—'}</strong></div>
                      <div><span style={{ color: 'var(--slate-400)' }}>Email:</span> <strong>{m.email || '—'}</strong></div>
                      <div><span style={{ color: 'var(--slate-400)' }}>Dept:</span> <strong>{m.department || '—'}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═════════ TAB 6: NOTES & AUDIT TRAIL ═════════ */}
          {activeTab === 'history' && (
            <div>
              {/* Add Note Card */}
              <div className="card" style={{ padding: '18px', marginBottom: '20px', background: '#fff' }}>
                <h4 style={{ fontSize: '14.5px', marginBottom: '10px', color: 'var(--navy-900)' }}>
                  Add Admin Internal Note
                </h4>
                <textarea
                  rows="3"
                  placeholder="Enter confidential notes, evaluation summaries, or follow-up tasks for this startup..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  style={{ width: '100%', marginBottom: '10px' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary btn-sm" onClick={handleAddNote}>
                    <Icon name="save" size={13} /> Save Note
                  </button>
                </div>
              </div>

              {/* Internal Notes List */}
              {app.notes && app.notes.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '14.5px', marginBottom: '10px', color: 'var(--navy-900)' }}>
                    Saved Notes ({app.notes.length})
                  </h4>
                  {app.notes.map((n, idx) => (
                    <div key={idx} className="card" style={{ padding: '12px 16px', marginBottom: '8px', background: '#fff', fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--slate-400)', fontWeight: 600 }}>
                          {n.date} by {n.by}
                        </span>
                        <button
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px' }}
                          onClick={() => handleDeleteNote(idx)}
                          title="Delete note"
                        >
                          <Icon name="x" size={14} />
                        </button>
                      </div>
                      <div style={{ color: 'var(--slate-800)', lineHeight: 1.5 }}>{n.text}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Audit Timeline */}
              <h4 style={{ fontSize: '14.5px', marginBottom: '12px', color: 'var(--navy-900)' }}>
                Complete Audit Trail History
              </h4>
              <div className="timeline">
                {(app.history || []).map((h, idx) => (
                  <div key={idx} className="tl-item done">
                    <div className="tl-rail">
                      <div className="tl-dot"><Icon name="check" size={12} /></div>
                      <div className="tl-connector" />
                    </div>
                    <div className="tl-content">
                      <div className="tl-title">{h.action}</div>
                      <div className="tl-meta">{h.date} {h.time || ''} by {h.user}</div>
                      {h.remarks && <div className="tl-remarks">{h.remarks}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Drawer;
