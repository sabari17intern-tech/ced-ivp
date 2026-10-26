import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/common/Icon';

const Login = () => {
  const { login, navigate, db, supabaseStatus } = useAuth();
  const [activeTab, setActiveTab] = useState('student'); // 'student' | 'admin'
  const [phone, setPhone] = useState('');
  const [adminUser, setAdminUser] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmed = phone.trim();
    if (!trimmed) {
      setError('Please enter your 10-digit mobile number.');
      return;
    }

    if (trimmed.toLowerCase() === 'admin') {
      setActiveTab('admin');
      return;
    }

    setLoading(true);
    try {
      const res = await login(trimmed);
      if (!res.success) {
        setError(res.error);
      }
    } catch (err) {
      setError('Failed to connect to database. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(adminUser, adminPassword);
      if (!res.success) {
        setError(res.error);
      }
    } catch (err) {
      setError('Admin sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalApps = db?.applications?.length || 0;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--navy-900)', color: '#fff' }}>
      {/* Left Branding Panel */}
      <div style={{ flex: 1, padding: '60px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'linear-gradient(135deg, var(--navy-900), var(--navy-700))' }}>
        <div>
          <img src="/CEDlogo.png" alt="CED Logo" style={{ height: '56px', background: '#fff', padding: '8px', borderRadius: '10px', marginBottom: '24px' }} />
          <h1 style={{ color: '#fff', fontSize: '32px', fontWeight: 800 }}>CED GRANT PROGRAMME</h1>
          <p style={{ color: 'var(--cyan-300)', marginTop: '8px', fontSize: '15px', fontWeight: 600 }}>
            Centre for Entrepreneurship Development &middot; Anna University
          </p>
          <p style={{ color: 'var(--slate-300)', marginTop: '16px', fontSize: '14px', maxWidth: '500px', lineHeight: 1.6 }}>
            Comprehensive incubation & grant management system supporting student founders with up to ₹3,00,000 grant funding, multi-stage evaluation, and milestone releases.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginTop: '40px' }}>
          <div style={{ background: 'rgba(255,255,255,0.06)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ color: 'var(--cyan-400)', fontWeight: 700, fontSize: '18px' }}>₹3,00,000</div>
            <div style={{ fontSize: '12px', color: 'var(--slate-300)', marginTop: '4px' }}>Max Grant Sanction</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ color: 'var(--cyan-400)', fontWeight: 700, fontSize: '18px' }}>3 Phases</div>
            <div style={{ fontSize: '12px', color: 'var(--slate-300)', marginTop: '4px' }}>40% / 40% / 20% Release</div>
          </div>
        </div>
      </div>

      {/* Right Login Form Panel */}
      <div style={{ width: '480px', background: '#fff', color: 'var(--slate-900)', padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        
        {/* Tab Switcher */}
        <div style={{ display: 'flex', background: 'var(--slate-100)', padding: '4px', borderRadius: '10px', marginBottom: '24px' }}>
          <button
            type="button"
            onClick={() => { setActiveTab('student'); setError(''); }}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === 'student' ? '#fff' : 'transparent',
              color: activeTab === 'student' ? 'var(--navy-900)' : 'var(--slate-500)',
              boxShadow: activeTab === 'student' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            Student Sign-In
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('admin'); setError(''); }}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === 'admin' ? '#fff' : 'transparent',
              color: activeTab === 'admin' ? 'var(--navy-900)' : 'var(--slate-500)',
              boxShadow: activeTab === 'admin' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            Admin Sign-In
          </button>
        </div>

        {error && (
          <div className="callout callout-danger" style={{ marginBottom: '16px' }}>
            <Icon name="warn" />
            <span>{error}</span>
          </div>
        )}

        {/* Student Login Form: PHONE ONLY, NO PASSWORD */}
        {activeTab === 'student' ? (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--navy-900)', margin: 0 }}>Student Sign In</h2>
              <p style={{ color: 'var(--slate-500)', fontSize: '13.5px', marginTop: '6px' }}>
                Sign in with your registered 10-digit mobile number
              </p>
            </div>

            <form noValidate onSubmit={handleStudentSubmit}>
              <div className="form-field" style={{ marginBottom: '24px' }}>
                <label style={{ fontWeight: 600, fontSize: '13px', color: 'var(--slate-700)', marginBottom: '8px', display: 'block' }}>
                  Mobile Number / Member ID
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9443533618"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoFocus
                  required
                  style={{
                    width: '100%',
                    padding: '13px 14px',
                    fontSize: '15px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--slate-300)',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.5px'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-block"
                style={{ padding: '13px', fontSize: '14.5px', fontWeight: 700 }}
              >
                {loading ? 'Connecting & Verifying...' : 'Sign In to Portal'}
              </button>
            </form>
          </div>
        ) : (
          /* Admin Login Form */
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--navy-900)', margin: 0 }}>Admin Sign In</h2>
              <p style={{ color: 'var(--slate-500)', fontSize: '13.5px', marginTop: '6px' }}>
                Authorized CED Programme Officers & Reviewers
              </p>
            </div>

            <form noValidate onSubmit={handleAdminSubmit}>
              <div className="form-field" style={{ marginBottom: '16px' }}>
                <label style={{ fontWeight: 600, fontSize: '13px', color: 'var(--slate-700)', marginBottom: '6px', display: 'block' }}>
                  Admin Username
                </label>
                <input
                  type="text"
                  placeholder="admin"
                  value={adminUser}
                  onChange={(e) => setAdminUser(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    fontSize: '14.5px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--slate-300)'
                  }}
                />
              </div>

              <div className="form-field" style={{ marginBottom: '20px' }}>
                <label style={{ fontWeight: 600, fontSize: '13px', color: 'var(--slate-700)', marginBottom: '6px', display: 'block' }}>
                  Password
                </label>
                <input
                  type="password"
                  placeholder="admin123"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    fontSize: '14.5px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--slate-300)'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-block"
                style={{ padding: '13px', fontSize: '14.5px', fontWeight: 700 }}
              >
                {loading ? 'Signing In...' : 'Sign In as Admin'}
              </button>
            </form>
          </div>
        )}

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--slate-500)' }}>
          Don't have a Grant account yet?{' '}
          <span
            style={{ color: 'var(--cyan-700)', fontWeight: 700, cursor: 'pointer' }}
            onClick={() => navigate('register')}
          >
            Register Student Account
          </span>
        </div>

        {/* Live Supabase Status Indicator */}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--slate-200)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--slate-500)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: supabaseStatus === 'connected' ? '#22c55e' : supabaseStatus === 'connecting' ? '#eab308' : '#ef4444',
                display: 'inline-block'
              }}
            />
            <span>
              {supabaseStatus === 'connected'
                ? `Supabase Cloud Connected (${totalApps} Applications)`
                : supabaseStatus === 'connecting'
                ? 'Connecting to Supabase Cloud...'
                : 'Offline Mode (Local Storage)'}
            </span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--slate-400)' }}>v6.4</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
