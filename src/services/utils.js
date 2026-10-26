export const STAGES = [
  { key: 'registration', label: 'Registration', short: 'Register', pct: 6 },
  { key: 'bootcamp', label: 'Bootcamp', short: 'Bootcamp', pct: 14 },
  { key: 'ced_evaluation', label: 'CED Evaluation', short: 'CED Eval', pct: 30 },
  { key: 'data_collection', label: 'Data Collection', short: 'Data', pct: 42 },
  { key: 'ced_final', label: 'CED Final Evaluation', short: 'Final Eval', pct: 52 },
  { key: 'edi_evaluation', label: 'Grant Review', short: 'Review', pct: 62 },
  { key: 'approval', label: 'Grant Approval', short: 'Approval', pct: 74 },
  { key: 'grant_phase1', label: 'Grant Phase 1', short: 'Phase 1', pct: 83 },
  { key: 'grant_phase2', label: 'Grant Phase 2', short: 'Phase 2', pct: 91 },
  { key: 'grant_phase3', label: 'Grant Phase 3', short: 'Phase 3', pct: 97 },
  { key: 'completed', label: 'Completed', short: 'Done', pct: 100 },
];

export const STAGE_KEYS = STAGES.map(s => s.key);
export const STAGE_MAP = STAGES.reduce((acc, s) => { acc[s.key] = s; return acc; }, {});

export const STATUS_META = {
  pending: { label: 'Pending', cls: 'badge-neutral' },
  in_progress: { label: 'In Progress', cls: 'badge-info' },
  verified: { label: 'Verified', cls: 'badge-success' },
  returned_for_correction: { label: 'Returned for Correction', cls: 'badge-warning' },
  selected: { label: 'Selected', cls: 'badge-success' },
  waiting: { label: 'Waiting', cls: 'badge-warning' },
  rejected: { label: 'Rejected', cls: 'badge-danger' },
  not_attended: { label: 'Not Attended', cls: 'badge-warning' },
  on_hold: { label: 'On Hold', cls: 'badge-neutral' },
  approved: { label: 'Approved', cls: 'badge-success' },
  completed: { label: 'Completed', cls: 'badge-success' },
  scheduled: { label: 'Scheduled', cls: 'badge-info' },
  cancelled: { label: 'Cancelled', cls: 'badge-danger' },
  rescheduled: { label: 'Rescheduled', cls: 'badge-warning' },
  released: { label: 'Released', cls: 'badge-success' },
  not_submitted: { label: 'Not Submitted', cls: 'badge-neutral' },
  submitted: { label: 'Submitted', cls: 'badge-info' },
  under_evaluation: { label: 'Under Evaluation', cls: 'badge-info' },
};

export const SECTORS = ['Agritech', 'Healthtech', 'Fintech', 'EdTech', 'CleanTech', 'Manufacturing', 'Textiles', 'Food Processing', 'Logistics', 'IoT & Hardware', 'Biotechnology', 'Retail Tech', 'SaaS / Software'];
export const DEFAULT_BATCHES = ['2024-25', '2025-26', '2026-27'];
export const CURRENT_BATCH = '2026-27';

export function pad(n, len = 2) {
  let str = String(n);
  while (str.length < len) str = '0' + str;
  return str;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + (String(dateStr).length <= 10 ? 'T00:00:00' : ''));
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function getAppYear(app) {
  if (!app) return '2026';
  if (app.createdDate) {
    const yr = String(app.createdDate).slice(0, 4);
    if (/^\d{4}$/.test(yr)) return yr;
  }
  if (app.batch) {
    const m = String(app.batch).match(/^(\d{4})/);
    if (m) return m[1];
  }
  return '2026';
}

export function fmtDateTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function fmtRelative(ts) {
  if (!ts) return '—';
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return min + ' min ago';
  const hr = Math.floor(min / 60);
  if (hr < 24) return hr + ' hr ago';
  const day = Math.floor(hr / 24);
  if (day === 1) return 'Yesterday';
  if (day < 7) return day + ' days ago';
  return fmtDate(new Date(ts).toISOString().slice(0, 10));
}

export function fmtMoney(n) {
  const num = Number(n) || 0;
  return '₹' + num.toLocaleString('en-IN');
}

export function esc(s) {
  if (s === undefined || s === null) return '';
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function validEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function validPhone(v) {
  return /^[6-9]\d{9}$/.test(String(v).replace(/\D/g, '').slice(-10));
}

export function stageIndex(key) {
  const i = STAGE_KEYS.indexOf(key);
  return i < 0 ? 0 : i;
}

export function stagePct(key) {
  const s = STAGE_MAP[key];
  return s ? s.pct : 0;
}

export function stageLabel(key) {
  const s = STAGE_MAP[key];
  return s ? s.label : 'Registration';
}

export function waLink(phone, text) {
  const p = String(phone || '').replace(/\D/g, '');
  const full = p.length === 10 ? '91' + p : p;
  return 'https://wa.me/' + full + '?text=' + encodeURIComponent(text || '');
}
