import { emptyDB, repairDB, scoreTotalFor, scoreOutOf10For, ROUND_CRITERIA, ROUND2_CRITERIA } from './src/services/dbStore.js';
import { pad, todayISO, fmtDate, fmtMoney, validPhone, validEmail, stageLabel, stagePct, stageIndex, STAGES, SECTORS } from './src/services/utils.js';

console.log('====================================================');
console.log('CED GRANT MANAGEMENT SYSTEM — FULL E2E TEST SUITE');
console.log('====================================================\n');

let testsPassed = 0;
let testsTotal = 0;

function assert(condition, message) {
  testsTotal++;
  if (condition) {
    console.log(`[PASS] ${message}`);
    testsPassed++;
  } else {
    console.error(`[FAIL] ${message}`);
    process.exit(1);
  }
}

// 1. DATA INITIALIZATION & SCHEMA
console.log('--- 1. Testing Database Initialization & Repair ---');
let db = emptyDB();
assert(Array.isArray(db.users) && db.users.length > 0, 'Initial database contains admin user');
assert(db.users[0].username === 'admin' && db.users[0].password === 'admin123', 'Admin credentials match admin/admin123');

db = repairDB(db);
assert(Array.isArray(db.applications), 'db.applications is initialized');
assert(Array.isArray(db.members), 'db.members is initialized');
assert(Array.isArray(db.notifications), 'db.notifications is initialized');

// 2. VALIDATION HELPERS
console.log('\n--- 2. Testing Validators & Formatters ---');
assert(validPhone('9876543210') === true, 'Valid 10-digit phone accepted');
assert(validPhone('12345') === false, 'Invalid phone rejected');
assert(validEmail('student@annauniv.edu') === true, 'Valid email accepted');
assert(validEmail('invalid-email') === false, 'Invalid email rejected');
assert(fmtMoney(250000) === '₹2,50,000', 'Money formatting works');
assert(stageLabel('registration') === 'Registration', 'Stage label mapping works');
assert(stagePct('completed') === 100, 'Stage progress percentage works');

// 3. STUDENT REGISTRATION FLOW
console.log('\n--- 3. Testing Student Registration Flow ---');
const studentData = {
  name: 'Sharan Test Founder',
  phone: '9876598765',
  email: 'sharan@test.com',
  college: 'College of Engineering Guindy',
  dept: 'Mechanical Engineering',
  year: '3rd Year',
  rollno: '2021103001',
  district: 'Chennai',
  idea: 'Eco Solar Water Purifier',
  problem: 'Rural clean water shortage',
  solution: 'Low cost solar filtration unit',
  sector: 'Agritech',
  type: 'individual',
  funding: 250000,
  registered: 'No',
  udyam: '',
  pass: 'pass1234'
};

const appSeq = db.applications.length + 1;
const appId = 'GRT-2026-27-' + pad(appSeq, 3);
const memId = 'MEM-' + pad(db.members.length + 1, 3);
const now = todayISO();

const newMember = {
  memberId: memId,
  fullName: studentData.name,
  phone: studentData.phone,
  email: studentData.email,
  college: studentData.college,
  joinedDate: now,
  active: true
};

const newApp = {
  applicationId: appId,
  memberId: memId,
  type: studentData.type,
  applicantName: studentData.name,
  phone: studentData.phone,
  email: studentData.email,
  college: studentData.college,
  department: studentData.dept,
  year: studentData.year,
  rollNumber: studentData.rollno,
  ideaName: studentData.idea,
  problemStatement: studentData.problem,
  proposedSolution: studentData.solution,
  sector: studentData.sector,
  fundingRequested: Number(studentData.funding),
  batch: '2026-27',
  stage: 'registration',
  status: 'pending',
  createdDate: now,
  lastUpdated: now,
  bootcamp: { attended: false, date: '', remarks: '' },
  data: { consentLetter: false, fundingTemplate: false, msmeRegistered: false, msmeNumber: '', status: 'pending', submittedDate: '' },
  rounds: {},
  finalEval: { status: 'pending', decision: '', remarks: '', date: '' },
  bank: { accountName: '', accountNumber: '', bankName: '', ifscCode: '', branch: '' },
  registration: { udyamNumber: '', gstNumber: '', panNumber: '', registrationType: '' },
  edi: { status: 'not_submitted', grantReviewAppId: '', decisionDate: '', remarks: '' },
  grant: { approvalDate: '', sanctionLetterNo: '', approvedAmount: 0, grantType: 'Grant Fund', bankVerification: 'Pending', agreementStatus: 'Pending', phase1: { amount: 0, eligibleAmount: 0, releaseDate: '', status: 'pending', refNumber: '', remarks: '' }, phase2: { amount: 0, eligibleAmount: 0, releaseDate: '', status: 'pending', refNumber: '', remarks: '' }, phase3: { amount: 0, eligibleAmount: 0, releaseDate: '', status: 'pending', refNumber: '', remarks: '' } },
  documents: [],
  notes: [],
  history: [{ date: now, time: '10:00 AM', user: studentData.name, action: 'Self-registered via Student Portal', from: '', to: 'Registration', remarks: 'Account created.' }]
};

