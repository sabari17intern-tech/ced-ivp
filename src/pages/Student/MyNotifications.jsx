import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/common/Icon';
import { fmtRelative, stageIndex, fmtDate } from '../../services/utils';

const MyNotifications = () => {
  const { db, currentUser, navigate, markNotificationRead } = useAuth();

  const userApp = (db.applications || []).find(a => 
    (currentUser?.linkedApplicationId && a.applicationId === currentUser.linkedApplicationId) ||
    (a.phone && currentUser?.username && a.phone.replace(/\D/g, '').slice(-10) === currentUser.username.replace(/\D/g, '').slice(-10)) ||
    (currentUser?.name && a.applicantName === currentUser.name)
  );

  const notifications = (db.notifications || []).filter(n => {
    if (!userApp) return true;
    if (!n.targetType || n.targetType === 'all') return true;
    if (n.targetType === 'batch' && (userApp.batch === n.targetValue || String(userApp.createdDate).slice(0, 4) === n.targetValue)) return true;
    if (n.targetType === 'stage') {
      if (n.targetValue === 'completed_ced_evaluation') {
        return userApp.rounds?.r1?.status === 'selected' || stageIndex(userApp.stage) > stageIndex('ced_evaluation');
      }
      return userApp.stage === n.targetValue;
    }
    if (n.targetType === 'individual') {
      return n.targetValue === userApp.applicationId || n.targetValue === userApp.phone || n.targetValue === currentUser?.username;
    }
    return true;
  });

  const handleMarkAllRead = () => {
    notifications.forEach(n => markNotificationRead(n.notifId));
  };

  const getPriorityStyle = (type) => {
    switch (type) {
      case 'urgent': return { bg: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid var(--danger-border)', badge: 'badge-danger', label: 'URGENT' };
      case 'warning': return { bg: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', border: '1px solid rgba(245, 158, 11, 0.3)', badge: 'badge-warning', label: 'ACTION REQUIRED' };
      case 'success': return { bg: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.3)', badge: 'badge-success', label: 'UPDATE / APPROVED' };
      default: return { bg: 'var(--cyan-50)', color: 'var(--cyan-700)', border: '1px solid var(--cyan-200)', badge: 'badge-info', label: 'ANNOUNCEMENT' };
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>My Notifications &amp; Announcements</h1>
          <div className="desc">Official alerts, evaluation decisions &amp; action notices from CED Anna University</div>
        </div>
        {notifications.length > 0 && (
          <div className="page-actions">
            <button className="btn btn-secondary btn-sm" onClick={handleMarkAllRead}>
              <Icon name="check" size={13} /> Mark All as Read
            </button>
          </div>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center', background: '#fff' }}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>🔔</div>
          <h3 style={{ fontSize: '16px', color: 'var(--navy-900)', margin: '0 0 6px 0' }}>No Notifications Yet</h3>
          <p style={{ color: 'var(--slate-500)', fontSize: '13.5px', margin: 0 }}>
            You're all caught up! New alerts from the CED administration will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {notifications.map((n, idx) => {
            const isRead = Array.isArray(n.readBy) && n.readBy.includes(currentUser?.username);
            const pStyle = getPriorityStyle(n.type);

            return (
              <div
                key={`${n.notifId || 'notif'}-${idx}`}
                className="card"
                style={{
                  padding: '20px',
                  background: isRead ? '#fff' : '#fcfdff',
                  borderLeft: `4px solid ${pStyle.color}`,
                  borderTop: isRead ? '1px solid var(--slate-200)' : '1px solid var(--cyan-200)',
                  borderRight: isRead ? '1px solid var(--slate-200)' : '1px solid var(--cyan-200)',
                  borderBottom: isRead ? '1px solid var(--slate-200)' : '1px solid var(--cyan-200)',
                  boxShadow: isRead ? 'var(--shadow-sm)' : '0 4px 14px rgba(6, 182, 212, 0.08)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span className={`badge ${pStyle.badge}`} style={{ fontSize: '10.5px' }}>
                      {pStyle.label}
                    </span>

                    {n.targetType && n.targetType !== 'all' && (
                      <span style={{
                        fontSize: '11px',
                        background: 'var(--slate-100)',
                        color: 'var(--slate-700)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: 600
                      }}>
                        🎯 {n.targetType === 'stage' ? `Target: ${n.targetValue}` : n.targetType === 'batch' ? `Batch ${n.targetValue}` : 'Direct Message'}
                      </span>
                    )}

                    {!isRead && (
                      <span style={{ fontSize: '10.5px', color: 'var(--cyan-700)', fontWeight: 800 }}>
                        ● NEW
                      </span>
                    )}
                  </div>

                  <span style={{ fontSize: '12px', color: 'var(--slate-400)' }}>
                    {fmtDate(n.createdAt)} &middot; {fmtRelative(n.createdAt)}
                  </span>
                </div>

                {n.title && (
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy-900)', margin: '0 0 8px 0' }}>
                    {n.title}
                  </h3>
                )}

                <div style={{ fontSize: '13.5px', color: 'var(--slate-800)', lineHeight: 1.6, marginBottom: '16px' }}>
                  {n.text}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--slate-100)', flexWrap: 'wrap', gap: '10px' }}>
                  <span style={{ fontSize: '11.5px', color: 'var(--slate-400)' }}>
                    From: <strong>{n.sender || 'CED Programme Office, Anna University'}</strong>
                  </span>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    {!isRead && (
                      <button
                        className="btn btn-secondary btn-xs"
                        onClick={() => markNotificationRead(n.notifId)}
                      >
                        Mark as Read
                      </button>
                    )}

                    {n.link && n.link.page && (
                      <button
                        className="btn btn-primary btn-xs"
                        onClick={() => {
                          markNotificationRead(n.notifId);
                          navigate(n.link.page);
                        }}
                      >
                        Go to Action Page <Icon name="arrowRight" size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyNotifications;
