import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Icon from '../common/Icon';
import { fmtRelative, stageIndex } from '../../services/utils';

const Topbar = ({ onToggleSidebar }) => {
  const { db, currentUser, navigate, openDrawer, openModal, markNotificationRead } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const searchRef = useRef(null);
  const notifRef = useRef(null);

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';

  // Find student's application if applicant
  const userApp = !isAdmin ? (db.applications || []).find(a => 
    (currentUser?.linkedApplicationId && a.applicationId === currentUser.linkedApplicationId) ||
    (a.phone && currentUser?.username && a.phone.replace(/\D/g, '').slice(-10) === currentUser.username.replace(/\D/g, '').slice(-10)) ||
    (currentUser?.name && a.applicantName === currentUser.name)
  ) : null;

  // Filter relevant notifications
  const relevantNotifs = (db.notifications || []).filter(n => {
    if (isAdmin) return true;
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

  const unreadCount = relevantNotifs.filter(n => {
    if (isAdmin) return !n.read;
    const readBy = Array.isArray(n.readBy) ? n.readBy : [];
    return !readBy.includes(currentUser?.username);
  }).length;

  const searchResults = searchQuery.trim() ? (db.applications || []).filter(app => {
    const q = searchQuery.toLowerCase();
    return (
      (app.applicationId && app.applicationId.toLowerCase().includes(q)) ||
      (app.applicantName && app.applicantName.toLowerCase().includes(q)) ||
      (app.phone && app.phone.includes(q)) ||
      (app.ideaName && app.ideaName.toLowerCase().includes(q))
    );
  }).slice(0, 6) : [];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = currentUser.name
    ? currentUser.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  const handleNotificationClick = (n) => {
    markNotificationRead(n.notifId);
    if (n.link && n.link.page) {
      navigate(n.link.page);
    } else if (!isAdmin) {
      navigate('myNotifications');
    }
    setShowNotifPanel(false);
  };

  return (
    <header id="topbar">
      <button id="menuToggle" onClick={onToggleSidebar} aria-label="Toggle Menu">
        <Icon name="workflow" size={22} />
      </button>

      <div className="topbar-search" ref={searchRef}>
        <Icon name="search" />
        <input
          type="text"
          placeholder="Search Grant ID, name, phone, idea, team..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSearchResults(true);
          }}
          onFocus={() => setShowSearchResults(true)}
        />
        {showSearchResults && searchQuery.trim() && (
          <div className="search-results">
            {searchResults.length > 0 ? (
              searchResults.map(app => (
                <div
                  key={app.applicationId}
                  className="sr-item"
                  onClick={() => {
                    openDrawer(app.applicationId);
                    setShowSearchResults(false);
                    setSearchQuery('');
                  }}
                >
                  <div className="t1">{app.applicantName} ({app.applicationId})</div>
                  <div className="t2">{app.ideaName || 'No idea name'} &middot; {app.phone}</div>
                </div>
              ))
            ) : (
              <div className="sr-empty">No matching applications found</div>
            )}
          </div>
        )}
      </div>

      <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {isAdmin && (
          <button
            className="btn btn-primary btn-xs"
            onClick={() => openModal('sendNotification')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontWeight: 700,
              fontSize: '12px',
              background: 'linear-gradient(135deg, var(--cyan-600), var(--navy-800))',
              border: 'none',
              boxShadow: '0 2px 8px rgba(6, 182, 212, 0.25)'
            }}
            title="Send notification or broadcast announcement to students"
          >
            <Icon name="megaphone" size={13} />
            <span>Send Notice</span>
          </button>
        )}

        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            className="icon-btn"
            onClick={() => setShowNotifPanel(!showNotifPanel)}
            title="Notifications"
          >
            <Icon name="bell" />
            {unreadCount > 0 && <span className="notif-dot" />}
          </button>

          {showNotifPanel && (
            <div className="dropdown-panel" style={{ width: '340px' }}>
              <div className="dropdown-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0 }}>Notifications ({unreadCount} unread)</h4>
                {isAdmin ? (
                  <button
                    className="btn btn-primary btn-xs"
                    onClick={() => { setShowNotifPanel(false); openModal('sendNotification'); }}
                    style={{ fontSize: '11px', padding: '3px 8px' }}
                  >
                    + Compose
                  </button>
                ) : (
                  <button
                    className="btn btn-secondary btn-xs"
                    onClick={() => { setShowNotifPanel(false); navigate('myNotifications'); }}
                    style={{ fontSize: '11px', padding: '3px 8px' }}
                  >
                    View All
                  </button>
                )}
              </div>
              <div className="dropdown-body">
                {relevantNotifs.length > 0 ? (
                  relevantNotifs.slice(0, 6).map((n, idx) => {
                    const isRead = isAdmin ? n.read : (Array.isArray(n.readBy) && n.readBy.includes(currentUser?.username));
                    return (
                      <div
                        key={`${n.notifId || 'notif'}-${idx}`}
                        className={`notif-item ${isRead ? 'read' : ''}`}
                        onClick={() => handleNotificationClick(n)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div
                          className="dot"
                          style={{
                            background: n.type === 'urgent' ? 'var(--danger)' : n.type === 'warning' ? 'var(--warning)' : n.type === 'success' ? 'var(--success)' : 'var(--cyan-500)'
                          }}
                        />
                        <div className="txt">
                          {n.title && <div style={{ fontWeight: 700, fontSize: '12.5px', marginBottom: '2px', color: 'var(--navy-900)' }}>{n.title}</div>}
                          <div>{n.text}</div>
                          <div className="time" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                            <span>{fmtRelative(n.createdAt)}</span>
                            {n.targetType && n.targetType !== 'all' && (
                              <span style={{ color: 'var(--cyan-700)', fontWeight: 600 }}>
                                {n.targetType === 'stage' ? `Stage: ${n.targetValue}` : n.targetType === 'batch' ? `Batch ${n.targetValue}` : 'Direct Message'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--slate-400)', fontSize: '13px' }}>
                    No notifications
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div
          className="topbar-org"
          onClick={() => navigate(isAdmin ? 'settings' : 'myProfile')}
          style={{ cursor: 'pointer' }}
        >
          <div className="avatar">{initials}</div>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>{currentUser.name.split(' ')[0]}</span>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
