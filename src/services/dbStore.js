import { supabase } from './supabase.js';
import { pad, todayISO, DEFAULT_BATCHES, CURRENT_BATCH, STAGES, STAGE_MAP, STAGE_KEYS, stageIndex } from './utils.js';

export const DB_KEY = 'sharan_ivp_db_v6';
export const DB_ROW_ID = 1;

export const REVIEWERS = [
  { key: 'round1', name: 'Arun Kumar R', role: 'Round 1 Reviewer', round: 1, mode: 'Online' },
  { key: 'round2', name: 'Sakthivel S', role: 'Round 2 Reviewer', round: 2, mode: 'Online' },
];

export const ROUND_CRITERIA = [
  {
    key: 'p1', label: 'Problem / Need Significance', weight: 20, sub: [
      { key: 'p1a', label: 'Is the problem real, clearly defined and significant?', max: 10, options: [{ label: 'Yes', value: 10 }, { label: 'No', value: 0 }] },
      { key: 'p1b', label: 'Who experiences it?', max: 10, options: [{ label: 'Very few', value: 0 }, { label: 'Some people', value: 5 }, { label: 'Many / widespread', value: 10 }] },
    ]
  },
  {
    key: 'p2', label: 'Innovation & Originality', weight: 20, sub: [
      { key: 'p2a', label: 'What is genuinely new?', max: 10, options: [{ label: 'Nothing new', value: 0 }, { label: 'Somewhat new', value: 5 }, { label: 'Highly novel', value: 10 }] },
      { key: 'p2b', label: 'Improvement over existing solutions?', max: 10, options: [{ label: 'Yes', value: 10 }, { label: 'No', value: 0 }] },
    ]
  },
  {
    key: 'p3', label: 'Technology / Technical Feasibility', weight: 30, sub: [
      { key: 'p3a', label: 'Can the proposed technology actually work?', max: 30, options: [{ label: 'Yes, clearly feasible', value: 30 }, { label: 'Partially - needs more R&D', value: 15 }, { label: 'No', value: 0 }] },
    ]
  },
  {
    key: 'p4', label: 'Solution & Product Concept', weight: 20, sub: [
      { key: 'p4a', label: 'Clarity of proposed solution', max: 20, options: [{ label: 'Unclear', value: 0 }, { label: 'Somewhat clear', value: 10 }, { label: 'Very clear', value: 20 }] },
    ]
  },
  {
    key: 'p9', label: 'Clarity of Proposal & Pitch', weight: 10, sub: [
      { key: 'p9a', label: 'Logical presentation, evidence, responsiveness to questions', max: 10, options: [{ label: 'Weak', value: 0 }, { label: 'Moderate', value: 5 }, { label: 'Strong', value: 10 }] },
    ]
  },
];

export const ROUND2_CRITERIA = [
  {
    key: 'r2_p1', label: 'Market Potential & Customer Validation', weight: 30, sub: [
      { key: 'r2_p1a', label: 'Target customer & Market size', max: 15, options: [{ label: 'Not defined / Small', value: 0 }, { label: 'Partially defined / Moderate', value: 7.5 }, { label: 'Clearly defined / Large', value: 15 }] },
      { key: 'r2_p1b', label: 'Demand & Initial validation', max: 15, options: [{ label: 'None', value: 0 }, { label: 'Some (surveys)', value: 7.5 }, { label: 'Strong (pilots/LOIs)', value: 15 }] },
    ]
  },
  {
    key: 'r2_p2', label: 'Prototype / R&D Readiness', weight: 20, sub: [
      { key: 'r2_p2a', label: 'Current TRL/stage & Grant requirement', max: 20, options: [{ label: 'Concept only', value: 0 }, { label: 'Early prototype', value: 7 }, { label: 'Working prototype', value: 14 }, { label: 'Market-ready', value: 20 }] },
    ]
  },
  {
    key: 'r2_p3', label: 'Commercialisation & Business Model', weight: 30, sub: [
      { key: 'r2_p3a', label: 'Business model & Pricing strategy', max: 15, options: [{ label: 'Unclear', value: 0 }, { label: 'Basic', value: 7.5 }, { label: 'Solid/Well-justified', value: 15 }] },
      { key: 'r2_p3b', label: 'Route to market and potential revenue', max: 15, options: [{ label: 'Unclear', value: 0 }, { label: 'Basic', value: 7.5 }, { label: 'Solid', value: 15 }] },
    ]
  },
  {
    key: 'r2_p4', label: 'IP / Regulatory / Competitive Advantage', weight: 20, sub: [
      { key: 'r2_p4a', label: 'Patentability, FTO, defensibility', max: 10, options: [{ label: 'Weak/None', value: 0 }, { label: 'Moderate', value: 5 }, { label: 'Strong/Yes', value: 10 }] },
      { key: 'r2_p4b', label: 'Competing solutions analysis', max: 10, options: [{ label: 'Not analysed', value: 0 }, { label: 'Partially analysed', value: 5 }, { label: 'Well analysed', value: 10 }] },
    ]
  },
];

