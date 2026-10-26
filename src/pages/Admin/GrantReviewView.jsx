import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/common/Icon';
import { fmtDate, stageLabel } from '../../services/utils';

const GrantReviewView = () => {
  const { db, openDrawer } = useAuth();
  const applications = db.applications || [];
  const ediApps = applications.filter(a => a.stage === 'edi_evaluation' || a.status === 'selected');

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Grant Review & Final Forwarding</h1>
          <div className="desc">Review shortlisted student grant applications forwarded for final grant review</div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <h3>Forwarded Applications ({ediApps.length})</h3>
        </div>
        <div className="tbl-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Grant ID</th>
                <th>Applicant Name</th>
                <th>Idea / Startup</th>
                <th>Review Status</th>
                <th>Stage</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ediApps.map(app => (
                <tr key={app.applicationId}>
                  <td className="cell-id">{app.applicationId}</td>
                  <td className="cell-strong">{app.applicantName}</td>
                  <td>{app.ideaName || '—'}</td>
                  <td>
                    <span className="badge badge-info">{app.edi ? app.edi.status.replace(/_/g, ' ').toUpperCase() : 'UNDER REVIEW'}</span>
                  </td>
                  <td><span className="badge badge-success">{stageLabel(app.stage)}</span></td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => openDrawer(app.applicationId)}>
                      <Icon name="eye" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GrantReviewView;
