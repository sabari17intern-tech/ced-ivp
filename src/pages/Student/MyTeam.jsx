import React from 'react';
import { useAuth } from '../../context/AuthContext';

const MyTeam = () => {
  const { db, currentUser } = useAuth();
  const app = (db.applications || []).find(a => 
    (currentUser?.linkedApplicationId && a.applicationId === currentUser.linkedApplicationId) ||
    (a.phone && currentUser?.username && a.phone.replace(/\D/g, '').slice(-10) === currentUser.username.replace(/\D/g, '').slice(-10)) ||
    (currentUser?.name && a.applicantName === currentUser.name)
  );

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>My Team Founders</h1>
          <div className="desc">Team Application: {app ? app.applicantName : 'Student Team'}</div>
        </div>
      </div>

      <div className="card" style={{ padding: '24px', maxWidth: '640px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '14px' }}>Founding Members</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ padding: '12px', background: 'var(--slate-50)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>{app ? app.applicantName : 'Lead Founder'}</div>
              <div style={{ fontSize: '12px', color: 'var(--slate-500)' }}>Team Leader &middot; {app ? app.phone : ''}</div>
            </div>
            <span className="badge badge-success">Lead Founder</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTeam;
