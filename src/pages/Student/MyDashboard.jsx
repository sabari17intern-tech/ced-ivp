import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/common/Icon';
import { fmtMoney, stageLabel, stagePct, fmtDate, STAGES, stageIndex, fmtRelative } from '../../services/utils';
import { DOCUMENT_SPECS, getDocLink } from '../Admin/DocumentsView';

const STAGE_DETAILS = [
  {
    key: 'registration',
    step: 1,
    title: 'Registration & Initial Idea Submission',
    desc: 'Self-registration on CED portal and submission of your initial startup idea and problem statement.',
    actionPage: 'myApplication',
    actionText: 'Complete Application'
  },
  {
    key: 'bootcamp',
    step: 2,
    title: 'Ideation Bootcamp & Mentoring',
    desc: 'Participation in CED Anna University entrepreneurship bootcamp sessions, market validation, and business model design.',
    actionPage: 'myDashboard',
    actionText: 'Bootcamp Info'
  },
  {
    key: 'ced_evaluation',
    step: 3,
    title: 'Round 1: CED Technical Evaluation',
    desc: 'Online presentation and pitch deck review evaluated by Reviewer Arun Kumar R based on novelty, need, and technical feasibility.',
    actionPage: 'myDocuments',
    actionText: 'Update Pitch Deck'
  },
  {
    key: 'data_collection',
    step: 4,
    title: 'Data & Document Verification',
    desc: 'Submission and official verification of College Consent Letter, Detailed Budget Template, MSME Udyam Certificate, and Bank Account Proof.',
    actionPage: 'myDocuments',
    actionText: 'Attach Drive Links'
  },
  {
    key: 'ced_final',
    step: 5,
    title: 'Round 2: Expert Final Evaluation',
    desc: 'Comprehensive pitch evaluation reviewed by Sakthivel S covering market potential, prototype readiness, and commercialisation strategy.',
    actionPage: 'myDashboard',
    actionText: 'View Round 2 Status'
  },
  {
    key: 'grant_review',
    step: 6,
    title: 'EDII-TN & Grant Review',
    desc: 'State-level institutional review and sanction documentation clearance for Anna University incubator funding.',
    actionPage: 'myGrant',
    actionText: 'Review Status'
  },
  {
    key: 'approval',
    step: 7,
    title: 'Grant Sanction & 3-Phase Disbursement',
    desc: 'Official Sanction Letter issued and grant release in 3 phases (Phase 1: 40%, Phase 2: 40%, Phase 3: 20%) directly to student startup bank account.',
    actionPage: 'myGrant',
    actionText: 'View Grant & Milestones'
  }
];

