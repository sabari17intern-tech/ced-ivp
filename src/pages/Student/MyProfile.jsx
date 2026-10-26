import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/common/Icon';

const MyProfile = () => {
  const { currentUser } = useAuth();

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>My Profile</h1>
          <div className="desc">Logged in as {currentUser ? currentUser.name : 'Student'}</div>
        </div>
      </div>

      <div className="card" style={{ padding: '24px', maxWidth: '480px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Account Information</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--slate-400)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Name</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--slate-800)' }}>{currentUser?.name || '—'}</div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: 'var(--slate-400)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Login ID (Phone Number)</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--slate-800)', fontFamily: 'var(--font-mono)' }}>{currentUser?.username || '—'}</div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: 'var(--slate-400)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Authentication Method</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="check" size={14} className="text-success" />
              <span style={{ fontSize: '13px', color: 'var(--slate-600)' }}>
                Direct Mobile Number Sign-In (<strong>Passwordless Access Enabled</strong>)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
