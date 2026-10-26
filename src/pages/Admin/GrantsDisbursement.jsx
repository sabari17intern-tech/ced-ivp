import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/common/Icon';
import { fmtMoney, fmtDate, todayISO } from '../../services/utils';

const GrantsDisbursement = () => {
  const { db, updateDb, openModal, openDrawer, showToast } = useAuth();
  const applications = db.applications || [];

  const sanctionedApps = applications.filter(a => a.grant && a.grant.approvedAmount > 0);

  const handleTogglePhase = (appId, phaseNum) => {
    const phKey = `phase${phaseNum}`;
    const updatedApps = db.applications.map(a => {
      if (a.applicationId === appId) {
        const curGrant = a.grant || {};
        const curPhase = curGrant[phKey] || {};
        const currentStatus = curPhase.status || 'pending';
        const newStatus = currentStatus === 'released' ? 'pending' : 'released';
        
        const grant = {
          ...curGrant,
          [phKey]: {
            ...curPhase,
            status: newStatus,
            releaseDate: newStatus === 'released' ? todayISO() : ''
          }
        };

        const history = [
          ...(a.history || []),
          {
            date: todayISO(),
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            user: 'Admin',
            action: `Phase ${phaseNum} Money ${newStatus === 'released' ? 'Released' : 'Set Pending'}`,
            from: currentStatus,
            to: newStatus,
            remarks: `Phase ${phaseNum} amount: ${fmtMoney(curPhase.amount || 0)}`
          }
        ];

        return { ...a, grant, history };
      }
      return a;
    });

    updateDb({ ...db, applications: updatedApps });
    showToast(`Updated Phase ${phaseNum} status`, 'success');
  };

  const totalSanctioned = sanctionedApps.reduce((acc, a) => acc + (a.grant.approvedAmount || 0), 0);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Grant Disbursements & Sanctions</h1>
          <div className="desc">Total Sanctioned: <strong style={{ color: 'var(--success)' }}>{fmtMoney(totalSanctioned)}</strong> &middot; {sanctionedApps.length} student(s)</div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <h3>Sanctioned Grants ({sanctionedApps.length})</h3>
        </div>
        <div className="tbl-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Grant ID</th>
                <th>Applicant Name</th>
                <th>Sanction Letter No</th>
                <th>Approved Amount</th>
                <th>Phase 1 (40%)</th>
                <th>Phase 2 (40%)</th>
                <th>Phase 3 (20%)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sanctionedApps.length > 0 ? (
                sanctionedApps.map(app => {
                  const p1 = app.grant?.phase1 || { status: 'pending', amount: 0 };
                  const p2 = app.grant?.phase2 || { status: 'pending', amount: 0 };
                  const p3 = app.grant?.phase3 || { status: 'pending', amount: 0 };
                  return (
                    <tr key={app.applicationId}>
                      <td className="cell-id">{app.applicationId}</td>
                      <td className="cell-strong">{app.applicantName}</td>
                      <td>{app.grant?.sanctionLetterNo || '—'}</td>
                      <td style={{ fontWeight: 700, color: 'var(--success)' }}>{fmtMoney(app.grant?.approvedAmount || 0)}</td>
                      <td>
                        <button
                          className={`btn btn-sm ${p1.status === 'released' ? 'btn-accent' : 'btn-secondary'}`}
                          onClick={() => handleTogglePhase(app.applicationId, 1)}
                        >
                          {fmtMoney(p1.amount)} ({(p1.status || 'pending').toUpperCase()})
                        </button>
                      </td>
                      <td>
                        <button
                          className={`btn btn-sm ${p2.status === 'released' ? 'btn-accent' : 'btn-secondary'}`}
                          onClick={() => handleTogglePhase(app.applicationId, 2)}
                        >
                          {fmtMoney(p2.amount)} ({(p2.status || 'pending').toUpperCase()})
                        </button>
                      </td>
                      <td>
                        <button
                          className={`btn btn-sm ${p3.status === 'released' ? 'btn-accent' : 'btn-secondary'}`}
                          onClick={() => handleTogglePhase(app.applicationId, 3)}
                        >
                          {fmtMoney(p3.amount)} ({(p3.status || 'pending').toUpperCase()})
                        </button>
                      </td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => openModal('sanctionGrant', { app })}>
                          <Icon name="edit" /> Edit
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="table-empty">
                    No sanctioned grants recorded yet. Click on any application drawer to sanction grants.
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

export default GrantsDisbursement;