const MyDashboard = () => {
  const { db, currentUser, navigate, markNotificationRead } = useAuth();
  const applications = db.applications || [];

  const app = applications.find(a => 
    (currentUser?.linkedApplicationId && a.applicationId === currentUser.linkedApplicationId) ||
    (a.phone && currentUser?.username && a.phone.replace(/\D/g, '').slice(-10) === currentUser.username.replace(/\D/g, '').slice(-10)) ||
    (currentUser?.name && a.applicantName === currentUser.name)
  );

  if (!app) {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
        <h3>No active grant application found</h3>
        <p style={{ color: 'var(--slate-500)', marginTop: '8px' }}>
          Please register your application details to get started.
        </p>
        <button className="btn btn-primary" style={{ marginTop: '14px' }} onClick={() => navigate('myApplication')}>
          Submit Application Details
        </button>
      </div>
    );
  }

  const currentStageIdx = stageIndex(app.stage);
  const r1 = app.rounds && app.rounds.r1;
  const r2 = app.rounds && app.rounds.r2;

  // Filter notifications for this student
  const relevantNotifs = (db.notifications || []).filter(n => {
    if (!n.targetType || n.targetType === 'all') return true;
    if (n.targetType === 'batch' && (app.batch === n.targetValue || String(app.createdDate).slice(0, 4) === n.targetValue)) return true;
    if (n.targetType === 'stage') {
      if (n.targetValue === 'completed_ced_evaluation') {
        return app.rounds?.r1?.status === 'selected' || currentStageIdx > stageIndex('ced_evaluation');
      }
      return app.stage === n.targetValue;
    }
    if (n.targetType === 'individual') {
      return n.targetValue === app.applicationId || n.targetValue === app.phone || n.targetValue === currentUser?.username;
    }
    return true;
  });

  const unreadNotifs = relevantNotifs.filter(n => {
    const readBy = Array.isArray(n.readBy) ? n.readBy : [];
    return !readBy.includes(currentUser?.username);
  });

  // Check missing profile data
  const missingFields = [];
  if (!app.email) missingFields.push({ label: 'Email Address', tab: 'personal' });
  if (!app.rollNumber) missingFields.push({ label: 'Roll Number', tab: 'academic' });
  if (!app.problemStatement) missingFields.push({ label: 'Problem Statement', tab: 'idea' });
  if (!app.proposedSolution) missingFields.push({ label: 'Proposed Solution', tab: 'idea' });
  if (!app.bank || !app.bank.accountNumber) missingFields.push({ label: 'Bank Account Details', tab: 'bank' });

  // Missing documents
  const missingDocs = DOCUMENT_SPECS.filter(d => !getDocLink(app, d.key));

  return (
    <div>
      {/* ── Top Header ── */}
      <div className="page-head">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--cyan-700)', fontWeight: 700 }}>
              {app.applicationId}
            </span>
            <span className="badge badge-info">Batch {app.batch || '2026-27'}</span>
            <span className="badge badge-success">{stageLabel(app.stage)}</span>
          </div>
          <h1>Welcome, {app.applicantName}</h1>
          <div className="desc">CED Anna University Student Founder Portal &middot; Incubation Roadmap</div>
        </div>

        <div className="page-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('myDocuments')}>
            <Icon name="upload" size={13} /> Attach Drive Links
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('myApplication')}>
            <Icon name="edit" size={13} /> Edit My Application Details
          </button>
        </div>
      </div>

      {/* ── Unread Notification Alert Banner (If Any) ── */}
      {unreadNotifs.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #0A2240, #0B6E8A)',
          color: '#fff',
          padding: '16px 20px',
          borderRadius: '12px',
          marginBottom: '22px',
          boxShadow: '0 4px 16px rgba(11, 110, 138, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Icon name="megaphone" size={20} />
            </div>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--cyan-300)', fontWeight: 800 }}>
                Important Notice from CED Administration ({unreadNotifs.length} new)
              </div>
              <div style={{ fontWeight: 800, fontSize: '15px', marginTop: '2px' }}>
                {unreadNotifs[0].title || 'Action Required'}
              </div>
              <div style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.85)', marginTop: '2px' }}>
                {unreadNotifs[0].text}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-xs"
              style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none' }}
              onClick={() => markNotificationRead(unreadNotifs[0].notifId)}
            >
              Dismiss
            </button>
            <button
              className="btn btn-xs"
              style={{ background: '#fff', color: 'var(--navy-900)', border: 'none', fontWeight: 700 }}
              onClick={() => {
                markNotificationRead(unreadNotifs[0].notifId);
                if (unreadNotifs[0].link && unreadNotifs[0].link.page) navigate(unreadNotifs[0].link.page);
                else navigate('myNotifications');
              }}
            >
              View Notice →
            </button>
          </div>
        </div>
      )}

      {/* ── Main Status & Progress Banner ── */}
      <div
        className="card"
        style={{
          padding: '24px',
          marginBottom: '22px',
          background: 'linear-gradient(135deg, var(--navy-900) 0%, var(--navy-800) 100%)',
          color: '#fff',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--cyan-300)', fontWeight: 700 }}>
              GRANT APPLICATION: {app.applicationId}
            </div>
            <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.3px' }}>
              {app.ideaName || 'Student Startup Idea'}
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--slate-300)', marginTop: '4px' }}>
              Sector: <strong>{app.sector || 'Agritech / Deep-Tech'}</strong> &middot; Batch: <strong>{app.batch || '2026-27'}</strong> &middot; Founder: <strong>{app.applicantName}</strong>
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            padding: '14px 20px',
            borderRadius: '12px',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--cyan-300)', fontWeight: 800 }}>
              Current Incubation Stage
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginTop: '2px' }}>
              {stageLabel(app.stage)}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--slate-300)', marginTop: '2px' }}>
              {stagePct(app.stage)}% of Incubation Completed
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginTop: '22px' }}>
          <div className="progress-track" style={{ background: 'rgba(255,255,255,0.15)', height: '8px' }}>
            <div className="progress-fill" style={{ width: `${stagePct(app.stage)}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--slate-400)', marginTop: '6px' }}>
            <span>Stage 1: Registration</span>
            <span>Stage 4: Data &amp; Docs</span>
            <span>Stage 7: Grant Sanction</span>
          </div>
        </div>
      </div>

      {/* ── Missing Data / Missing Docs Warning Callout (If Any) ── */}
      {(missingFields.length > 0 || missingDocs.length > 0) && (
        <div style={{
          background: '#fff',
          border: '1.5px solid var(--warning)',
          borderRadius: '12px',
          padding: '18px 20px',
          marginBottom: '22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--navy-900)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="warn" size={17} style={{ color: 'var(--warning)' }} />
              Action Recommended: Incomplete Application Details or Links
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--slate-600)', marginTop: '4px' }}>
              {missingFields.length > 0 && (
                <span>
                  Missing profile info: <strong>{missingFields.map(m => m.label).join(', ')}</strong>.{' '}
                </span>
              )}
              {missingDocs.length > 0 && (
                <span>
                  Pending Drive links: <strong>{missingDocs.map(d => d.shortName).join(', ')}</strong>.
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {missingFields.length > 0 && (
              <button className="btn btn-warning btn-sm" onClick={() => navigate('myApplication')}>
                Fill Missing Details →
              </button>
            )}
            {missingDocs.length > 0 && (
              <button className="btn btn-primary btn-sm" onClick={() => navigate('myDocuments')}>
                Attach Drive Links →
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Key Metrics Grid ── */}
      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="icn" style={{ background: 'var(--cyan-50)', color: 'var(--cyan-700)' }}>
            <Icon name="rupee" />
          </div>
          <div className="val">{fmtMoney(app.fundingRequested)}</div>
          <div className="lbl">Grant Funding Requested</div>
        </div>

        <div className="stat-card">
          <div className="icn" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
            <Icon name="grants" />
          </div>
          <div className="val" style={{ color: app.grant?.approvedAmount > 0 ? 'var(--success)' : 'inherit' }}>
            {app.grant && app.grant.approvedAmount > 0 ? fmtMoney(app.grant.approvedAmount) : 'Pending Sanction'}
          </div>
          <div className="lbl">Sanctioned Grant Amount</div>
        </div>

        <div className="stat-card">
          <div className="icn" style={{ background: 'var(--violet-bg)', color: 'var(--violet)' }}>
            <Icon name="evaluations" />
          </div>
          <div className="val">{r1 ? `${r1.scoreOutOf10 || 0}/10` : 'Pending'}</div>
          <div className="lbl">Round 1 (Arun Kumar R)</div>
        </div>

        <div className="stat-card">
          <div className="icn" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
            <Icon name="evaluations" />
          </div>
          <div className="val">{r2 ? `${r2.scoreOutOf10 || 0}/10` : 'Pending'}</div>
          <div className="lbl">Round 2 (Sakthivel S)</div>
        </div>
      </div>

      {/* ── 🌟 COMPLETE INCUBATION ROADMAP: All 7 Stages Explained ── */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px', background: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--navy-900)', margin: 0 }}>
            Incubation &amp; Grant Stages Roadmap
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--cyan-700)', fontWeight: 700 }}>
            Current Stage: {stageLabel(app.stage)} (Stage {currentStageIdx + 1} of 7)
          </span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--slate-500)', marginBottom: '20px' }}>
          Track your progress through all 7 stages of the CED Anna University Grant programme.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {STAGE_DETAILS.map((stage) => {
            const thisIdx = stageIndex(stage.key);
            const isCompleted = currentStageIdx > thisIdx;
            const isCurrent = app.stage === stage.key;
            const isUpcoming = currentStageIdx < thisIdx;

            return (
              <div
                key={stage.key}
                style={{
                  padding: '16px 20px',
                  borderRadius: '10px',
                  border: isCurrent
                    ? '2px solid var(--cyan-600)'
                    : isCompleted
                    ? '1px solid var(--success)'
                    : '1px solid var(--slate-200)',
                  background: isCurrent
                    ? 'linear-gradient(135deg, #f0fdfa, #f8fafc)'
                    : isCompleted
                    ? '#f0fdf4'
                    : '#fafafa',
                  boxShadow: isCurrent ? '0 4px 14px rgba(6, 182, 212, 0.15)' : 'none',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '14px'
                }}
              >
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flex: 1, minWidth: '280px' }}>
                  {/* Step icon / number */}
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: isCurrent
                      ? 'var(--cyan-600)'
                      : isCompleted
                      ? 'var(--success)'
                      : 'var(--slate-200)',
                    color: isUpcoming ? 'var(--slate-500)' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', fontWeight: 800, flexShrink: 0,
                    boxShadow: isCurrent ? '0 0 10px rgba(6, 182, 212, 0.5)' : 'none'
                  }}>
                    {isCompleted ? '✓' : stage.step}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                      <span style={{
                        fontSize: '15px',
                        fontWeight: 800,
                        color: isCurrent ? 'var(--navy-900)' : isCompleted ? 'var(--slate-800)' : 'var(--slate-500)'
                      }}>
                        Stage {stage.step}: {stage.title}
                      </span>

                      {isCurrent && (
                        <span className="badge badge-info" style={{ fontSize: '10.5px', fontWeight: 800, animation: 'pulse 2s infinite' }}>
                          ● YOU ARE HERE
                        </span>
                      )}

                      {isCompleted && (
                        <span className="badge badge-success" style={{ fontSize: '10.5px' }}>
                          ✓ COMPLETED
                        </span>
                      )}

                      {isUpcoming && (
                        <span className="badge badge-neutral" style={{ fontSize: '10.5px' }}>
                          UPCOMING
                        </span>
                      )}
                    </div>

                    <p style={{
                      fontSize: '12.5px',
                      color: isUpcoming ? 'var(--slate-400)' : 'var(--slate-600)',
                      margin: '0 0 4px 0',
                      lineHeight: 1.5
                    }}>
                      {stage.desc}
                    </p>

                    {/* Stage Specific Highlights */}
                    {stage.key === 'ced_evaluation' && r1 && (
                      <div style={{ fontSize: '12px', marginTop: '6px', color: 'var(--cyan-700)', fontWeight: 600 }}>
                        Score: {r1.scoreOutOf10 || 0}/10 &middot; Status: {r1.status ? r1.status.toUpperCase() : 'SCORED'}
                        {r1.remarks && <span> &middot; Remarks: "{r1.remarks}"</span>}
                      </div>
                    )}

                    {stage.key === 'ced_final' && r2 && (
                      <div style={{ fontSize: '12px', marginTop: '6px', color: 'var(--violet)', fontWeight: 600 }}>
                        Score: {r2.scoreOutOf10 || 0}/10 &middot; Status: {r2.status ? r2.status.toUpperCase() : 'SCORED'}
                        {r2.remarks && <span> &middot; Remarks: "{r2.remarks}"</span>}
                      </div>
                    )}

                    {stage.key === 'approval' && app.grant?.approvedAmount > 0 && (
                      <div style={{ fontSize: '12px', marginTop: '6px', color: 'var(--success)', fontWeight: 700 }}>
                        Sanctioned Amount: {fmtMoney(app.grant.approvedAmount)} &middot; Sanction Letter: {app.grant.sanctionLetterNo || 'Issued'}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ alignSelf: 'center' }}>
                  <button
                    className={`btn btn-xs ${isCurrent ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => navigate(stage.actionPage)}
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    {stage.actionText} →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Document Drive Links Quick Panel ── */}
      <div className="card" style={{ padding: '22px', marginBottom: '24px', background: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy-900)', margin: 0 }}>
              Required Document Drive Links
            </h3>
            <div style={{ fontSize: '12px', color: 'var(--slate-400)', marginTop: '2px' }}>
              Ensure your Google Drive links are attached with view permissions
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('myDocuments')}>
            Manage All Links →
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {DOCUMENT_SPECS.map(spec => {
            const link = getDocLink(app, spec.key);
            const isAttached = Boolean(link);

            return (
              <div
                key={spec.key}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: isAttached ? '1px solid var(--slate-200)' : '1px dashed var(--slate-300)',
                  background: isAttached ? 'var(--slate-50)' : '#fff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--slate-800)' }}>
                    {spec.shortName}
                  </div>
                  <div style={{ fontSize: '11px', color: isAttached ? 'var(--success)' : 'var(--slate-400)', fontWeight: 600 }}>
                    {isAttached ? '✓ Link Attached' : 'Missing Drive Link'}
                  </div>
                </div>

                {isAttached ? (
                  <a
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-xs"
                    style={{ textDecoration: 'none' }}
                  >
                    Open ↗
                  </a>
                ) : (
                  <button
                    className="btn btn-primary btn-xs"
                    onClick={() => navigate('myDocuments')}
                  >
                    + Attach
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Timeline Audit History ── */}
      <div className="card" style={{ padding: '22px', background: '#fff' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '16px' }}>
          Application Status Audit Trail
        </h3>
        <div className="timeline">
          {(app.history || []).map((h, idx) => (
            <div key={idx} className="tl-item done">
              <div className="tl-rail">
                <div className="tl-dot"><Icon name="check" size={12} /></div>
                <div className="tl-connector" />
              </div>
              <div className="tl-content">
                <div className="tl-title">{h.action}</div>
                <div className="tl-meta">{fmtDate(h.date)} {h.time || ''} by {h.user}</div>
                {h.remarks && <div className="tl-remarks">{h.remarks}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MyDashboard;
