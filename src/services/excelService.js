import * as XLSX from 'xlsx';
import { stageLabel, validEmail, validPhone } from './utils.js';

export function downloadTextFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime || 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function downloadExcelTemplate(kind, currentBatch = 'Batch 1 (2026)') {
  const sampleData = kind === 'bootcamp' ? [
    {
      "Name": "Karthik Raja S",
      "Phone": "9876543210",
      "Email": "karthik@example.com",
      "TEAM ID": "TEAM-2026-01",
      "Idea Name": "Smart Solar Dryer for Spices",
      "Sector": "Agritech",
      "Funding Requested": 300000,
      "Batch": currentBatch,
      "College / Address": "College of Engineering Guindy, Anna University",
      "Gender": "Male",
      "Caste": "OBC",
      "Tier": "Tier 1",
      "Bootcamp Attended": "Yes",
      "Start up Registered": "No",
      "pitch deck file": "https://drive.google.com/sample_pitch_deck"
    },
    {
      "Name": "Anitha M",
      "Phone": "9123456789",
      "Email": "anitha@example.com",
      "TEAM ID": "TEAM-2026-02",
      "Idea Name": "AI Based Pest Detection Camera",
      "Sector": "Artificial Intelligence",
      "Funding Requested": 250000,
      "Batch": currentBatch,
      "College / Address": "MIT Campus, Anna University",
      "Gender": "Female",
      "Caste": "General",
      "Tier": "Tier 1",
      "Bootcamp Attended": "Yes",
      "Start up Registered": "Yes",
      "pitch deck file": "https://drive.google.com/sample_pitch_deck_2"
    }
  ] : [
    {
      "Name": "Applicant Name",
      "Phone": "9000000000",
      "Email": "applicant@example.com",
      "TEAM ID": "TEAM-001",
      "Idea Name": "Project Title",
      "Sector": "Agritech",
      "Funding Requested": 300000,
      "Batch": currentBatch,
      "College / Address": "Anna University",
      "Gender": "Male",
      "Caste": "OBC",
      "Tier": "Tier 1",
      "Bootcamp Attended": "Yes",
      "Start up Registered": "No",
      "pitch deck file": "https://drive.google.com/..."
    }
  ];

  const fileName = kind === 'bootcamp' ? 'Bootcamp_Completed_Import_Template.xlsx' : 'CED_Grant_Import_Template.xlsx';

  try {
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students Import");
    XLSX.writeFile(wb, fileName);
    return { success: true, fileName };
  } catch (err) {
    const csvHeaders = Object.keys(sampleData[0]).join(',');
    const csvRows = sampleData.map(r => Object.values(r).map(v => `"${v}"`).join(','));
    downloadTextFile(fileName.replace(/\.xlsx$/, '.csv'), [csvHeaders, ...csvRows].join('\n'), 'text/csv');
    return { success: true, fileName: fileName.replace(/\.xlsx$/, '.csv'), fallback: true };
  }
}

export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file provided'));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

export function exportRowsToExcel(filename, sheetName, rows) {
  if (!rows || !rows.length) return false;
  try {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName || 'Sheet1');
    XLSX.writeFile(wb, filename.replace(/\.csv$/, '') + '.xlsx');
    return true;
  } catch (err) {
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => {
      const v = r[h] === undefined || r[h] === null ? '' : String(r[h]).replace(/"/g, '""');
      return '"' + v + '"';
    }).join(','))].join('\n');
    downloadTextFile(filename.replace(/\.xlsx$/, '') + '.csv', csv, 'text/csv');
    return true;
  }
}

export function exportApplicationsExcel(applications, filename = 'ced-grant-applications.xlsx') {
  const rows = applications.map(a => ({
    GRANT_ID: a.applicationId,
    Applicant: a.applicantName,
    Type: a.type,
    Phone: a.phone,
    Idea: a.ideaName,
    Domain: a.sector,
    Batch: a.batch || '',
    Stage: stageLabel(a.stage),
    Status: a.status,
    FundingRequested: a.fundingRequested,
    ApprovedAmount: a.grant ? a.grant.approvedAmount : 0,
    EDIStatus: a.edi ? a.edi.status : '',
    LastUpdated: a.lastUpdated
  }));
  return exportRowsToExcel(filename, 'Applications', rows);
}
