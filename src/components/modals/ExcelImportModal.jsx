import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Icon from '../common/Icon';
import { downloadExcelTemplate, parseExcelFile } from '../../services/excelService';
import { validPhone, validEmail, todayISO, stageLabel } from '../../services/utils';

const ExcelImportModal = () => {
  const { db, updateDb, closeModal, showToast } = useAuth();
  const [targetStage, setTargetStage] = useState('registration');
  const [previewRows, setPreviewRows] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = async (file) => {
    if (!file) return;
    setIsLoading(true);
    try {
      const rawRows = await parseExcelFile(file);
      const normalized = rawRows.map(r => {
        const keyMap = {};
        Object.keys(r).forEach(k => { keyMap[String(k).toLowerCase().replace(/[\s_\-\.]/g, '')] = k; });
        const get = (aliases) => {
          for (const a of aliases) {
            const nk = String(a).toLowerCase().replace(/[\s_\-\.]/g, '');
            if (keyMap[nk] !== undefined) {
              const v = r[keyMap[nk]];
              if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
            }
          }
          return '';
        };

        let phone = get(['phone', 'phone no', 'phone number', 'mobile']).replace(/[^0-9]/g, '');
        if (phone.length > 10) phone = phone.slice(-10);

        return {
          name: get(['name', 'fullname', 'applicant', 'applicant name']),
          phone,
          email: get(['email', 'email id']),
          teamId: get(['team id', 'teamid']),
          ideaName: get(['idea name', 'startup name', 'startup', 'idea']) || 'Bulk Imported Idea',
          sector: get(['sector', 'domain']) || 'Agritech',
          funding: get(['funding', 'fundingrequested', 'amount']) || 0,
          batch: get(['batch', 'year']) || db.meta.currentBatch,
          college: get(['college', 'institution', 'address']),
          gender: get(['gender', 'sex']),
          caste: get(['caste', 'category']),
          tier: get(['tier'])
        };
      });

      const seen = new Set();
      let validCount = 0;
      let skippedCount = 0;

      const validated = normalized.map((r, i) => {
        const errors = [];
        if (!r.name) errors.push('Missing name');
        if (!validPhone(r.phone)) errors.push('Invalid phone');
        if (r.email && !validEmail(r.email)) errors.push('Invalid email');
        if (r.phone && seen.has(r.phone)) errors.push('Duplicate phone in file');
        if (r.phone) seen.add(r.phone);

        if (errors.length) skippedCount++;
        else validCount++;

        return { ...r, errors, rowNum: i + 2 };
      });

      setParsedData(validated);
      setPreviewRows({ validCount, skippedCount, total: validated.length });
    } catch (err) {
      showToast('Failed parsing file. Please check file format.', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmImport = () => {
    const validRows = parsedData.filter(r => r.errors.length === 0);
    if (!validRows.length) {
      showToast('No valid rows to import.', 'warning');
      return;
    }

    let createdCount = 0;
    const now = todayISO();
    const newApps = [...db.applications];
    const newMembers = [...db.members];
    const newUsers = [...db.users];

    validRows.forEach(r => {
      const appSeq = newApps.length + 1;
      const appId = 'GRT-' + (db.meta.currentBatch || '2026-27').replace(/\//g, '-') + '-' + String(appSeq).padStart(3, '0');
      const memId = 'MEM-' + String(newMembers.length + 1).padStart(3, '0');

      newMembers.push({
        memberId: memId,
        fullName: r.name,
        phone: r.phone,
        email: r.email,
        college: r.college || '',
        joinedDate: now,
        active: true
      });

      const app = {
        applicationId: appId,
        memberId: memId,
        type: 'individual',
        applicantName: r.name,
        phone: r.phone,
        email: r.email || '',
        ideaName: r.ideaName,
        sector: r.sector,
        batch: r.batch,
        fundingRequested: Number(r.funding) || 0,
        college: r.college || '',
        gender: r.gender || '',
        caste: r.caste || '',
        tier: r.tier || '',
        stage: targetStage,
        status: 'pending',
        createdDate: now,
        lastUpdated: now,
        bootcamp: { attended: targetStage !== 'registration', date: now, remarks: 'Bulk imported' },
        data: { consentLetter: false, fundingTemplate: false, msmeRegistered: false, msmeNumber: '', status: 'pending', submittedDate: '' },
        rounds: {},
        finalEval: { status: 'pending', decision: '', remarks: '', date: '' },
        bank: { accountName: '', accountNumber: '', bankName: '', ifscCode: '', branch: '' },
        registration: { udyamNumber: '', gstNumber: '', panNumber: '', registrationType: '' },
        edi: { status: 'not_submitted', grantReviewAppId: '', decisionDate: '', remarks: '' },
        grant: { approvalDate: '', sanctionLetterNo: '', approvedAmount: 0, grantType: 'Grant Fund', bankVerification: 'Pending', agreementStatus: 'Pending', phase1: { amount: 0, eligibleAmount: 0, releaseDate: '', status: 'pending', refNumber: '', remarks: '' }, phase2: { amount: 0, eligibleAmount: 0, releaseDate: '', status: 'pending', refNumber: '', remarks: '' }, phase3: { amount: 0, eligibleAmount: 0, releaseDate: '', status: 'pending', refNumber: '', remarks: '' } },
        documents: [],
        notes: [],
        history: [{ date: now, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), user: 'Admin', action: 'Bulk Excel Import', from: 'Excel File', to: stageLabel(targetStage), remarks: `Imported directly to ${stageLabel(targetStage)}.` }]
      };

      newApps.push(app);

      if (!newUsers.some(u => u.username === r.phone)) {
        newUsers.push({
          username: r.phone,
          password: r.phone.slice(-4) + 'ivp',
          name: r.name,
          role: 'applicant',
          linkedApplicationId: appId
        });
      }

      createdCount++;
    });

    updateDb({
      ...db,
      applications: newApps,
      members: newMembers,
      users: newUsers
    });

    showToast(`Successfully imported ${createdCount} application(s) into ${stageLabel(targetStage)}.`, 'success');
    closeModal();
  };

  return (
    <div>
      <div className="modal-head">
        <h3>Bulk Import Students / Applications from Excel</h3>
        <button className="x" onClick={closeModal}><Icon name="x" /></button>
      </div>

      <div className="modal-body">
        <div className="callout callout-info" style={{ marginBottom: '14px' }}>
          <Icon name="info" />
          <span>Upload your Excel (.xlsx) or CSV file to add multiple students in bulk. You can place them directly into <b>Bootcamp Completed</b> or any stage.</span>
        </div>

        <div style={{ marginBottom: '14px', background: 'var(--slate-50)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--slate-200)' }}>
          <label style={{ fontWeight: 700, fontSize: '13px', display: 'block', marginBottom: '6px' }}>Target Stage Placement:</label>
          <select
            className="tbl-filter"
            style={{ width: '100%', fontWeight: 600, padding: '8px 12px', background: '#fff' }}
            value={targetStage}
            onChange={(e) => setTargetStage(e.target.value)}
          >
            <option value="registration">1. Registration (Default)</option>
            <option value="bootcamp">2. Bootcamp Completed (Places directly into Bootcamp Completed stage)</option>
            <option value="ced_evaluation">3. CED Evaluation (Round 1 / Round 2 Ready)</option>
            <option value="data_collection">4. Data Collection / Verification</option>
            <option value="edi_evaluation">5. Grant Review (EDI)</option>
          </select>
        </div>

        <div
          style={{
            border: '2px dashed var(--slate-300)',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
            background: 'var(--slate-50)',
            cursor: 'pointer'
          }}
          onClick={() => document.getElementById('excelFileInput').click()}
        >
          <Icon name="upload" size={28} className="text-muted" />
          <div style={{ fontWeight: 700, marginTop: '8px', fontSize: '14px' }}>Tap to choose an Excel (.xlsx) or CSV file</div>
          <div style={{ fontSize: '11.5px', color: 'var(--slate-500)', marginTop: '4px' }}>
            Understands CED sheets with Name, Phone, Email, Idea Name, Sector, Batch, College.
          </div>
          <input
            type="file"
            id="excelFileInput"
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            onChange={(e) => handleFileUpload(e.target.files[0])}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => downloadExcelTemplate('bootcamp')}>
            <Icon name="download" /> Download Bootcamp Excel Template (.xlsx)
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => downloadExcelTemplate('general')}>
            <Icon name="download" /> Download Blank Template (.xlsx)
          </button>
        </div>

        {previewRows && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <div style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '8px 12px', borderRadius: '8px', flex: 1, textAlign: 'center', fontWeight: 700 }}>
                {previewRows.validCount} Valid
              </div>
              <div style={{ background: 'var(--warning-bg)', color: 'var(--warning)', padding: '8px 12px', borderRadius: '8px', flex: 1, textAlign: 'center', fontWeight: 700 }}>
                {previewRows.skippedCount} Errors
              </div>
            </div>

            <div className="tbl-scroll" style={{ maxHeight: '200px', border: '1px solid var(--slate-200)', borderRadius: '8px' }}>
              <table className="data-table">
                <thead>
                  <tr><th>Row</th><th>Name</th><th>Phone</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 30).map((r, i) => (
                    <tr key={i} style={{ background: r.errors.length ? 'var(--danger-bg)' : 'transparent' }}>
                      <td>{r.rowNum}</td>
                      <td>{r.name || '—'}</td>
                      <td>{r.phone || '—'}</td>
                      <td>
                        {r.errors.length ? (
                          <span className="badge badge-danger">{r.errors.join(', ')}</span>
                        ) : (
                          <span className="badge badge-success">OK</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="modal-foot">
        <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
        <button
          className="btn btn-primary"
          disabled={!previewRows || previewRows.validCount === 0 || isLoading}
          onClick={handleConfirmImport}
        >
          <Icon name="upload" /> Create {previewRows ? previewRows.validCount : 0} Application(s)
        </button>
      </div>
    </div>
  );
};

export default ExcelImportModal;
