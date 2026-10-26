import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Icon from '../common/Icon';
import { STAGES } from '../../services/utils';

const TEMPLATES = [
  {
    label: 'Upload Drive Links',
    title: 'Action Required: Upload Your Document Drive Links',
    type: 'warning',
    text: 'Please submit your Google Drive / OneDrive links for your Consent Letter, Budget Template, and MSME Certificate in your Documents tab to proceed to the next stage.',
    page: 'myDocuments'
  },
  {
    label: 'Round 1 Selected',
    title: 'Congratulations! You Have Cleared Round 1 CED Evaluation',
    type: 'success',
    text: 'Your startup presentation has been evaluated and approved by Arun Kumar R. Please proceed with data and document submission.',
    page: 'myDashboard'
  },
  {
    label: 'Bank Details Reminder',
    title: 'Reminder: Update Bank Account & MSME Udyam Number',
    type: 'urgent',
    text: 'For grant sanction and Direct Benefit Transfer (DBT) disbursement, please provide your verified bank account details and MSME Udyam registration number.',
    page: 'myApplication'
  },
  {
    label: 'Grant Sanction Approved',
    title: 'CED Grant Sanction Letter Issued',
    type: 'success',
    text: 'Your CED Student Founder Grant funding has been sanctioned by Anna University. View your milestone breakdown and disbursement status in Grant Money.',
    page: 'myGrant'
  }
];

