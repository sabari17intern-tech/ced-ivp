const fs = require('fs');
const xlsx = require('xlsx');
const wb = xlsx.readFile('ivp - pitch deck_startify (1).xlsx');

// Helper: read sheet as JSON rows
function readSheet(name) {
  const ws = wb.Sheets[name];
  if (!ws) return [];
  return xlsx.utils.sheet_to_json(ws, { defval: '' });
}

// ========== LOAD ALL SHEETS ==========
const sheetIVP = readSheet(' ivp');            // Main IVP tracker (name, email, pass, status, phone, team size, registered, gender, caste, tier, etc.)
const sheetSanctioned = readSheet('IVP amount sanctioned'); // LinkedIn, pitch deck
const sheetReview = readSheet('review schedule');           // Startup name, domain, college, session
const sheetFunds = readSheet('all funds -1926');            // Company name, thrust area, amount
const sheetProblem = readSheet('ivp - problem statement');  // Problem statement, domain tags
const sheetStartify = readSheet('startify3.0');             // College name, domain, status

// ========== BUILD LOOKUP MAPS (by phone) ==========
function normPhone(p) {
  return String(p).replace(/[^0-9]/g, '').slice(-10);
}

function buildMap(rows, phoneKeys) {
  const map = {};
  rows.forEach(r => {
    for (const k of phoneKeys) {
      const val = r[k];
      if (val) {
        const p = normPhone(val);
        if (p.length === 10) { map[p] = Object.assign(map[p] || {}, r); break; }
      }
    }
  });
  return map;
}

// Also build by TEAM ID
function buildTeamMap(rows, teamKeys) {
  const map = {};
  rows.forEach(r => {
    for (const k of teamKeys) {
      const val = String(r[k] || '').trim();
      if (val && val !== '#N/A' && val.length > 2) { map[val.toUpperCase()] = Object.assign(map[val.toUpperCase()] || {}, r); break; }
    }
  });
  return map;
}

const sanctionedByPhone = buildMap(sheetSanctioned, ['phone no.']);
const reviewByPhone = buildMap(sheetReview, ['Contact']);
const fundsByPhone = buildMap(sheetFunds, []); // no phone column — match by name later
const problemByPhone = buildMap(sheetProblem, ['phone no.']);
const startifyByPhone = buildMap(sheetStartify, ['PHNO.']);

const reviewByTeam = buildTeamMap(sheetReview, ['TEAM ID']);
const problemByTeam = buildTeamMap(sheetProblem, ['TEAM ID']);

// Funds by name (fuzzy)
const fundsByName = {};
sheetFunds.forEach(r => {
  const name = String(r['NAME'] || '').trim().toLowerCase().replace(/[^a-z]/g, '');
  if (name.length > 3) fundsByName[name] = r;
});

// ========== BUILD DATABASE ==========
const db = {
  applications: [],
  members: [],
  teams: [],
  users: [
    { username: 'admin', password: 'admin123', role: 'admin', name: 'CED Administrator', designation: 'Programme Office, CED' }
  ],
  meta: {
    orgName: 'CED GRANT',
    currentBatch: '2026-27',
    batches: ['2024-25', '2025-26', '2026-27'],
    round1Criteria: [],
    round2Gates: [],
    portalTitle: 'CED Grant Management',
    portalSubtitle: 'CED, Anna University'
  }
};

const today = new Date().toISOString().split('T')[0];
const seenPhones = new Set();
let count = 1;

