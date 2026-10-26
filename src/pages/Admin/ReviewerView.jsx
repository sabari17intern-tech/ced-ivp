import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/common/Icon';
import { REVIEWERS } from '../../services/dbStore';
import { fmtDate, stageLabel } from '../../services/utils';

/* ─── helpers ────────────────────────────────────────────────── */
const ROUND_REVIEWER = {
  r1: 'Arun Kumar R',
  r2: 'Sakthivel S',
};

// For each reviewer (by name), collect all apps they evaluated
function getReviewerApps(reviewerName, applications) {
  const results = [];
  (applications || []).forEach(app => {
    const rounds = app.rounds || {};
    Object.entries(rounds).forEach(([roundKey, roundData]) => {
      if (!roundData) return;
      // Check via the 'by' field on attempts OR via the hardcoded mapping
      const attempts = Array.isArray(roundData.attempts) ? roundData.attempts : [];
      const lastAttempt = attempts[attempts.length - 1];
      const evaluatedBy = lastAttempt?.by || ROUND_REVIEWER[roundKey] || '';
      if (evaluatedBy === reviewerName) {
        results.push({
          app,
          roundKey,
          roundLabel: roundKey === 'r1' ? 'Round 1' : 'Round 2',
          score: lastAttempt?.scoreOutOf10 ?? roundData.scoreOutOf10 ?? 0,
          total: lastAttempt?.total ?? roundData.total ?? 0,
          date: lastAttempt?.date || '',
          outcome: lastAttempt?.outcome || roundData.status || 'pending',
          remarks: lastAttempt?.remarks || '',
        });
      }
    });
  });
  return results;
}

const OUTCOME_META = {
  selected:  { label: 'Selected',  cls: 'badge-success' },
  pending:   { label: 'Pending',   cls: 'badge-warning' },
  rejected:  { label: 'Rejected',  cls: 'badge-danger'  },
};

/* ─── sub-component: reviewer card (left column) ─────────────── */
const ReviewerCard = ({ reviewer, evalCount, selected, onClick }) => {
  const initials = reviewer.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        width: '100%',
        padding: '16px',
        background: selected ? 'linear-gradient(135deg, var(--navy-900), var(--navy-700))' : '#fff',
        color: selected ? '#fff' : 'var(--slate-800)',
        border: selected ? '2px solid var(--cyan-500)' : '2px solid var(--slate-200)',
        borderRadius: '12px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all .2s ease',
        boxShadow: selected ? '0 4px 16px rgba(10,34,64,.18)' : 'var(--shadow-sm)',
      }}
    >
      <div style={{
        width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
        background: selected ? 'rgba(255,255,255,.15)' : 'var(--cyan-50)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '16px', fontWeight: 700,
        color: selected ? 'var(--cyan-300)' : 'var(--cyan-700)',
        border: selected ? '2px solid rgba(255,255,255,.25)' : '2px solid var(--cyan-200)',
      }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '14.5px', marginBottom: '3px' }}>{reviewer.name}</div>
        <div style={{ fontSize: '12px', opacity: .75, marginBottom: '6px' }}>
          {reviewer.role} &middot; Round {reviewer.round} &middot; {reviewer.mode}
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          fontSize: '12px', fontWeight: 700,
          background: selected ? 'rgba(255,255,255,.15)' : 'var(--cyan-50)',
          color: selected ? 'var(--cyan-200)' : 'var(--cyan-700)',
          padding: '3px 10px', borderRadius: '999px',
          border: selected ? '1px solid rgba(255,255,255,.2)' : '1px solid var(--cyan-200)',
        }}>
          <Icon name="evaluations" size={12} />
          {evalCount} Evaluated
        </div>
      </div>
      <Icon name={selected ? 'arrowRight' : 'arrowRight'} size={16} style={{ opacity: .5 }} />
    </button>
  );
};