const SendNotificationModal = () => {
  const { db, sendNotification, closeModal, modalParams } = useAuth();
  const applications = db.applications || [];

  const initialTargetType = modalParams && modalParams.targetType ? modalParams.targetType : 'all';
  const initialTargetVal = modalParams && modalParams.targetValue ? modalParams.targetValue : '';

  const [targetType, setTargetType] = useState(initialTargetType);
  const [targetValue, setTargetValue] = useState(initialTargetVal);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [linkPage, setLinkPage] = useState('myDashboard');
  const [searchTerm, setSearchTerm] = useState('');

  // Target count calculator
  const getTargetCount = () => {
    if (targetType === 'all') return applications.length;
    if (targetType === 'batch') {
      return applications.filter(a => a.batch === targetValue || String(a.createdDate).slice(0, 4) === targetValue).length;
    }
    if (targetType === 'stage') {
      if (targetValue === 'completed_ced_evaluation') {
        return applications.filter(a => a.rounds?.r1?.status === 'selected' || a.stage === 'data_collection' || a.stage === 'ced_final' || a.stage === 'approval').length;
      }
      return applications.filter(a => a.stage === targetValue).length;
    }
    if (targetType === 'individual') return 1;
    return applications.length;
  };

  const handleApplyTemplate = (tpl) => {
    setTitle(tpl.title);
    setMessage(tpl.text);
    setType(tpl.type);
    setLinkPage(tpl.page);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    if (targetType === 'batch' && !targetValue) {
      alert('Please select a batch.');
      return;
    }
    if (targetType === 'stage' && !targetValue) {
      alert('Please select a pipeline stage.');
      return;
    }
    if (targetType === 'individual' && !targetValue) {
      alert('Please select a specific student / startup.');
      return;
    }

    sendNotification({
      title: title.trim(),
      text: message.trim(),
      type: type,
      targetType: targetType,
      targetValue: targetValue,
      link: { page: linkPage }
    });

    closeModal();
  };

  const filteredApps = searchTerm.trim()
    ? applications.filter(a =>
        a.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.applicationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.ideaName && a.ideaName.toLowerCase().includes(searchTerm.toLowerCase()))
      ).slice(0, 8)
    : applications.slice(0, 8);

  return (
    <div>
      <div className="modal-head">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon name="megaphone" size={18} /> Send Notification / Broadcast Message
        </h3>
        <button className="x" onClick={closeModal}><Icon name="x" /></button>
      </div>

      <form className="modal-body" onSubmit={handleSend}>
        {/* Quick Templates Ribbon */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--slate-500)', fontWeight: 700, marginBottom: '6px' }}>
            Quick Announcement Templates:
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {TEMPLATES.map(tpl => (
              <button
                key={tpl.label}
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={() => handleApplyTemplate(tpl)}
                style={{ fontSize: '11.5px' }}
              >
                + {tpl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Target Audience Selector */}
        <div className="card" style={{ padding: '16px', marginBottom: '16px', background: 'var(--slate-50)' }}>
          <label style={{ fontWeight: 800, fontSize: '13px', color: 'var(--navy-900)', display: 'block', marginBottom: '8px' }}>
            Select Target Audience
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
            {[
              { id: 'all', label: 'All Students' },
              { id: 'stage', label: 'By Pipeline Stage' },
              { id: 'batch', label: 'By Cohort Batch' },
              { id: 'individual', label: 'Specific Person' }
            ].map(opt => (
              <button
                key={opt.id}
                type="button"
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  border: targetType === opt.id ? '2px solid var(--cyan-600)' : '1px solid var(--slate-300)',
                  background: targetType === opt.id ? 'var(--cyan-50)' : '#fff',
                  color: targetType === opt.id ? 'var(--cyan-700)' : 'var(--slate-700)',
                  fontWeight: targetType === opt.id ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setTargetType(opt.id);
                  if (opt.id === 'stage' && !targetValue) setTargetValue('ced_evaluation');
                  if (opt.id === 'batch' && !targetValue) setTargetValue('2026-27');
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Conditional target selectors */}
          {targetType === 'stage' && (
            <div className="form-field">
              <label>Choose Stage Target</label>
              <select value={targetValue} onChange={e => setTargetValue(e.target.value)}>
                <option value="completed_ced_evaluation">🌟 Completed CED Evaluation (Round 1 Cleared / Selected)</option>
                {STAGES.map(s => (
                  <option key={s.key} value={s.key}>In {s.label} Stage</option>
                ))}
              </select>
            </div>
          )}

          {targetType === 'batch' && (
            <div className="form-field">
              <label>Choose Cohort Batch</label>
              <select value={targetValue} onChange={e => setTargetValue(e.target.value)}>
                <option value="2026-27">Batch 2026-27 (Current Active Cohort)</option>
                <option value="2025-26">Batch 2025-26</option>
                <option value="2024-25">Batch 2024-25</option>
              </select>
            </div>
          )}

          {targetType === 'individual' && (
            <div>
              <div className="form-field" style={{ marginBottom: '8px' }}>
                <label>Search &amp; Select Student</label>
                <input
                  type="text"
                  placeholder="Type student name or ID..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <div style={{ maxHeight: '140px', overflowY: 'auto', border: '1px solid var(--slate-200)', borderRadius: '6px', background: '#fff' }}>
                {filteredApps.map(a => (
                  <div
                    key={a.applicationId}
                    style={{
                      padding: '8px 12px',
                      borderBottom: '1px solid var(--slate-100)',
                      cursor: 'pointer',
                      background: targetValue === a.applicationId ? 'var(--cyan-50)' : '#fff',
                      fontSize: '12.5px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    onClick={() => setTargetValue(a.applicationId)}
                  >
                    <div>
                      <strong>{a.applicantName}</strong> &middot; <span style={{ color: 'var(--slate-500)' }}>{a.ideaName}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--cyan-700)' }}>
                      {a.applicationId}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ fontSize: '11.5px', color: 'var(--cyan-700)', fontWeight: 700, marginTop: '8px' }}>
            📢 Will be delivered to: {getTargetCount()} student(s)
          </div>
        </div>

        {/* Message Details */}
        <div className="form-grid" style={{ marginBottom: '14px' }}>
          <div className="form-field span-2">
            <label>Subject / Title <span className="req">*</span></label>
            <input
              type="text"
              required
              placeholder="e.g. Action Required: Upload Consent Letter Drive Link"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label>Notification Priority / Type</label>
            <select value={type} onChange={e => setType(e.target.value)}>
              <option value="info">Info / Announcement (Blue)</option>
              <option value="warning">Action Needed / Pending (Amber)</option>
              <option value="success">Congratulations / Approved (Green)</option>
              <option value="urgent">Urgent / Final Notice (Red)</option>
            </select>
          </div>

          <div className="form-field">
            <label>Link Student To Page</label>
            <select value={linkPage} onChange={e => setLinkPage(e.target.value)}>
              <option value="myDashboard">Home &amp; Status</option>
              <option value="myDocuments">Uploaded Documents</option>
              <option value="myApplication">My Application Details</option>
              <option value="myGrant">Grant Money &amp; Milestones</option>
              <option value="myTeam">My Team</option>
            </select>
          </div>

          <div className="form-field span-2">
            <label>Notification Message Body <span className="req">*</span></label>
            <textarea
              rows="4"
              required
              placeholder="Enter clear instructions or updates for the student..."
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-foot" style={{ padding: 0 }}>
          <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
          <button type="submit" className="btn btn-primary">
            <Icon name="send" /> Send Broadcast Notification
          </button>
        </div>
      </form>
    </div>
  );
};

export default SendNotificationModal;