// Primary source: the ' ivp' sheet (most complete)
sheetIVP.forEach(row => {
  const name = String(row[' Name'] || row['Name'] || '').trim();
  const email = String(row['EMAIL'] || '').trim();
  const password = row['PASSWORD'] ? String(row['PASSWORD']).trim() : 'grant123';
  const phone = normPhone(row['phone no.'] || '');
  const teamId = String(row['TEAM ID'] || '').trim();
  const rawBatch = String(row['                                                                        '] || '').trim(); // The batch column has lots of spaces
  
  if (!name || name === 'nan') return;
  if (phone.length < 10 && !name) return;
  if (seenPhones.has(phone) && phone) return;
  if (phone) seenPhones.add(phone);

  const appId = 'GRT-2026-27-' + String(count).padStart(3, '0');
  count++;

  // Grant status
  const rawStatus = String(row['grant status'] || '').toLowerCase();
  let stage = 'registration', status = 'pending';
  if (rawStatus.includes('selected') && !rawStatus.includes('not')) { stage = 'grant'; status = 'selected'; }
  else if (rawStatus.includes('not selected') || rawStatus.includes('not')) { status = 'rejected'; }
  else if (rawStatus.includes('yet') || rawStatus.includes('pending')) { status = 'pending'; }

  // Gender
  const rawG = String(row['gender'] || '').toLowerCase();
  const gender = rawG.startsWith('m') ? 'Male' : rawG.startsWith('f') ? 'Female' : rawG ? 'Other' : '';

  // Caste
  const rawC = String(row['caste'] || '').toUpperCase().replace(/[^A-Z]/g, '');
  const casteMap = { GENERAL: 'General', GEN: 'General', OBC: 'OBC', SC: 'SC', ST: 'ST', BC: 'BC', MBC: 'MBC', FC: 'FC' };
  const caste = casteMap[rawC] || (rawC ? rawC.slice(0, 10) : '');

  // Tier
  const rawT = String(row['tier '] || row['tier'] || '').toLowerCase();
  const tier = rawT.includes('1') ? 'Tier 1' : rawT.includes('2') ? 'Tier 2' : rawT.includes('3') ? 'Tier 3' : '';

  // Team size
  const rawTeamSize = String(row['team size'] || '').replace(/[^0-9]/g, '');
  const teamSize = parseInt(rawTeamSize) || 0;

  // Startup registered
  const rawReg = String(row['Start up Registered'] || '').toLowerCase();
  const regType = /pvt|private|company/.test(rawReg) ? 'Pvt Ltd' : /llp/.test(rawReg) ? 'LLP' : /proprietor/.test(rawReg) ? 'Proprietorship' : '';

  // Women beneficiaries
  const womenBenef = parseInt(String(row['women beneficiaries'] || '0').replace(/[^0-9]/g, '')) || 0;

  // Address / college
  const address = String(row['address'] || '').trim();

  // Pitch deck
  const pitchLink = String(row['pitch deck file '] || row['pitch deck file'] || '').trim();

  // Total amount
  const rawAmount = String(row['Total amount'] || '').replace(/[^0-9.]/g, '');
  const fundingRequested = parseFloat(rawAmount) || 0;

  // Batch
  const batch = rawBatch.includes('25') ? '2025-26' : rawBatch.includes('24') ? '2024-25' : '2026-27';

  // ---- ENRICH from other sheets ----
  const sanc = sanctionedByPhone[phone] || {};
  const rev = reviewByPhone[phone] || reviewByTeam[teamId.toUpperCase()] || {};
  const prob = problemByPhone[phone] || problemByTeam[teamId.toUpperCase()] || {};
  const stfy = startifyByPhone[phone] || {};
  const nameLower = name.toLowerCase().replace(/[^a-z]/g, '');
  const fund = fundsByName[nameLower] || {};

  // LinkedIn from sanctioned sheet
  const linkedin = String(sanc['Linkedin '] || sanc['Linkedin'] || '').trim();
  const collegeLinkedin = String(sanc['colege linkedin'] || '').trim();

  // Startup name, domain from review schedule
  const startupName = String(rev['startup name'] || '').trim();
  const domain = String(rev['Domain'] || stfy['Domain'] || '').trim();
  const collegeName = String(rev['College name'] || stfy['College name'] || address || '').trim();
  const session = String(rev['Session no.'] || '').trim();

  // Company name, thrust area, sanctioned amount from funds sheet
  const companyName = String(fund['COMPANY / PRODUCT NAME'] || '').trim();
  const thrustArea = String(fund['THRUST AREA'] || '').trim();
  const rawSancAmount = String(fund['AMOUNT'] || '').replace(/[^0-9.]/g, '');
  const sanctionedAmount = parseFloat(rawSancAmount) || fundingRequested;

  // Problem statement from problem sheet
  const problemStatement = String(prob['problem statement'] || '').trim();
  const domainTags = String(prob['Domain Tags'] || '').trim();

  // Idea name: prefer startup name > company name > domain
  const ideaName = startupName || companyName || domain || '(from CED sheet)';
  const sector = thrustArea || domain || domainTags.split(',')[0]?.trim() || 'Technology';

  const app = {
    applicationId: appId,
    applicantName: name,
    phone: phone,
    email: email,
    memberId: null,
    teamId: teamId || null,
    type: teamSize > 1 ? 'team' : 'individual',
    batch: batch,
    gender: gender,
    caste: caste,
    tier: tier,
    college: collegeName,
    womenBeneficiaries: womenBenef,
    ideaName: ideaName,
    sector: sector,
    industry: thrustArea || domain || 'Technology',
    ideaDescription: problemStatement.slice(0, 500),
    problemStatement: problemStatement,
    proposedSolution: '',
    businessModel: '',
    expectedImpact: '',
    fundingRequested: sanctionedAmount || fundingRequested,
    stage: stage,
    status: status,
    bootcamp: { attended: rawStatus.includes('selected') || String(row['COMPLETED'] || '').includes('COMPLETED'), date: '', remarks: '' },
    data: {
      consentLetter: false, fundingTemplate: false,
      msmeRegistered: !!regType, msmeNumber: '',
      status: 'pending', submittedDate: '',
      teamId: teamId,
      teamSize: teamSize,
      linkedin: linkedin,
      collegeLinkedin: collegeLinkedin,
      domain: domain,
      domainTags: domainTags,
      session: session,
      startupRegistered: regType || rawReg
    },
    rounds: {},
    finalEval: { status: 'pending', decision: '', remarks: '', date: '' },
    edi: { status: 'not_submitted', grantReviewAppId: '', decisionDate: '', remarks: '' },
    bank: { accountName: '', accountNumber: '', bankName: '', ifscCode: '', branch: '' },
    registration: { udyamNumber: '', gstNumber: '', panNumber: '', registrationType: regType, pitchLink: pitchLink },
    grant: {
      approvalDate: '', sanctionLetterNo: '', approvedAmount: sanctionedAmount, grantType: 'Grant Fund',
      bankVerification: 'Pending', agreementStatus: 'Pending',
      phase1: { amount: 0, eligibleAmount: 0, releaseDate: '', status: 'pending', refNumber: '', remarks: '' },
      phase2: { amount: 0, eligibleAmount: 0, releaseDate: '', status: 'pending', refNumber: '', remarks: '' },
      phase3: { amount: 0, eligibleAmount: 0, releaseDate: '', status: 'pending', refNumber: '', remarks: '' }
    },
    pitchLink: pitchLink,
    documents: [],
    notes: [],
    createdDate: today,
    lastUpdated: today,
    history: [{ date: today, time: '12:00', user: 'System', action: 'Imported from CED Excel', from: '', to: stage, remarks: 'Batch ' + batch }]
  };

  db.applications.push(app);

  if (phone && phone.length === 10) {
    db.users.push({
      username: phone,
      password: password || 'grant123',
      role: 'applicant',
      name: name,
      linkedApplicationId: appId
    });
  }
});