export function emptyDB() {
  return {
    users: [
      { username: 'admin', password: 'admin123', role: 'admin', name: 'CED Administrator', title: 'Programme Office, CED' }
    ],
    members: [],
    teams: [],
    applications: [],
    trash: [],
    reviewers: REVIEWERS.map((r, i) => ({
      reviewerId: 'REV-' + pad(i + 1, 2),
      name: r.name,
      role: r.role,
      round: r.round,
      mode: r.mode,
      email: r.name.toLowerCase().replace(/\s+/g, '.') + '@ced.annauniv.edu',
      phone: '9884681132',
      active: true,
      createdAt: todayISO()
    })),
    reviewerSlots: [],
    rounds: [],
    messages: [
      { msgId: 'MSG-001', title: 'Welcome to CED Grant', body: 'Welcome to the Centre for Entrepreneurship Development Grant Management Portal. Submit your application details to proceed.', createdBy: 'CED Admin', createdAt: Date.now() - 3 * 86400000, active: true }
    ],
    notifications: [],
    docSeq: 0,
    notifSeq: 0,
    slotSeq: 0,
    msgSeq: 1,
    meta: {
      orgName: 'Centre for Entrepreneurship Development, Anna University',
      createdAt: Date.now(),
      batches: DEFAULT_BATCHES.slice(),
      currentBatch: CURRENT_BATCH
    }
  };
}

export const LEGACY_STAGE_MAP = {
  application: 'registration',
  ced_verification: 'data_collection',
  funding_application: 'ced_final',
  edi_forwarding: 'grant_review',
  ced_pitching: 'ced_final',
  ced_decision: 'ced_final',
  pitching: 'ced_evaluation'
};