/* ─── main page ──────────────────────────────────────────────── */
const ReviewerView = () => {
  const { db, openDrawer, navigate } = useAuth();
  const applications = db.applications || [];

  const [selectedReviewer, setSelectedReviewer] = useState(REVIEWERS[0]?.name || '');
  const [search, setSearch] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('all');

  // Build per-reviewer evaluation data
  const reviewerData = REVIEWERS.map(rev => ({
    ...rev,
    evals: getReviewerApps(rev.name, applications),
  }));

  const activeReviewer = reviewerData.find(r => r.name === selectedReviewer);
  const allEvals = activeReviewer?.evals || [];

  const filteredEvals = allEvals.filter(e => {
    if (outcomeFilter !== 'all' && e.outcome !== outcomeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = e.app.applicantName?.toLowerCase().includes(q);
      const matchId = e.app.applicationId?.toLowerCase().includes(q);
      const matchIdea = e.app.ideaName?.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchIdea) return false;
    }
    return true;
  });

  const totalScore = allEvals.length
    ? (allEvals.reduce((s, e) => s + (Number(e.score) || 0), 0) / allEvals.length).toFixed(1)
    : '—';

  const selectedCount = allEvals.filter(e => e.outcome === 'selected').length;
  const rejectedCount = allEvals.filter(e => e.outcome === 'rejected').length;

  return (
    <div>
      {/* Page header */}
      <div className="page-head">
        <div>
          <h1>Reviewer Activity Log</h1>
          <div className="desc">
            Track who evaluated whom, dates, scores &amp; outcomes — per reviewer
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', alignItems: 'start' }}>

        {/* ── LEFT COLUMN: Reviewer selector ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)',
            textTransform: 'uppercase', letterSpacing: '.06em', paddingLeft: '4px', marginBottom: '2px'
          }}>
            Reviewers
          </div>

          {reviewerData.map(rev => (
            <ReviewerCard
              key={rev.key}
              reviewer={rev}
              evalCount={rev.evals.length}
              selected={selectedReviewer === rev.name}
              onClick={() => { setSelectedReviewer(rev.name); setSearch(''); setOutcomeFilter('all'); }}
            />
          ))}

          {/* Summary card */}
          {activeReviewer && allEvals.length > 0 && (
            <div className="card" style={{ padding: '16px', marginTop: '4px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', marginBottom: '12px' }}>
                Summary
              </div>
              {[
                { label: 'Total Evaluated', value: allEvals.length, color: 'var(--navy-900)' },
                { label: 'Avg Score', value: totalScore + ' / 10', color: 'var(--cyan-700)' },
                { label: 'Selected', value: selectedCount, color: 'var(--success)' },
                { label: 'Rejected', value: rejectedCount, color: 'var(--danger)' },
              ].map(stat => (
                <div key={stat.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '7px 0', borderBottom: '1px solid var(--slate-100)', fontSize: '13px'
                }}>
                  <span style={{ color: 'var(--slate-600)' }}>{stat.label}</span>
                  <strong style={{ color: stat.color }}>{stat.value}</strong>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN: Evaluations table ── */}
        <div>
          {activeReviewer ? (
            <>
              {/* Reviewer bio strip */}
              <div style={{
                background: 'linear-gradient(135deg, var(--navy-900), var(--navy-700))',
                borderRadius: '12px', padding: '20px 24px',
                display: 'flex', alignItems: 'center', gap: '16px',
                marginBottom: '16px', color: '#fff'
              }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '50%',
                  background: 'rgba(255,255,255,.12)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px', fontWeight: 700, color: 'var(--cyan-300)',
                  border: '2px solid rgba(255,255,255,.2)', flexShrink: 0
                }}>
                  {activeReviewer.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '17px', fontWeight: 700 }}>{activeReviewer.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--cyan-300)', marginTop: '2px' }}>
                    {activeReviewer.role} &middot; Round {activeReviewer.round} &middot; {activeReviewer.mode}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--cyan-400)' }}>
                    {allEvals.length}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.6)' }}>Total Evaluations</div>
                </div>
              </div>

              {/* Filter bar */}
              <div className="table-card">
                <div className="table-toolbar" style={{ flexWrap: 'wrap', gap: '10px' }}>
                  <h3 style={{ fontSize: '14.5px', flex: 1 }}>
                    Evaluations by {activeReviewer.name}
                    <span style={{ fontWeight: 400, color: 'var(--slate-500)', marginLeft: '6px' }}>
                      ({filteredEvals.length} shown)
                    </span>
                  </h3>
                  <div className="topbar-search" style={{ maxWidth: '220px' }}>
                    <Icon name="search" />
                    <input
                      type="text"
                      placeholder="Search name or ID..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                  <select
                    className="tbl-filter"
                    value={outcomeFilter}
                    onChange={e => setOutcomeFilter(e.target.value)}
                  >
                    <option value="all">All Outcomes</option>
                    <option value="selected">Selected</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Table */}
                <div className="tbl-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Grant ID</th>
                        <th>Applicant Name</th>
                        <th>Idea / Startup</th>
                        <th>Round</th>
                        <th>Score</th>
                        <th>Date</th>
                        <th>Outcome</th>
                        <th>Stage</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEvals.length > 0 ? (
                        filteredEvals.map((e, idx) => {
                          const meta = OUTCOME_META[e.outcome] || { label: e.outcome, cls: 'badge-neutral' };
                          return (
                            <tr key={e.app.applicationId + '_' + e.roundKey}>
                              <td style={{ color: 'var(--slate-400)', fontSize: '12px' }}>{idx + 1}</td>
                              <td className="cell-id">{e.app.applicationId}</td>
                              <td className="cell-strong">{e.app.applicantName}</td>
                              <td style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {e.app.ideaName || '—'}
                              </td>
                              <td>
                                <span className={`badge ${e.roundKey === 'r1' ? 'badge-info' : 'badge-warning'}`}>
                                  {e.roundLabel}
                                </span>
                              </td>
                              <td>
                                <span style={{
                                  fontWeight: 800, fontSize: '15px',
                                  color: Number(e.score) >= 7 ? 'var(--success)' : Number(e.score) >= 4 ? 'var(--warning)' : 'var(--danger)'
                                }}>
                                  {e.score}
                                </span>
                                <span style={{ color: 'var(--slate-400)', fontSize: '12px' }}> / 10</span>
                              </td>
                              <td style={{ fontSize: '12.5px', color: 'var(--slate-600)', whiteSpace: 'nowrap' }}>
                                {e.date ? fmtDate(e.date) : '—'}
                              </td>
                              <td>
                                <span className={`badge ${meta.cls}`}>{meta.label}</span>
                              </td>
                              <td>
                                <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                                  {stageLabel(e.app.stage)}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => openDrawer(e.app.applicationId)}
                                    title="Open full application drawer"
                                  >
                                    <Icon name="eye" />
                                    View
                                  </button>
                                  <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => navigate('evaluations')}
                                    title="Go to Evaluations page"
                                  >
                                    <Icon name="arrowRight" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="10" className="table-empty">
                            {allEvals.length === 0
                              ? `${activeReviewer.name} has not evaluated any applications yet.`
                              : 'No evaluations match the current filters.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Remarks section (if any) */}
              {filteredEvals.some(e => e.remarks) && (
                <div className="card" style={{ padding: '20px', marginTop: '16px' }}>
                  <h3 style={{ fontSize: '14.5px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon name="clipboardList" size={16} />
                    Evaluator Remarks Log
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredEvals.filter(e => e.remarks).map((e, idx) => (
                      <div key={idx} style={{
                        background: 'var(--slate-50)', borderRadius: '8px',
                        padding: '12px 14px', borderLeft: '3px solid var(--cyan-400)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--navy-900)' }}>
                            {e.app.applicantName}
                          </span>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <span className={`badge ${e.roundKey === 'r1' ? 'badge-info' : 'badge-warning'}`} style={{ fontSize: '11px' }}>
                              {e.roundLabel}
                            </span>
                            <span style={{ fontSize: '11.5px', color: 'var(--slate-400)' }}>
                              {e.date ? fmtDate(e.date) : '—'}
                            </span>
                          </div>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--slate-600)', lineHeight: 1.5 }}>
                          {e.remarks}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--slate-400)' }}>
              <Icon name="userCheck" size={40} />
              <p style={{ marginTop: '12px' }}>Select a reviewer from the left panel</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewerView;
