import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { fmtMoney, fmtDate } from '../../services/utils';

const MyGrant = () => {
  const { db, currentUser } = useAuth();
  const app = (db.applications || []).find(a => 
    (currentUser?.linkedApplicationId && a.applicationId === currentUser.linkedApplicationId) ||
    (a.phone && currentUser?.username && a.phone.replace(/\D/g, '').slice(-10) === currentUser.username.replace(/\D/g, '').slice(-10)) ||
    (currentUser?.name && a.applicantName === currentUser.name)
  );

  if (!app || !app.grant || !app.grant.approvedAmount) {
    return (
      <div className="card" style={{ padding: '30px', textAlign: 'center' }}>
        <h3>Grant Sanction Pending</h3>
        <p style={{ fontSize: '13px', color: 'var(--slate-500)', marginTop: '6px' }}>
          Your grant status will update here once approved by CED Anna University.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Grant Sanction & Disbursement Status</h1>
          <div className="desc">Sanction Letter: <strong>{app.grant.sanctionLetterNo}</strong></div>
        </div>
      </div>

      <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', color: 'var(--success)' }}>
          Sanctioned Amount: {fmtMoney(app.grant.approvedAmount)}
        </h3>
        <div style={{ fontSize: '13px', color: 'var(--slate-500)', marginTop: '4px' }}>
          Approval Date: {fmtDate(app.grant.approvalDate)}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div className="card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '12px', color: 'var(--slate-500)', fontWeight: 700 }}>Phase 1 Release (40%)</div>
          <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px', color: 'var(--navy-900)' }}>{fmtMoney(app.grant.phase1?.amount || 0)}</div>
          <div style={{ marginTop: '8px' }}>
            <span className={`badge ${app.grant.phase1?.status === 'released' ? 'badge-success' : 'badge-warning'}`}>
              {(app.grant.phase1?.status || 'pending').toUpperCase()}
            </span>
          </div>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '12px', color: 'var(--slate-500)', fontWeight: 700 }}>Phase 2 Release (40%)</div>
          <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px', color: 'var(--navy-900)' }}>{fmtMoney(app.grant.phase2?.amount || 0)}</div>
          <div style={{ marginTop: '8px' }}>
            <span className={`badge ${app.grant.phase2?.status === 'released' ? 'badge-success' : 'badge-warning'}`}>
              {(app.grant.phase2?.status || 'pending').toUpperCase()}
            </span>
          </div>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '12px', color: 'var(--slate-500)', fontWeight: 700 }}>Phase 3 Release (20%)</div>
          <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px', color: 'var(--navy-900)' }}>{fmtMoney(app.grant.phase3?.amount || 0)}</div>
          <div style={{ marginTop: '8px' }}>
            <span className={`badge ${app.grant.phase3?.status === 'released' ? 'badge-success' : 'badge-warning'}`}>
              {(app.grant.phase3?.status || 'pending').toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyGrant;
