import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/common/Icon';
import { SECTORS, todayISO } from '../../services/utils';
import { DOCUMENT_SPECS, getDocLink } from '../Admin/DocumentsView';

const MyDetails = () => {
  const { db, updateDb, currentUser, showToast } = useAuth();
  const applications = db.applications || [];

  const app = applications.find(a => 
    (currentUser?.linkedApplicationId && a.applicationId === currentUser.linkedApplicationId) ||
    (a.phone && currentUser?.username && a.phone.replace(/\D/g, '').slice(-10) === currentUser.username.replace(/\D/g, '').slice(-10)) ||
    (currentUser?.name && a.applicantName === currentUser.name)
  );

  const [activeTab, setActiveTab] = useState('personal');

  // Personal state
  const [personalData, setPersonalData] = useState({
    name: app ? app.applicantName || '' : '',
    phone: app ? app.phone || '' : '',
    email: app ? app.email || '' : '',
    gender: app ? app.gender || '' : '',
    dob: app ? app.dob || '' : '',
    caste: app ? app.caste || '' : '',
    district: app ? app.district || '' : '',
    address: app ? app.address || '' : ''
  });

  // Academic state
  const [academicData, setAcademicData] = useState({
    college: app ? app.college || '' : '',
    dept: app ? app.department || '' : '',
    year: app ? app.year || '' : '',
    rollno: app ? app.rollNumber || '' : ''
  });

  // Startup Idea state
  const [ideaData, setIdeaData] = useState({
    ideaName: app ? app.ideaName || '' : '',
    problemStatement: app ? app.problemStatement || '' : '',
    proposedSolution: app ? app.proposedSolution || '' : '',
    sector: app ? app.sector || SECTORS[0] : SECTORS[0],
    fundingRequested: app ? app.fundingRequested || 200000 : 200000
  });

  // MSME / Registration state
  const [regData, setRegData] = useState({
    startupRegistered: app ? app.startupRegistered || 'No' : 'No',
    udyamNumber: (app && app.registration && app.registration.udyamNumber) || (app && app.data && app.data.msmeNumber) || '',
    gstNumber: (app && app.registration && app.registration.gstNumber) || '',
    panNumber: (app && app.registration && app.registration.panNumber) || ''
  });

  // Bank state
  const [bankData, setBankData] = useState({
    accountName: app && app.bank ? app.bank.accountName || app.applicantName || '' : '',
    accountNumber: app && app.bank ? app.bank.accountNumber || '' : '',
    bankName: app && app.bank ? app.bank.bankName || '' : '',
    ifscCode: app && app.bank ? app.bank.ifscCode || '' : '',
    branch: app && app.bank ? app.bank.branch || '' : ''
  });

  // Drive Links state
  const [docLinks, setDocLinks] = useState({
    pitchLink: app ? getDocLink(app, 'pitchLink') : '',
    consentLetterLink: app ? getDocLink(app, 'consentLetterLink') : '',
    fundingTemplateLink: app ? getDocLink(app, 'fundingTemplateLink') : '',
    udyamCertLink: app ? getDocLink(app, 'udyamCertLink') : '',
    bankProofLink: app ? getDocLink(app, 'bankProofLink') : '',
    prototypeLink: app ? getDocLink(app, 'prototypeLink') : ''
  });

  if (!app) {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
        <h3>No active application found</h3>
      </div>
    );
  }

  // Update Application Helper
  const saveApplicationSection = (updatedFields, sectionName) => {
    const updatedApps = db.applications.map(a => {
      if (a.applicationId === app.applicationId) {
        return {
          ...a,
          ...updatedFields,
          lastUpdated: todayISO(),
          history: [
            ...(a.history || []),
            {
              date: todayISO(),
              time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
              user: app.applicantName,
              action: `Updated ${sectionName}`,
              from: '',
              to: 'Saved',
              remarks: 'Modified by student founder.'
            }
          ]
        };
      }
      return a;
    });

    // Also sync user if phone/name/email changed
    let updatedUsers = [...(db.users || [])];
    if (updatedFields.phone || updatedFields.applicantName) {
      const cleanPhone = (updatedFields.phone || app.phone).replace(/\D/g, '').slice(-10);
      const uIdx = updatedUsers.findIndex(u => u.linkedApplicationId === app.applicationId || u.username === cleanPhone);
      if (uIdx >= 0) {
        updatedUsers[uIdx] = {
          ...updatedUsers[uIdx],
          name: updatedFields.applicantName || updatedUsers[uIdx].name,
          username: cleanPhone,
          phone: cleanPhone,
          password: cleanPhone.slice(-4) + 'ivp'
        };
      }
    }

    updateDb({ ...db, applications: updatedApps, users: updatedUsers });
    showToast(`${sectionName} saved successfully!`, 'success');
  };

  const handleSavePersonal = (e) => {
    e.preventDefault();
    const clean = personalData.phone.replace(/\D/g, '').slice(-10);
    saveApplicationSection({
      applicantName: personalData.name.trim(),
      phone: clean || personalData.phone,
      email: personalData.email.trim(),
      gender: personalData.gender,
      dob: personalData.dob,
      caste: personalData.caste,
      district: personalData.district,
      address: personalData.address
    }, 'Personal & Contact Details');
  };

  const handleSaveAcademic = (e) => {
    e.preventDefault();
    saveApplicationSection({
      college: academicData.college.trim(),
      department: academicData.dept.trim(),
      year: academicData.year,
      rollNumber: academicData.rollno.trim()
    }, 'Academic Information');
  };

  const handleSaveIdea = (e) => {
    e.preventDefault();
    saveApplicationSection({
      ideaName: ideaData.ideaName.trim(),
      problemStatement: ideaData.problemStatement.trim(),
      proposedSolution: ideaData.proposedSolution.trim(),
      sector: ideaData.sector,
      fundingRequested: Number(ideaData.fundingRequested) || 0
    }, 'Startup Innovation Details');
  };

  const handleSaveRegistration = (e) => {
    e.preventDefault();
    const curReg = app.registration || {};
    const curData = app.data || {};

    saveApplicationSection({
      startupRegistered: regData.startupRegistered,
      registration: {
        ...curReg,
        udyamNumber: regData.udyamNumber.trim(),
        gstNumber: regData.gstNumber.trim(),
        panNumber: regData.panNumber.trim()
      },
      data: {
        ...curData,
        msmeNumber: regData.udyamNumber.trim(),
        msmeRegistered: Boolean(regData.udyamNumber.trim())
      }
    }, 'Registration & MSME Details');
  };

  const handleSaveBank = (e) => {
    e.preventDefault();
    saveApplicationSection({
      bank: {
        accountName: bankData.accountName.trim(),
        accountNumber: bankData.accountNumber.trim(),
        bankName: bankData.bankName.trim(),
        ifscCode: bankData.ifscCode.trim().toUpperCase(),
        branch: bankData.branch.trim()
      }
    }, 'Bank Account Details');
  };

  const handleSaveDriveLinks = (e) => {
    e.preventDefault();
    const curData = app.data || {};
    saveApplicationSection({
      pitchLink: docLinks.pitchLink.trim(),
      consentLetterLink: docLinks.consentLetterLink.trim(),
      fundingTemplateLink: docLinks.fundingTemplateLink.trim(),
      udyamCertLink: docLinks.udyamCertLink.trim(),
      bankProofLink: docLinks.bankProofLink.trim(),
      prototypeLink: docLinks.prototypeLink.trim(),
      data: {
        ...curData,
        pitchLink: docLinks.pitchLink.trim(),
        consentLetterLink: docLinks.consentLetterLink.trim(),
        fundingTemplateLink: docLinks.fundingTemplateLink.trim(),
        udyamCertLink: docLinks.udyamCertLink.trim(),
        bankProofLink: docLinks.bankProofLink.trim(),
        prototypeLink: docLinks.prototypeLink.trim(),
        consentLetter: Boolean(docLinks.consentLetterLink.trim()),
        fundingTemplate: Boolean(docLinks.fundingTemplateLink.trim())
      }
    }, 'Document Drive Links');
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>My Application Details</h1>
          <div className="desc">
            Grant ID: <strong style={{ fontFamily: 'var(--font-mono)' }}>{app.applicationId}</strong> &middot; Fill in and update any missing student or startup information.
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--slate-200)',
        marginBottom: '22px',
        overflowX: 'auto',
        background: '#fff',
        padding: '0 8px',
        borderRadius: '8px 8px 0 0'
      }}>
        {[
          { id: 'personal', label: '1. Personal & Contact', isMissing: !app.email },
          { id: 'academic', label: '2. Academic Info', isMissing: !app.rollNumber },
          { id: 'idea', label: '3. Startup Innovation', isMissing: !app.problemStatement },
          { id: 'registration', label: '4. MSME & Registration', isMissing: false },
          { id: 'bank', label: '5. Bank Account (DBT)', isMissing: !app.bank?.accountNumber },
          { id: 'documents', label: '6. Document Drive Links', isMissing: !app.pitchLink }
        ].map(tab => (
          <button
            key={tab.id}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'transparent',
              fontSize: '13px',
              fontWeight: activeTab === tab.id ? 700 : 600,
              color: activeTab === tab.id ? 'var(--navy-900)' : 'var(--slate-500)',
              borderBottom: activeTab === tab.id ? '2.5px solid var(--navy-900)' : '2.5px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.label}</span>
            {tab.isMissing && (
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--warning)' }} title="Missing details" />
            )}
          </button>
        ))}
      </div>

      {/* ── TAB 1: PERSONAL & CONTACT ── */}
      {activeTab === 'personal' && (
        <form className="card" style={{ padding: '24px', maxWidth: '720px', background: '#fff' }} onSubmit={handleSavePersonal}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy-900)', margin: '0 0 4px 0' }}>
              Personal &amp; Contact Information
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--slate-500)', margin: 0 }}>
              Ensure your active email and phone number are up to date to receive evaluation alerts.
            </p>
          </div>

          <div className="form-grid" style={{ marginBottom: '18px' }}>
            <div className="form-field span-2">
              <label>Full Name <span className="req">*</span></label>
              <input
                type="text"
                required
                value={personalData.name}
                onChange={e => setPersonalData({ ...personalData, name: e.target.value })}
              />
            </div>

            <div className="form-field">
              <label>Mobile Number (10 digits) <span className="req">*</span></label>
              <input
                type="tel"
                required
                value={personalData.phone}
                onChange={e => setPersonalData({ ...personalData, phone: e.target.value })}
              />
              <div className="hint">Used for your portal sign-in and WhatsApp updates</div>
            </div>

            <div className="form-field">
              <label>Email Address <span className="req">*</span></label>
              <input
                type="email"
                required
                placeholder="e.g. founder@annauniv.edu"
                value={personalData.email}
                onChange={e => setPersonalData({ ...personalData, email: e.target.value })}
              />
            </div>

            <div className="form-field">
              <label>Gender</label>
              <select value={personalData.gender} onChange={e => setPersonalData({ ...personalData, gender: e.target.value })}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-field">
              <label>Date of Birth</label>
              <input
                type="date"
                value={personalData.dob}
                onChange={e => setPersonalData({ ...personalData, dob: e.target.value })}
              />
            </div>

            <div className="form-field">
              <label>Category / Caste</label>
              <input
                type="text"
                placeholder="e.g. OC, BC, MBC, SC, ST"
                value={personalData.caste}
                onChange={e => setPersonalData({ ...personalData, caste: e.target.value })}
              />
            </div>

            <div className="form-field">
              <label>District / Native City</label>
              <input
                type="text"
                placeholder="e.g. Chennai, Coimbatore, Madurai"
                value={personalData.district}
                onChange={e => setPersonalData({ ...personalData, district: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary">
              <Icon name="save" size={14} /> Save Personal Information
            </button>
          </div>
        </form>
      )}

      {/* ── TAB 2: ACADEMIC INFO ── */}
      {activeTab === 'academic' && (
        <form className="card" style={{ padding: '24px', maxWidth: '720px', background: '#fff' }} onSubmit={handleSaveAcademic}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy-900)', margin: '0 0 4px 0' }}>
              Academic &amp; Institutional Details
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--slate-500)', margin: 0 }}>
              Information regarding your college, faculty department, and academic cohort.
            </p>
          </div>

          <div className="form-grid" style={{ marginBottom: '18px' }}>
            <div className="form-field span-2">
              <label>College / University / Institution Name <span className="req">*</span></label>
              <input
                type="text"
                required
                placeholder="e.g. College of Engineering Guindy, Anna University"
                value={academicData.college}
                onChange={e => setAcademicData({ ...academicData, college: e.target.value })}
              />
            </div>

            <div className="form-field span-2">
              <label>Department / Branch of Study</label>
              <input
                type="text"
                placeholder="e.g. Mechanical Engineering, Computer Science"
                value={academicData.dept}
                onChange={e => setAcademicData({ ...academicData, dept: e.target.value })}
              />
            </div>

            <div className="form-field">
              <label>Year / Semester</label>
              <select value={academicData.year} onChange={e => setAcademicData({ ...academicData, year: e.target.value })}>
                <option value="">Select Year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year / Final</option>
                <option value="Postgraduate">Postgraduate / PhD</option>
              </select>
            </div>

            <div className="form-field">
              <label>Roll Number / Registration Number</label>
              <input
                type="text"
                placeholder="e.g. 2023103042"
                value={academicData.rollno}
                onChange={e => setAcademicData({ ...academicData, rollno: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary">
              <Icon name="save" size={14} /> Save Academic Information
            </button>
          </div>
        </form>
      )}

      {/* ── TAB 3: STARTUP INNOVATION ── */}
      {activeTab === 'idea' && (
        <form className="card" style={{ padding: '24px', maxWidth: '720px', background: '#fff' }} onSubmit={handleSaveIdea}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy-900)', margin: '0 0 4px 0' }}>
              Startup Innovation, Problem &amp; Solution
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--slate-500)', margin: 0 }}>
              Evaluators review these details during Round 1 and Round 2 pitch evaluations.
            </p>
          </div>

          <div className="form-grid" style={{ marginBottom: '18px' }}>
            <div className="form-field span-2">
              <label>Startup / Idea Name <span className="req">*</span></label>
              <input
                type="text"
                required
                value={ideaData.ideaName}
                onChange={e => setIdeaData({ ...ideaData, ideaName: e.target.value })}
              />
            </div>

            <div className="form-field">
              <label>Sector / Domain</label>
              <select value={ideaData.sector} onChange={e => setIdeaData({ ...ideaData, sector: e.target.value })}>
                {SECTORS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Grant Funding Requested (₹)</label>
              <input
                type="number"
                min="1000"
                max="300000"
                value={ideaData.fundingRequested}
                onChange={e => setIdeaData({ ...ideaData, fundingRequested: e.target.value })}
              />
              <div className="hint">Max sanction grant: ₹3,00,000</div>
            </div>

            <div className="form-field span-2">
              <label>Problem Statement (What real problem does your startup solve?) <span className="req">*</span></label>
              <textarea
                rows="3"
                required
                placeholder="Explain the real-world problem, customer pain point, and market need..."
                value={ideaData.problemStatement}
                onChange={e => setIdeaData({ ...ideaData, problemStatement: e.target.value })}
              />
            </div>

            <div className="form-field span-2">
              <label>Proposed Solution &amp; Technical Novelty <span className="req">*</span></label>
              <textarea
                rows="3"
                required
                placeholder="Describe your technical innovation, prototype, and how it improves over existing solutions..."
                value={ideaData.proposedSolution}
                onChange={e => setIdeaData({ ...ideaData, proposedSolution: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary">
              <Icon name="save" size={14} /> Save Startup Details
            </button>
          </div>
        </form>
      )}

      {/* ── TAB 4: MSME & REGISTRATION ── */}
      {activeTab === 'registration' && (
        <form className="card" style={{ padding: '24px', maxWidth: '720px', background: '#fff' }} onSubmit={handleSaveRegistration}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy-900)', margin: '0 0 4px 0' }}>
              MSME Udyam &amp; Legal Entity Registration
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--slate-500)', margin: 0 }}>
              Government MSME Udyam registration is required before sanction disbursement.
            </p>
          </div>

          <div className="form-grid" style={{ marginBottom: '18px' }}>
            <div className="form-field span-2">
              <label>Is your startup entity registered?</label>
              <select value={regData.startupRegistered} onChange={e => setRegData({ ...regData, startupRegistered: e.target.value })}>
                <option value="No">No / Under Incorporation</option>
                <option value="MSME Udyam">Registered under MSME Udyam</option>
                <option value="Private Limited">Private Limited Company</option>
                <option value="LLP">Limited Liability Partnership (LLP)</option>
                <option value="Partnership">Registered Partnership</option>
                <option value="Proprietorship">Sole Proprietorship</option>
              </select>
            </div>

            <div className="form-field span-2">
              <label>MSME Udyam Registration Number</label>
              <input
                type="text"
                placeholder="e.g. UDYAM-TN-01-0094435"
                value={regData.udyamNumber}
                onChange={e => setRegData({ ...regData, udyamNumber: e.target.value })}
              />
              <div className="hint">Free registration on udyamregistration.gov.in</div>
            </div>

            <div className="form-field">
              <label>GST Number (Optional)</label>
              <input
                type="text"
                placeholder="33AAAAA0000A1Z5"
                value={regData.gstNumber}
                onChange={e => setRegData({ ...regData, gstNumber: e.target.value.toUpperCase() })}
              />
            </div>

            <div className="form-field">
              <label>Company / Founder PAN (Optional)</label>
              <input
                type="text"
                placeholder="ABCDE1234F"
                value={regData.panNumber}
                onChange={e => setRegData({ ...regData, panNumber: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary">
              <Icon name="save" size={14} /> Save Registration Details
            </button>
          </div>
        </form>
      )}

      {/* ── TAB 5: BANK ACCOUNT (DBT) ── */}
      {activeTab === 'bank' && (
        <form className="card" style={{ padding: '24px', maxWidth: '720px', background: '#fff' }} onSubmit={handleSaveBank}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy-900)', margin: '0 0 4px 0' }}>
              Bank Account Details for Grant Disbursal
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--slate-500)', margin: 0 }}>
              Sanctioned grant funds (up to ₹3,00,000) are disbursed directly to this verified bank account.
            </p>
          </div>

          <div className="form-grid" style={{ marginBottom: '18px' }}>
            <div className="form-field span-2">
              <label>Account Beneficiary Name (as per Bank Records) <span className="req">*</span></label>
              <input
                type="text"
                required
                placeholder="e.g. Gurusharan S or Startup Name"
                value={bankData.accountName}
                onChange={e => setBankData({ ...bankData, accountName: e.target.value })}
              />
            </div>

            <div className="form-field">
              <label>Bank Account Number <span className="req">*</span></label>
              <input
                type="text"
                required
                placeholder="e.g. 10293847561"
                value={bankData.accountNumber}
                onChange={e => setBankData({ ...bankData, accountNumber: e.target.value })}
              />
            </div>

            <div className="form-field">
              <label>IFSC Code <span className="req">*</span></label>
              <input
                type="text"
                required
                placeholder="e.g. SBIN0000800"
                value={bankData.ifscCode}
                onChange={e => setBankData({ ...bankData, ifscCode: e.target.value.toUpperCase() })}
              />
            </div>

            <div className="form-field">
              <label>Bank Name</label>
              <input
                type="text"
                placeholder="e.g. State Bank of India"
                value={bankData.bankName}
                onChange={e => setBankData({ ...bankData, bankName: e.target.value })}
              />
            </div>

            <div className="form-field">
              <label>Branch Name</label>
              <input
                type="text"
                placeholder="e.g. Anna University Campus Branch"
                value={bankData.branch}
                onChange={e => setBankData({ ...bankData, branch: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary">
              <Icon name="save" size={14} /> Save Bank Account Details
            </button>
          </div>
        </form>
      )}

      {/* ── TAB 6: DOCUMENT DRIVE LINKS ── */}
      {activeTab === 'documents' && (
        <form className="card" style={{ padding: '24px', maxWidth: '720px', background: '#fff' }} onSubmit={handleSaveDriveLinks}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy-900)', margin: '0 0 4px 0' }}>
              Specific Document Drive Links
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--slate-500)', margin: 0 }}>
              Attach your Google Drive / OneDrive links for each required document. Make sure sharing is set to "Anyone with the link can view".
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
            {DOCUMENT_SPECS.map(spec => (
              <div key={spec.key} className="form-field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ margin: 0, fontWeight: 700 }}>{spec.name}</label>
                  {docLinks[spec.key] && (
                    <a
                      href={docLinks[spec.key]}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '11.5px', color: 'var(--cyan-700)', fontWeight: 600, textDecoration: 'none' }}
                    >
                      Test Link ↗
                    </a>
                  )}
                </div>
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/d/.../view"
                  value={docLinks[spec.key] || ''}
                  onChange={e => setDocLinks({ ...docLinks, [spec.key]: e.target.value })}
                />
                <div className="hint">{spec.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary">
              <Icon name="save" size={14} /> Save All Drive Links
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default MyDetails;
