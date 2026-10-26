import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/common/Icon';
import { REVIEWERS } from '../../services/dbStore';
import { stageLabel } from '../../services/utils';

const EvaluationsView = () => {
  const { db, openModal, openDrawer } = useAuth();
  const applications = db.applications || [];

  const evalApps = applications.filter(a => a.stage === 'ced_evaluation' || (a.rounds && (a.rounds.r1 || a.rounds.r2)));

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Evaluations Engine & Reviewers</h1>
          <div className="desc">Two-round structured scoring system with 9 evaluation criteria</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {REVIEWERS.map(rev => (
          <div key={rev.key} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="avatar" style={{ width: '42px', height: '42px', fontSize: '15px' }}>
                {rev.name[0]}
              </div>
              <div>
                <h3 style={{ fontSize: '16px' }}>{rev.name}</h3>
                <div style={{ fontSize: '12.5px', color: 'var(--cyan-700)', fontWeight: 600 }}>{rev.role} &middot; Round {rev.round} ({rev.mode})</div>
              </div>
            </div>
            <div style={{ marginTop: '14px', fontSize: '12.5px', color: 'var(--slate-600)' }}>
              Assigned to evaluate {rev.round === 1 ? 'Problem significance, innovation & technical feasibility' : 'Market potential, prototype readiness & business model'}.
            </div>
          </div>
        ))}
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <h3>Applications for CED Evaluation ({evalApps.length})</h3>
        </div>
        <div className="tbl-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Grant ID</th>
                <th>Applicant Name</th>
                <th>Idea / Startup</th>
                <th>Round 1 Score</th>
                <th>Round 2 Score</th>
                <th>Stage</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {evalApps.map(app => {
                const r1 = app.rounds && app.rounds.r1;
                const r2 = app.rounds && app.rounds.r2;
                return (
                  <tr key={app.applicationId}>
                    <td className="cell-id">{app.applicationId}</td>
                    <td className="cell-strong">{app.applicantName}</td>
                    <td>{app.ideaName || '—'}</td>
                    <td>
                      {r1 ? (
                        <span style={{ fontWeight: 700, color: 'var(--navy-900)' }}>{r1.scoreOutOf10 || 0} / 10</span>
                      ) : (
                        <button className="btn btn-secondary btn-sm" onClick={() => openModal('scoreSheet', { app, round: 1 })}>
                          <Icon name="edit" /> Score R1
                        </button>
                      )}
                    </td>
                    <td>
                      {r2 ? (
                        <span style={{ fontWeight: 700, color: 'var(--navy-900)' }}>{r2.scoreOutOf10 || 0} / 10</span>
                      ) : (
                        <button className="btn btn-secondary btn-sm" onClick={() => openModal('scoreSheet', { app, round: 2 })}>
                          <Icon name="edit" /> Score R2
                        </button>
                      )}
                    </td>
                    <td><span className="badge badge-info">{stageLabel(app.stage)}</span></td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => openDrawer(app.applicationId)}>
                        <Icon name="eye" /> Drawer
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EvaluationsView;
