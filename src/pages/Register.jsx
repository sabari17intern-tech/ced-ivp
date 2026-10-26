import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/common/Icon';
import { SECTORS } from '../services/utils';

const Register = () => {
  const { register, navigate } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    gender: '',
    dob: '',
    caste: '',
    college: '',
    dept: '',
    year: '1st Year',
    rollno: '',
    district: '',
    idea: '',
    problem: '',
    solution: '',
    sector: SECTORS[0],
    type: 'individual',
    funding: 200000,
    registered: 'No',
    ppt: '',
    udyam: ''
  });

  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const res = register(formData);
    if (!res.success) {
      setError(res.error);
    } else {
      setSuccessInfo(res);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--slate-50)', padding: '40px 20px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img src="/CEDlogo.png" alt="CED Logo" style={{ height: '48px', background: '#fff', padding: '6px', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }} />
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginTop: '12px', color: 'var(--navy-900)' }}>
            Student Grant Application & Self-Registration
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--slate-500)' }}>
            Centre for Entrepreneurship Development, Anna University
          </p>
        </div>

        {successInfo ? (
          <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '99px', background: 'var(--success-bg)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Icon name="check" size={24} />
            </div>
            <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Registration Successful!</h3>
            <p style={{ fontSize: '14px', color: 'var(--slate-600)', marginBottom: '16px' }}>
              Your Grant Application ID has been created: <strong style={{ color: 'var(--cyan-700)', fontFamily: 'var(--font-mono)' }}>{successInfo.appId}</strong>
            </p>
            <p style={{ fontSize: '13px', color: 'var(--slate-500)', marginBottom: '24px' }}>
              You can now sign in immediately using just your mobile number: <strong>{successInfo.phone}</strong> (no password required).
            </p>
            <button className="btn btn-primary" onClick={() => navigate('login')}>
              Go to Sign In
            </button>
          </div>
        ) : (
          <form className="card" style={{ padding: '28px' }} onSubmit={handleSubmit}>
            {error && (
              <div className="callout callout-danger" style={{ marginBottom: '20px' }}>
                <Icon name="warn" />
                <span>{error}</span>
              </div>
            )}

            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--navy-900)', borderBottom: '1px solid var(--slate-200)', paddingBottom: '8px', marginBottom: '16px' }}>
              1. Personal & Contact Information
            </div>

            <div className="form-grid" style={{ marginBottom: '20px' }}>
              <div className="form-field span-2">
                <label>Full Name <span className="req">*</span></label>
                <input id="name" type="text" placeholder="As per college records" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="form-field">
                <label>Phone Number (Login ID) <span className="req">*</span></label>
                <input id="phone" type="tel" placeholder="10-digit mobile number" value={formData.phone} onChange={handleChange} required />
              </div>
              <div className="form-field">
                <label>Email Address</label>
                <input id="email" type="email" placeholder="e.g. student@annauniv.edu" value={formData.email} onChange={handleChange} />
              </div>
            </div>

            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--navy-900)', borderBottom: '1px solid var(--slate-200)', paddingBottom: '8px', marginBottom: '16px' }}>
              2. Academic Information
            </div>

            <div className="form-grid" style={{ marginBottom: '20px' }}>
              <div className="form-field span-2">
                <label>College / Institution Name</label>
                <input id="college" type="text" placeholder="e.g. CEG Anna University" value={formData.college} onChange={handleChange} />
              </div>
              <div className="form-field">
                <label>Department</label>
                <input id="dept" type="text" placeholder="e.g. Mechanical Engineering" value={formData.dept} onChange={handleChange} />
              </div>
              <div className="form-field">
                <label>Roll Number</label>
                <input id="rollno" type="text" placeholder="College Roll No." value={formData.rollno} onChange={handleChange} />
              </div>
            </div>

            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--navy-900)', borderBottom: '1px solid var(--slate-200)', paddingBottom: '8px', marginBottom: '16px' }}>
              3. Startup Idea Details
            </div>

            <div className="form-grid" style={{ marginBottom: '20px' }}>
              <div className="form-field span-2">
                <label>Idea / Startup Name</label>
                <input id="idea" type="text" placeholder="Name of your innovation" value={formData.idea} onChange={handleChange} />
              </div>
              <div className="form-field span-2">
                <label>Problem Statement</label>
                <textarea id="problem" rows="2" placeholder="What real problem does your startup solve?" value={formData.problem} onChange={handleChange} />
              </div>
              <div className="form-field span-2">
                <label>Proposed Solution</label>
                <textarea id="solution" rows="2" placeholder="Briefly describe your solution" value={formData.solution} onChange={handleChange} />
              </div>
              <div className="form-field">
                <label>Sector / Domain</label>
                <select id="sector" value={formData.sector} onChange={handleChange}>
                  {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label>Funding Requested (₹)</label>
                <input id="funding" type="number" min="0" max="300000" value={formData.funding} onChange={handleChange} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                <Icon name="check" /> Create My Account
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('login')}>
                Back to Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Register;