export function repairDB(db) {
  if (!db) return emptyDB();
  let fixed = 0;
  if (!Array.isArray(db.applications)) db.applications = [];
  if (!Array.isArray(db.trash)) db.trash = [];
  if (!Array.isArray(db.members)) db.members = [];
  if (!Array.isArray(db.teams)) db.teams = [];
  if (!Array.isArray(db.users)) db.users = [];
  if (!Array.isArray(db.notifications)) db.notifications = [];
  if (!Array.isArray(db.messages)) db.messages = [];

  // Ensure admin user exists
  if (!db.users.some(u => u.username === 'admin')) {
    db.users.push({ username: 'admin', password: 'admin123', role: 'admin', name: 'CED Administrator', title: 'Programme Office, CED' });
  }

  db.applications.forEach(a => {
    if (!STAGE_MAP[a.stage]) {
      a.stage = LEGACY_STAGE_MAP[a.stage] || 'registration';
      fixed++;
    }
    if (!a.bootcamp) { a.bootcamp = { attended: false, date: '', remarks: '' }; fixed++; }
    if (!a.data) { a.data = { consentLetter: false, fundingTemplate: false, msmeRegistered: false, msmeNumber: '', status: 'pending', submittedDate: '' }; fixed++; }
    if (!a.rounds) { a.rounds = {}; fixed++; }
    if (!a.finalEval) { a.finalEval = { status: 'pending', decision: '', remarks: '', date: '' }; fixed++; }
    if (!a.bank) { a.bank = { accountName: '', accountNumber: '', bankName: '', ifscCode: '', branch: '' }; fixed++; }
    if (!a.registration) { a.registration = { udyamNumber: (a.data && a.data.msmeNumber) || '', gstNumber: '', panNumber: '', registrationType: '' }; fixed++; }
    if (!a.edi) { a.edi = { status: 'not_submitted', grantReviewAppId: '', decisionDate: '', remarks: '' }; fixed++; }
    if (!a.grant) {
      a.grant = {
        approvalDate: '', sanctionLetterNo: '', approvedAmount: 0, grantType: 'Grant Fund', bankVerification: 'Pending', agreementStatus: 'Pending',
        phase1: { amount: 0, eligibleAmount: 0, releaseDate: '', status: 'pending', refNumber: '', remarks: '' },
        phase2: { amount: 0, eligibleAmount: 0, releaseDate: '', status: 'pending', refNumber: '', remarks: '' },
        phase3: { amount: 0, eligibleAmount: 0, releaseDate: '', status: 'pending', refNumber: '', remarks: '' }
      };
      fixed++;
    }
    if (!a.batch && a.createdDate) {
      const yr = String(a.createdDate).slice(0, 4);
      if (yr === '2025') a.batch = '2025-26';
      else if (yr === '2024') a.batch = '2024-25';
      else a.batch = '2026-27';
    } else if (!a.batch) {
      a.batch = '2026-27';
    }
    if (!Array.isArray(a.documents)) { a.documents = []; fixed++; }
    if (!Array.isArray(a.notes)) { a.notes = []; fixed++; }
    if (!Array.isArray(a.history)) { a.history = []; fixed++; }

    // Ensure corresponding user exists in db.users with fixed password (last 4 digits + ivp)
    const cleanPhone = (a.phone || '').replace(/\D/g, '').slice(-10);
    if (cleanPhone) {
      const fixedPassword = cleanPhone.slice(-4) + 'ivp';
      const existingUser = db.users.find(u => 
        u.username === cleanPhone || 
        (u.linkedApplicationId && u.linkedApplicationId === a.applicationId)
      );

      if (existingUser) {
        existingUser.username = cleanPhone;
        existingUser.password = fixedPassword;
        existingUser.name = a.applicantName || existingUser.name;
        existingUser.role = 'applicant';
        existingUser.linkedApplicationId = a.applicationId;
        existingUser.linkedMemberId = a.memberId;
        existingUser.phone = cleanPhone;
      } else {
        db.users.push({
          username: cleanPhone,
          password: fixedPassword,
          name: a.applicantName,
          role: 'applicant',
          linkedApplicationId: a.applicationId,
          linkedMemberId: a.memberId,
          phone: cleanPhone
        });
        fixed++;
      }
    }
  });

  // Also sync any members who have phones
  (db.members || []).forEach(m => {
    const cleanPhone = (m.phone || '').replace(/\D/g, '').slice(-10);
    if (cleanPhone && !db.users.some(u => u.username === cleanPhone)) {
      db.users.push({
        username: cleanPhone,
        password: cleanPhone.slice(-4) + 'ivp',
        name: m.fullName || 'Student Founder',
        role: 'applicant',
        linkedApplicationId: '',
        linkedMemberId: m.memberId,
        phone: cleanPhone
      });
      fixed++;
    }
  });

  // Ensure all existing applicant users have the fixed password format
  db.users.forEach(u => {
    if (u.role === 'applicant' && u.username) {
      const clean = u.username.replace(/\D/g, '').slice(-10);
      if (clean && clean.length >= 4) {
        u.password = clean.slice(-4) + 'ivp';
      }
    }
  });

  return db;
}

export function scoreTotalFor(marks, criteria) {
  if (!marks) return 0;
  const subs = criteria.reduce((a, c) => a.concat(c.sub), []);
  return subs.reduce((s, q) => s + (typeof marks[q.key] === 'number' ? marks[q.key] : 0), 0);
}

export function scoreOutOf10For(marks, criteria) {
  const max = criteria.reduce((s, c) => s + c.sub.reduce((sq, q) => sq + (q.max || 0), 0), 0) || 100;
  const tot = scoreTotalFor(marks, criteria);
  return Math.round((tot / max) * 10 * 10) / 10;
}

