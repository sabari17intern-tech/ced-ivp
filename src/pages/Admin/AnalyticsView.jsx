import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/common/Icon';
import { fmtMoney, getAppYear } from '../../services/utils';

const AnalyticsView = () => {
  const { db } = useAuth();
  const applications = db.applications || [];

  const totalApps = applications.length;
  const selectedApps = applications.filter(a => a.status === 'selected').length;
  const totalFundingRequested = applications.reduce((acc, a) => acc + (a.fundingRequested || 0), 0);
  const totalSanctioned = applications.reduce((acc, a) => acc + (a.grant ? a.grant.approvedAmount || 0 : 0), 0);

  // Cohort / Year breakdown
  const cohortCounts = applications.reduce((acc, a) => {
    const yr = getAppYear(a);
    acc[yr] = (acc[yr] || 0) + 1;
    return acc;
  }, {});

  // Demographics
  const genderCounts = applications.reduce((acc, a) => {
    const g = a.gender || 'Not Specified';
    acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {});

  const sectorCounts = applications.reduce((acc, a) => {
    const s = a.sector || 'General';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const stageCounts = applications.reduce((acc, a) => {
    const s = a.stage || 'registration';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Analytics &amp; Incubation Reports</h1>
          <div className="desc">CED Anna University Demographics &amp; Grant Distribution Analytics</div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="icn" style={{ background: 'var(--cyan-50)', color: 'var(--cyan-700)' }}>
            <Icon name="applications" />
          </div>
          <div className="val">{totalApps}</div>
          <div className="lbl">Total Applications</div>
        </div>

        <div className="stat-card">
          <div className="icn" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
            <Icon name="check" />
          </div>
          <div className="val">{selectedApps}</div>
          <div className="lbl">Selected &amp; Sanctioned</div>
        </div>

        <div className="stat-card">
          <div className="icn" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
            <Icon name="rupee" />
          </div>
          <div className="val">{fmtMoney(totalFundingRequested)}</div>
          <div className="lbl">Total Funding Requested</div>
        </div>

        <div className="stat-card">
          <div className="icn" style={{ background: 'var(--violet-bg)', color: 'var(--violet)' }}>
            <Icon name="grants" />
          </div>
          <div className="val">{fmtMoney(totalSanctioned)}</div>
          <div className="lbl">Total Sanctioned Grant</div>
        </div>
      </div>

      {/* Cohort Year Breakdown */}
      <div className="table-card" style={{ marginBottom: '20px' }}>
        <div className="table-toolbar">
          <h3>Participant Cohort Breakdown by Year</h3>
        </div>
        <div style={{ display: 'flex', gap: '12px', padding: '16px', flexWrap: 'wrap' }}>
          {Object.keys(cohortCounts).sort((a, b) => b - a).map(yr => (
            <div key={yr} style={{
              flex: '1',
              minWidth: '140px',
              background: yr === '2026' ? 'var(--cyan-50)' : yr === '2025' ? 'var(--warning-bg)' : 'var(--slate-100)',
              border: `1.5px solid ${yr === '2026' ? 'var(--cyan-200)' : yr === '2025' ? 'var(--warning-border)' : 'var(--slate-200)'}`,
              borderRadius: '12px',
              padding: '16px 20px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '28px',
                fontWeight: '800',
                fontFamily: 'var(--font-display)',
                color: yr === '2026' ? 'var(--cyan-700)' : yr === '2025' ? 'var(--warning)' : 'var(--slate-600)'
              }}>
                {cohortCounts[yr]}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--navy-900)', marginTop: '4px' }}>
                {yr} Cohort
              </div>
              <div style={{ fontSize: '12px', color: 'var(--slate-500)', marginTop: '2px' }}>
                Batch {yr === '2026' ? '2026-27' : yr === '2025' ? '2025-26' : '2024-25'}
              </div>
            </div>
          ))}
          {Object.keys(cohortCounts).length === 0 && (
            <div style={{ color: 'var(--slate-400)', fontSize: '14px', padding: '12px' }}>
              No participant data yet.
            </div>
          )}
        </div>
      </div>

      {/* Detailed Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '14px' }}>Demographic Breakdown</h3>
          <table className="data-table">
            <thead>
              <tr><th>Gender</th><th>Count</th><th>Percentage</th></tr>
            </thead>
            <tbody>
              {Object.keys(genderCounts).map(g => (
                <tr key={g}>
                  <td>{g}</td>
                  <td>{genderCounts[g]}</td>
                  <td>{totalApps ? Math.round((genderCounts[g] / totalApps) * 100) : 0}%</td>
                </tr>
              ))}
              {Object.keys(genderCounts).length === 0 && (
                <tr><td colSpan="3" className="table-empty">No data</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '14px' }}>Sector Distribution</h3>
          <table className="data-table">
            <thead>
              <tr><th>Sector / Domain</th><th>Count</th><th>%</th></tr>
            </thead>
            <tbody>
              {Object.keys(sectorCounts).sort((a, b) => sectorCounts[b] - sectorCounts[a]).map(s => (
                <tr key={s}>
                  <td>{s}</td>
                  <td>{sectorCounts[s]}</td>
                  <td>{totalApps ? Math.round((sectorCounts[s] / totalApps) * 100) : 0}%</td>
                </tr>
              ))}
              {Object.keys(sectorCounts).length === 0 && (
                <tr><td colSpan="3" className="table-empty">No data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stage Funnel */}
      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '14px' }}>Pipeline Stage Distribution</h3>
        <table className="data-table">
          <thead>
            <tr><th>Stage</th><th>Count</th><th>Share</th></tr>
          </thead>
          <tbody>
            {Object.keys(stageCounts).sort((a, b) => stageCounts[b] - stageCounts[a]).map(s => (
              <tr key={s}>
                <td style={{ fontWeight: 600 }}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</td>
                <td>{stageCounts[s]}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      height: '6px',
                      width: `${totalApps ? Math.round((stageCounts[s] / totalApps) * 100) : 0}%`,
                      maxWidth: '120px',
                      background: 'var(--cyan-500)',
                      borderRadius: '99px',
                      minWidth: '4px'
                    }} />
                    <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
                      {totalApps ? Math.round((stageCounts[s] / totalApps) * 100) : 0}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnalyticsView;