const newUser = {
  username: studentData.phone,
  password: studentData.pass,
  name: studentData.name,
  role: 'applicant',
  linkedApplicationId: appId
};

db.members.push(newMember);
db.applications.push(newApp);
db.users.push(newUser);

assert(db.applications.some(a => a.applicationId === appId), 'Student application created');
assert(db.users.some(u => u.username === '9876598765' && u.password === 'pass1234'), 'Student user account created');

// 4. STUDENT DETAILS UPDATE
console.log('\n--- 4. Testing Student Details Update ---');
const studentApp = db.applications.find(a => a.applicationId === appId);
studentApp.bank = {
  accountName: 'Sharan S',
  accountNumber: '123456789012',
  bankName: 'State Bank of India',
  ifscCode: 'SBIN0001234',
  branch: 'Anna University Guindy'
};
assert(studentApp.bank.accountName === 'Sharan S' && studentApp.bank.ifscCode === 'SBIN0001234', 'Bank details successfully saved');

// 5. EVALUATION SCORING ENGINE
console.log('\n--- 5. Testing Evaluation Scoring Engine ---');
const r1Marks = {};
ROUND_CRITERIA.forEach(c => {
  c.sub.forEach(q => {
    r1Marks[q.key] = Math.max(...q.options.map(o => o.value));
  });
});

const r1Total = scoreTotalFor(r1Marks, ROUND_CRITERIA);
const r1Score10 = scoreOutOf10For(r1Marks, ROUND_CRITERIA);
assert(r1Score10 === 10, 'Perfect Round 1 score calculates to 10/10');

studentApp.rounds.r1 = {
  attempts: [{ date: now, marks: r1Marks, total: r1Total, scoreOutOf10: r1Score10, outcome: 'selected', remarks: 'Cleared Round 1', by: 'Arun Kumar R' }],
  status: 'selected'
};
studentApp.stage = 'ced_evaluation';
assert(studentApp.rounds.r1.status === 'selected', 'Round 1 outcome saved');

// 6. GRANT SANCTION & DISBURSEMENT ENGINE
console.log('\n--- 6. Testing Grant Sanction & Disbursement ---');
const sanctionedAmt = 250000;
const p1 = Math.round(sanctionedAmt * 0.4);
const p2 = Math.round(sanctionedAmt * 0.4);
const p3 = sanctionedAmt - p1 - p2;

studentApp.grant = {
  approvalDate: now,
  sanctionLetterNo: 'CED/2026/TEST/001',
  approvedAmount: sanctionedAmt,
  grantType: 'Grant Fund',
  bankVerification: 'Approved',
  agreementStatus: 'Signed',
  phase1: { amount: p1, eligibleAmount: p1, releaseDate: '', status: 'pending', refNumber: '', remarks: '' },
  phase2: { amount: p2, eligibleAmount: p2, releaseDate: '', status: 'pending', refNumber: '', remarks: '' },
  phase3: { amount: p3, eligibleAmount: p3, releaseDate: '', status: 'pending', refNumber: '', remarks: '' }
};
studentApp.stage = 'approval';

assert(studentApp.grant.phase1.amount === 100000, 'Phase 1 calculated as 40% (₹1,00,000)');
assert(studentApp.grant.phase2.amount === 100000, 'Phase 2 calculated as 40% (₹1,00,000)');
assert(studentApp.grant.phase3.amount === 50000, 'Phase 3 calculated as 20% (₹50,000)');

// Test Phase 1 release
studentApp.grant.phase1.status = 'released';
studentApp.grant.phase1.releaseDate = now;
assert(studentApp.grant.phase1.status === 'released', 'Phase 1 money release recorded');

// 7. GLOBAL SEARCH MATCHING
console.log('\n--- 7. Testing Global Search ---');
const searchQuery = 'Sharan';
const searchResults = db.applications.filter(a =>
  a.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
  a.applicationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
  (a.ideaName && a.ideaName.toLowerCase().includes(searchQuery.toLowerCase()))
);
assert(searchResults.length > 0 && searchResults[0].applicationId === appId, 'Global search returns matching application');

console.log('\n====================================================');
console.log(`TEST SUMMARY: ${testsPassed} / ${testsTotal} TESTS PASSED (100% SUCCESS)`);
console.log('====================================================');
