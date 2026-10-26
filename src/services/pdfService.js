import { fmtDate, stageLabel } from './utils.js';

// Escape HTML special characters to prevent XSS in print output
function escHtml(s) {
  if (s === undefined || s === null) return '';
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

export function printStudentReport(app) {
  if (!app) return;
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Grant Application Report - ${escHtml(app.applicationId)}</title>
      <style>
        body { font-family: sans-serif; margin: 30px; color: #1e293b; font-size: 13px; line-height: 1.5; }
        .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0A2240; padding-bottom: 12px; margin-bottom: 20px; }
        .org-title { font-size: 18px; font-weight: bold; color: #0A2240; }
        .sub-title { font-size: 12px; color: #64748b; }
        .badge { display: inline-block; padding: 4px 10px; background: #e2e8f0; border-radius: 12px; font-weight: bold; font-size: 11px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; }
        .card-title { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 6px; }
        .val { font-size: 14px; font-weight: bold; color: #0f172a; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
        th { background: #f1f5f9; font-size: 11px; text-transform: uppercase; }
        .section-header { font-size: 14px; font-weight: bold; color: #0A2240; margin-top: 20px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="org-title">CED GRANT MANAGEMENT</div>
          <div class="sub-title">Centre for Entrepreneurship Development, Anna University</div>
        </div>
        <div style="text-align: right;">
          <div style="font-family: monospace; font-size: 16px; font-weight: bold; color: #0B6E8A;">${escHtml(app.applicationId)}</div>
          <div class="sub-title">Date: ${escHtml(fmtDate(app.createdDate))}</div>
        </div>
      </div>

      <div class="grid">
        <div class="card">
          <div class="card-title">Applicant Name</div>
          <div class="val">${escHtml(app.applicantName)}</div>
          <div style="color: #64748b; margin-top: 4px;">Phone: ${escHtml(app.phone)} | Email: ${escHtml(app.email || 'N/A')}</div>
        </div>
        <div class="card">
          <div class="card-title">Pipeline Stage &amp; Status</div>
          <div class="val">${escHtml(stageLabel(app.stage))}</div>
          <div style="margin-top: 4px;"><span class="badge">${escHtml((app.status || '').toUpperCase())}</span></div>
        </div>
      </div>

      <div class="section-header">Idea &amp; Project Summary</div>
      <table>
        <tr><td style="width: 200px; font-weight: bold;">Idea / Startup Name</td><td>${escHtml(app.ideaName || '—')}</td></tr>
        <tr><td style="font-weight: bold;">Sector / Domain</td><td>${escHtml(app.sector || '—')}</td></tr>
        <tr><td style="font-weight: bold;">Problem Statement</td><td>${escHtml(app.problemStatement || '—')}</td></tr>
        <tr><td style="font-weight: bold;">Proposed Solution</td><td>${escHtml(app.proposedSolution || '—')}</td></tr>
        <tr><td style="font-weight: bold;">Funding Requested</td><td>&#x20B9;${(app.fundingRequested || 0).toLocaleString('en-IN')}</td></tr>
        <tr><td style="font-weight: bold;">Sanctioned Grant</td><td>&#x20B9;${(app.grant ? app.grant.approvedAmount : 0).toLocaleString('en-IN')}</td></tr>
      </table>

      <div class="section-header">Academic &amp; Personal Info</div>
      <table>
        <tr><td style="width: 200px; font-weight: bold;">College / Institution</td><td>${escHtml(app.college || '—')}</td></tr>
        <tr><td style="font-weight: bold;">Department</td><td>${escHtml(app.department || '—')}</td></tr>
        <tr><td style="font-weight: bold;">Year / Semester</td><td>${escHtml(app.year || '—')}</td></tr>
        <tr><td style="font-weight: bold;">Roll Number</td><td>${escHtml(app.rollNumber || '—')}</td></tr>
        <tr><td style="font-weight: bold;">Batch / Cohort</td><td>${escHtml(app.batch || '—')}</td></tr>
      </table>

      ${app.history && app.history.length ? `
        <div class="section-header">Audit History</div>
        <table>
          <thead>
            <tr><th>Date</th><th>Action</th><th>User</th><th>Remarks</th></tr>
          </thead>
          <tbody>
            ${app.history.map(h => `<tr><td>${escHtml(h.date)} ${escHtml(h.time || '')}</td><td>${escHtml(h.action)}</td><td>${escHtml(h.user)}</td><td>${escHtml(h.remarks || '—')}</td></tr>`).join('')}
          </tbody>
        </table>
      ` : ''}

      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
