import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Icon from './Icon';
import { waLink } from '../../services/utils';

const WhatsAppBtn = () => {
  const { db, currentUser } = useAuth();

  let message = "Hi, I need help with my CED Grant Application.";
  if (currentUser && currentUser.role === 'applicant') {
    const app = (db.applications || []).find(a => a.phone === currentUser.username || a.applicantName === currentUser.name);
    if (app) {
      message = `Hi, I need help with my Grant Application.\nName: ${app.applicantName}\nGrant ID: ${app.applicationId}\nIdea: ${app.ideaName}`;
    }
  }

  const link = waLink('9884681132', message);

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-float-btn"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: '#25D366',
        color: '#fff',
        padding: '12px 20px',
        borderRadius: '50px',
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontWeight: 600,
        boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
        zIndex: 9999,
        fontSize: '13.5px',
        transition: 'transform 0.2s ease'
      }}
    >
      <Icon name="whatsapp" size={20} />
      WhatsApp Support
    </a>
  );
};

export default WhatsAppBtn;
