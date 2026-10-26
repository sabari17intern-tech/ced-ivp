import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Icon from '../common/Icon';
import { todayISO, fmtMoney, stageLabel } from '../../services/utils';

const SanctionGrantModal = () => {
  const { db, updateDb, modalParams, closeModal, showToast } = useAuth();
  const app = modalParams ? modalParams.app : null;

  const [letterNo, setLetterNo] = useState(app && app.grant ? app.grant.sanctionLetterNo || '' : '');
  const [approvalDate, setApprovalDate] = useState(app && app.grant && app.grant.approvalDate ? app.grant.approvalDate : todayISO());
  const [grantAmount, setGrantAmount] = useState(app && app.grant ? app.grant.approvedAmount || 200000 : 200000);

  if (!app) return null;

  const handleConfirm = () => {
    if (!letterNo.trim()) {
      showToast('Sanction Letter No. is required.', 'warning');
      return;
    }
    const amt = Number(grantAmount);
    if (!amt || amt <= 0) {
      showToast('Enter a valid sanction grant amount.', 'warning');
      return;
    }

    const p1 = Math.round(amt * 0.4);
    const p2 = Math.round(amt * 0.4);
    const p3 = amt - p1 - p2;

    const updatedApps = db.applications.map(a => {
      if (a.applicationId === app.applicationId) {
        const curGrant = a.grant || {};
        const grant = {
          ...curGrant,
          sanctionLetterNo: letterNo.trim(),
          approvalDate: approvalDate,
          approvedAmount: amt,
          phase1: { ...(curGrant.phase1 || {}), amount: p1, eligibleAmount: p1 },
          phase2: { ...(curGrant.phase2 || {}), amount: p2, eligibleAmount: p2 },
          phase3: { ...(curGrant.phase3 || {}), amount: p3, eligibleAmount: p3 },
        };

        const now = todayISO();
        const history = [
          ...(a.history || []),
          {
            date: now,
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            user: 'Admin',
            action: `Grant Sanctioned: ${fmtMoney(amt)}`,
            from: stageLabel(a.stage),
            to: 'Grant Sanctioned',
            remarks: `Sanction Letter: ${letterNo.trim()}`
          }
        ];

        return { ...a, grant, history, stage: a.stage === 'registration' || a.stage === 'bootcamp' ? 'approval' : a.stage };
      }
      return a;
    });

    updateDb({ ...db, applications: updatedApps });
    showToast(`Sanctioned ${fmtMoney(amt)} grant for ${app.applicantName}`, 'success');
    closeModal();
  };

  return (
    <div>
      <div className="modal-head">
        <h3>Record Grant Sanction & Disbursement</h3>
        <button className="x" onClick={closeModal}><Icon name="x" /></button>
      </div>

      <div className="modal-body">
        <div className="callout callout-info" style={{ marginBottom: '16px' }}>
          <Icon name="info" />
          <span>Sanctioning grant for <b>{app.applicantName} ({app.applicationId})</b>. Money will automatically be split into 3 phases: 40% / 40% / 20%.</span>
        </div>

        <div className="form-grid">
          <div className="form-field span-2">
            <label>Sanction Letter No. <span className="req">*</span></label>
            <input
              type="text"
              placeholder="e.g. CED/IVP/2026/GRANT/042"
              value={letterNo}
              onChange={(e) => setLetterNo(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label>Approval Date</label>
            <input
              type="date"
              value={approvalDate}
              onChange={(e) => setApprovalDate(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label>Total Grant Amount (₹) <span className="req">*</span></label>
            <input
              type="number"
              min="1000"
              max="300000"
              value={grantAmount}
              onChange={(e) => setGrantAmount(e.target.value)}
            />
            <div className="hint">Max ₹3,00,000</div>
          </div>
        </div>

        <div style={{ marginTop: '16px', background: 'var(--slate-50)', padding: '14px', borderRadius: '8px' }}>
          <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>Automatic Phase Breakdown:</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '12.5px' }}>
            <div>Phase 1 (40%): <strong>{fmtMoney(Math.round(grantAmount * 0.4))}</strong></div>
            <div>Phase 2 (40%): <strong>{fmtMoney(Math.round(grantAmount * 0.4))}</strong></div>
            <div>Phase 3 (20%): <strong>{fmtMoney(grantAmount - 2 * Math.round(grantAmount * 0.4))}</strong></div>
          </div>
        </div>
      </div>

      <div className="modal-foot">
        <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
        <button className="btn btn-primary" onClick={handleConfirm}>
          <Icon name="check" /> Sanction Grant
        </button>
      </div>
    </div>
  );
};

export default SanctionGrantModal;
