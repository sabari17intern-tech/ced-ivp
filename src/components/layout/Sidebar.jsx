import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Icon from '../common/Icon';

const ADMIN_NAV = [
  { key: 'workflow', label: 'Workflow', icon: 'workflow' },
  { key: 'startups', label: 'Startups', icon: 'rocket' },
  { key: 'applications', label: 'Applications', icon: 'applications' },
  { key: 'evaluations', label: 'Evaluations', icon: 'evaluations' },
  { key: 'reviewers', label: 'Reviewer Activity', icon: 'userCheck' },
  { key: 'edi', label: 'Grant Review', icon: 'edi' },
  { key: 'grants', label: 'Grants', icon: 'grants' },
  { key: 'analytics', label: 'Analytics', icon: 'chart' },
  { key: 'documents', label: 'Documents', icon: 'documents' },
  { key: 'reports', label: 'Reports', icon: 'reports' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
];

const APPLICANT_NAV = [
  { key: 'myDashboard', label: 'Home & Status', icon: 'dashboard' },
  { key: 'myApplication', label: 'My Details', icon: 'applications' },
  { key: 'myTeam', label: 'My Team', icon: 'teams' },
  { key: 'myDocuments', label: 'Documents', icon: 'documents' },
  { key: 'myGrant', label: 'Grant Money', icon: 'grants' },
  { key: 'myNotifications', label: 'Notifications', icon: 'bell' },
  { key: 'myProfile', label: 'Profile', icon: 'settings' },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { currentUser, currentPage, navigate, logout } = useAuth();
  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';
  const navItems = isAdmin ? ADMIN_NAV : APPLICANT_NAV;

  const initials = currentUser.name
    ? currentUser.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <>
      <div 
        className={`sidebar-backdrop ${isOpen ? 'show' : ''}`}
        style={{
          display: isOpen ? 'block' : 'none',
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.5)',
          zIndex: 55
        }}
        onClick={onClose}
      />
      <aside id="sidebar" className={isOpen ? 'open' : ''}>
        <div className="sidebar-brand">
          <img src="/CEDlogo.png" alt="CED Logo" className="brand-logo" />
          <div className="org">CED GRANT</div>
          <div className="sub">CED &middot; ANNA UNIVERSITY</div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">
            {isAdmin ? 'Grant Management' : 'My Portal'}
          </div>
          {navItems.map(item => (
            <button
              key={item.key}
              className={`nav-item ${currentPage === item.key ? 'active' : ''}`}
              onClick={() => {
                navigate(item.key);
                onClose();
              }}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div 
            className="sidebar-user" 
            onClick={() => {
              navigate(isAdmin ? 'settings' : 'myProfile');
              onClose();
            }}
          >
            <div className="avatar">{initials}</div>
            <div>
              <div className="name">{currentUser.name}</div>
              <div className="role">{isAdmin ? (currentUser.title || 'Administrator') : 'Grant Applicant'}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}>
            <Icon name="logout" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
