import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/common/Icon';
import { fmtMoney, stageLabel, getAppYear, STAGES } from '../../services/utils';

const StartupsList = () => {
  const { db, openDrawer, openModal } = useAuth();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');

  const applications = db.applications || [];

  // Summary Metrics
  const totalSanctioned = applications.reduce((sum, a) => sum + ((a.grant && a.grant.approvedAmount) || 0), 0);
  const sanctionedCount = applications.filter(a => a.grant && a.grant.approvedAmount > 0).length;
  const evalCount = applications.filter(a => (a.rounds && (a.rounds.r1 || a.rounds.r2))).length;

  const filtered = applications.filter(a => {
    if (stageFilter !== 'all' && a.stage !== stageFilter) return false;
    if (yearFilter !== 'all' && getAppYear(a) !== yearFilter && a.batch !== yearFilter) return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (a.ideaName && a.ideaName.toLowerCase().includes(q)) ||
      (a.applicantName && a.applicantName.toLowerCase().includes(q)) ||
      (a.sector && a.sector.toLowerCase().includes(q)) ||
      (a.phone && a.phone.includes(q)) ||
      (a.applicationId && a.applicationId.toLowerCase().includes(q)) ||
      getAppYear(a).includes(q)
    );
  });

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Incubated Student Startups ({applications.length})</h1>
          <div className="desc">CED Anna University Incubated Student Startups &amp; Grant Beneficiaries</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary btn-sm" onClick={() => openModal('addApp')}>
            <Icon name="plus" size={14} /> New Application
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="stat-grid" style={{ marginBottom: '22px' }}>
        <div className="stat-card">
          <div className="icn" style={{ background: 'var(--cyan-50)', color: 'var(--cyan-700)' }}>
            <Icon name="rocket" />
          </div>
          <div className="val">{applications.length}</div>
          <div className="lbl">Total Incubated Startups</div>
        </div>

        <div className="stat-card">
          <div className="icn" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
            <Icon name="grants" />
          </div>
          <div className="val">{fmtMoney(totalSanctioned)}</div>
          <div className="lbl">Total Grant Sanctioned</div>
        </div>

        <div className="stat-card">
          <div className="icn" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
            <Icon name="check" />
          </div>
          <div className="val">{sanctionedCount} Startups</div>
          <div className="lbl">Sanctioned Beneficiaries</div>
        </div>

        <div className="stat-card">
          <div className="icn" style={{ background: 'var(--violet-bg)', color: 'var(--violet)' }}>
            <Icon name="evaluations" />
          </div>
          <div className="val">{evalCount} Startups</div>
          <div className="lbl">Evaluated by Reviewers</div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div style={{
        background: '#fff',
        padding: '16px 20px',
        borderRadius: '12px',
        border: '1px solid var(--slate-200)',
        marginBottom: '22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div className="topbar-search" style={{ maxWidth: '340px', flex: 1, minWidth: '220px' }}>
          <Icon name="search" />
          <input
            type="text"
            placeholder="Search startup name, founder, phone, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="tbl-filter"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
          >
            <option value="all">All Batches / Years</option>
            <option value="2026">2026 Cohort (2026-27)</option>
            <option value="2025">2025 Cohort (2025-26)</option>
            <option value="2024">2024 Cohort (2024-25)</option>
          </select>

          <select
            className="tbl-filter"
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
          >
            <option value="all">All Pipeline Stages</option>
            {STAGES.map(s => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>

          {(search || stageFilter !== 'all' || yearFilter !== 'all') && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { setSearch(''); setStageFilter('all'); setYearFilter('all'); }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Startup Grid */}
      {filtered.length === 0 ? (
        <div className="table-empty" style={{ padding: '60px 20px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid var(--slate-200)' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
          <h3 style={{ fontSize: '16px', color: 'var(--navy-900)', margin: '0 0 6px 0' }}>No Startups Found</h3>
          <p style={{ color: 'var(--slate-500)', fontSize: '13px', margin: 0 }}>
            No startup matches your search or selected filter.
          </p>
        </div>
      ) : (
        <div className="startup-grid">
          {filtered.map(app => {
            const yr = getAppYear(app);
            const isSanctioned = app.grant && app.grant.approvedAmount > 0;
            const r1 = app.rounds && app.rounds.r1;
            const cleanPhone = (app.phone || '').replace(/\D/g, '').slice(-10);
            const whatsAppUrl = cleanPhone ? `https://wa.me/91${cleanPhone}?text=Hello%20${encodeURIComponent(app.applicantName)},%20regarding%20your%20CED%20Grant%20Application%20(${app.applicationId}):` : null;

            return (
              <div
                key={app.applicationId}
                className="startup-card"
                onClick={() => openDrawer(app.applicationId)}
                style={{ cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
              >
                <div className="sc-top">
                  <div className="sc-name" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--navy-900)' }}>
                    {app.ideaName || app.applicantName}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span className={`badge ${yr === '2026' ? 'badge-info' : yr === '2025' ? 'badge-warning' : 'badge-neutral'}`}>
                      {yr}
                    </span>
                    <span className="badge badge-neutral">{app.sector || 'General'}</span>
                  </div>
                </div>

                <div className="sc-founder" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Founder: <strong>{app.applicantName}</strong></span>
                  {whatsAppUrl && (
                    <a
                      href={whatsAppUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      title="Direct WhatsApp"
                      style={{ color: '#25D366' }}
                    >
                      <Icon name="whatsapp" size={15} />
                    </a>
                  )}
                </div>

                <div style={{ fontSize: '12px', color: 'var(--slate-500)', marginTop: '2px' }}>
                  {app.college || 'Anna University'} {app.phone ? `· ${app.phone}` : ''}
                </div>

                <div className="sc-meta" style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--slate-100)' }}>
                  <span className="sc-stage">{stageLabel(app.stage)}</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 700 }}>
                      {isSanctioned ? 'Sanctioned' : 'Funding Req.'}
                    </div>
                    <strong style={{ color: isSanctioned ? 'var(--success)' : 'var(--cyan-700)', fontSize: '14px' }}>
                      {isSanctioned ? fmtMoney(app.grant.approvedAmount) : fmtMoney(app.fundingRequested || 0)}
                    </strong>
                  </div>
                </div>

                {r1 && (
                  <div style={{ marginTop: '8px', fontSize: '11.5px', color: 'var(--slate-500)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Round 1 Score:</span>
                    <strong style={{ color: 'var(--cyan-700)' }}>{r1.scoreOutOf10 || 0} / 10</strong>
                  </div>
                )}

                <div className="sc-foot" style={{ marginTop: '12px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--slate-400)', fontFamily: 'var(--font-mono)' }}>
                    {app.applicationId}
                  </span>
                  <span className="sc-view" style={{ fontWeight: 700, color: 'var(--cyan-700)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    View All Details <Icon name="arrowRight" size={12} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StartupsList;