// ========== GENERATE SQL ==========
const jsonString = JSON.stringify(db).replace(/'/g, "''");

const sql = `-- ==============================================================================
-- CED GRANT MANAGEMENT - COMPLETE DATABASE SETUP
-- Run this ONCE in Supabase SQL Editor
-- ==============================================================================

-- Step 1: Create table
CREATE TABLE IF NOT EXISTS ivp_app_state (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Security policies
ALTER TABLE ivp_app_state ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ivp_app_state' AND policyname='Allow anon read') THEN
    CREATE POLICY "Allow anon read" ON ivp_app_state FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ivp_app_state' AND policyname='Allow anon insert') THEN
    CREATE POLICY "Allow anon insert" ON ivp_app_state FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ivp_app_state' AND policyname='Allow anon update') THEN
    CREATE POLICY "Allow anon update" ON ivp_app_state FOR UPDATE USING (true);
  END IF;
END $$;

-- Step 3: Insert all data (admin + ${db.applications.length} applications)
INSERT INTO ivp_app_state (id, data, updated_at)
VALUES (1, '${jsonString}'::jsonb, NOW())
ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();

-- ==============================================================================
-- DONE! Login: admin / admin123
-- Total applications imported: ${db.applications.length}
-- Total user accounts: ${db.users.length} (1 admin + ${db.users.length - 1} students)
-- ==============================================================================
`;

fs.writeFileSync('final_supabase_setup.sql', sql, 'utf8');

// Summary
const selected = db.applications.filter(a => a.status === 'selected').length;
const withProblem = db.applications.filter(a => a.problemStatement).length;
const withLinkedin = db.applications.filter(a => a.data.linkedin).length;
const withStartup = db.applications.filter(a => a.ideaName && a.ideaName !== '(from CED sheet)').length;
const withFunding = db.applications.filter(a => a.fundingRequested > 0).length;

console.log('========================================');
console.log('IMPORT SUMMARY');
console.log('========================================');
console.log('Total applications:', db.applications.length);
console.log('  - IVP Selected:', selected);
console.log('  - With startup name:', withStartup);
console.log('  - With problem statement:', withProblem);
console.log('  - With LinkedIn:', withLinkedin);
console.log('  - With funding amount:', withFunding);
console.log('Total user accounts:', db.users.length, '(1 admin +', db.users.length - 1, 'students)');
console.log('SQL file size:', (sql.length / 1024).toFixed(1), 'KB');
console.log('========================================');
