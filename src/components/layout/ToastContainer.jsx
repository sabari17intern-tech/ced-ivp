import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Icon from '../common/Icon';

const ToastContainer = () => {
  const { toasts } = useAuth();
  if (!toasts || toasts.length === 0) return null;

  return (
    <div id="toastContainer">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type || 'info'}`}>
          <Icon name={t.type === 'success' ? 'check' : t.type === 'danger' ? 'x' : t.type === 'warning' ? 'warn' : 'info'} />
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
