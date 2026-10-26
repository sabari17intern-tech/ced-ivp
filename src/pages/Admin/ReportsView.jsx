import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/common/Icon';
import { exportApplicationsExcel } from '../../services/excelService';

const ReportsView = () => {
  const { db } = useAuth();
  const applications = db.applications || [];

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Reports & Export Center</h1>
          <div className="desc">Export complete dataset, members list, pending lists, and sanction reports</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>Full Applications Excel Export</h3>
          <p style={{ fontSize: '13px', color: 'var(--slate-500)', marginBottom: '16px' }}>
            Export all {applications.length} applications with Grant ID, phone, idea name, stage, and funding status.
          </p>
          <button className="btn btn-primary" onClick={() => exportApplicationsExcel(applications)}>
            <Icon name="download" /> Export Full Dataset (.xlsx)
          </button>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>Sanctioned Grants Export</h3>
          <p style={{ fontSize: '13px', color: 'var(--slate-500)', marginBottom: '16px' }}>
            Export sanctioned grant amounts, sanction letter numbers, and 3-phase disbursement breakdown.
          </p>
          <button className="btn btn-accent" onClick={() => exportApplicationsExcel(applications.filter(a => a.grant && a.grant.approvedAmount > 0), 'ced-sanctioned-grants.xlsx')}>
            <Icon name="download" /> Export Grants Report (.xlsx)
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
