import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Icon from '../common/Icon';
import { SECTORS, DEFAULT_BATCHES, STAGES, todayISO, stageLabel, pad } from '../../services/utils';

const AddApplicationModal = () => {
  const { db, updateDb, closeModal, showToast } = useAuth();
  const [appType, setAppType] = useState('individual');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [ideaName, setIdeaName] = useState('');
  const [sector, setSector] = useState(SECTORS[0]);
  const [batch, setBatch] = useState(db.meta ? db.meta.currentBatch || '2026-27' : '2026-27');
  const [stage, setStage] = useState('registration');
  const [funding, setFunding] = useState(250000);
  const [desc, setDesc] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !ideaName.trim()) {
      showToast('Name, Phone, and Idea Name are required.', 'warning');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      showToast('Enter a valid 10-digit phone number.', 'warning');
      return;
    }

    const appSeq = db.applications.length + 1;
    const appId = 'GRT-' + (batch || '2026-27').replace(/\//g, '-') + '-' + pad(appSeq, 3);
    const memId = 'MEM-' + pad(db.members.length + 1, 3);
    const now = todayISO();

    const newMember = {
      memberId: memId,
      fullName: name.trim(),
      phone: cleanPhone,
      email: email.trim(),
      joinedDate: now,
      active: true
    };

    const newApp = {
      applicationId: appId,
      memberId: memId,
      type: appType,
      applicantName: name.trim(),
      phone: cleanPhone,
      email: email.trim(),
      ideaName: ideaName.trim(),
      sector: sector,
      batch: batch,
      fundingRequested: Number(funding) || 0,
      description: desc.trim(),
      stage: stage,
      status: 'pending',
      createdDate: now,
      lastUpdated: now,
      bootcamp: { attended: stage !== 'registration', date: now, remarks: 'Created by Admin' },
      data: { consentLetter: false, fundingTemplate: false, msmeRegistered: false, msmeNumber: '', status: 'pending', submittedDate: '' },
      rounds: {},
      finalEval: { status: 'pending', decision: '', remarks: '', date: '' },
      bank: { accountName: '', accountNumber: '', bankName: '', ifscCode: '', branch: '' },
      registration: { udyamNumber: '', gstNumber: '', panNumber: '', registrationType: '' },
      edi: { status: 'not_submitted', grantReviewAppId: '', decisionDate: '', remarks: '' },
      grant: {
        approvalDate: '', sanctionLetterNo: '', approvedAmount: 0, grantType: 'Grant Fund', bankVerification: 'Pending', agreementStatus: 'Pending',
        phase1: { amount: 0, eligibleAmount: 0, releaseDate: '', status: 'pending', refNumber: '', remarks: '' },
        phase2: { amount: 0, eligibleAmount: 0, releaseDate: '', status: 'pending', refNumber: '', remarks: '' },
        phase3: { amount: 0, eligibleAmount: 0, releaseDate: '', status: 'pending', refNumber: '', remarks: '' }
      },
      documents: [],
      notes: [],
      history: [{ date: now, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), user: 'Admin', action: 'Created by Admin', from: '', to: stageLabel(stage), remarks: 'Added via Admin portal.' }]
    };

    const newUser = {
      username: cleanPhone,
      password: cleanPhone.slice(-4) + 'ivp',
      name: name.trim(),
      role: 'applicant',
      linkedApplicationId: appId
    };

    updateDb({
      ...db,
      members: [...db.members, newMember],
      applications: [...db.applications, newApp],
      users: [...db.users, newUser]
    });

    showToast(`Created Application ${appId} for ${name}`, 'success');
    closeModal();
  };

  return (
    <div>
      <div className="modal-head">
        <h3>Add New Application</h3>
        <button className="x" onClick={closeModal}><Icon name="x" /></button>
      </div>

      <form className="modal-body" onSubmit={handleSubmit}>
        <div className="callout callout-info" style={{ marginBottom: '14px' }}>
          <Icon name="info" />
          <span>Fill in the applicant and startup details to generate a new Grant Application ID.</span>
        </div>

        <div className="form-field" style={{ marginBottom: '14px' }}>
          <label>Application Type</label>
          <select value={appType} onChange={(e) => setAppType(e.target.value)}>
            <option value="individual">Individual Application</option>
            <option value="team">Team Application</option>
          </select>
        </div>

        <div className="form-grid" style={{ marginBottom: '14px' }}>
          <div className="form-field">
            <label>Applicant Full Name <span className="req">*</span></label>
            <input
              type="text"
              placeholder="e.g. Karthik Raja S"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label>Phone Number <span className="req">*</span></label>
            <input
              type="tel"
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="form-field span-2">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="student@annauniv.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="form-section-title">About the Idea</div>

        <div className="form-grid">
          <div className="form-field span-2">
            <label>Idea / Startup Name <span className="req">*</span></label>
            <input
              type="text"
              placeholder="e.g. Smart Solar Dryer"
              value={ideaName}
              onChange={(e) => setIdeaName(e.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label>Sector / Domain</label>
            <select value={sector} onChange={(e) => setSector(e.target.value)}>
              {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="form-field">
            <label>Batch / Cohort</label>
            <select value={batch} onChange={(e) => setBatch(e.target.value)}>
              {(db.meta.batches || DEFAULT_BATCHES).map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div className="form-field span-2">
            <label>Initial Pipeline Stage</label>
            <select value={stage} onChange={(e) => setStage(e.target.value)}>
              {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>

          <div className="form-field span-2">
            <label>Funding Requested (₹)</label>
            <input
              type="number"
              min="0"
              max="300000"
              value={funding}
              onChange={(e) => setFunding(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
          <button type="submit" className="btn btn-primary">
            <Icon name="save" /> Create Application
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddApplicationModal;
