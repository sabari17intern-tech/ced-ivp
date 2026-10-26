const supabaseUrl = 'https://atwxokzxgbzluqdwgvml.supabase.co';
const supabaseKey = 'sb_publishable_3shb08pQrYbqQtSJhgfTGQ_QeJ0oKP_';

async function runEndToEndWorkflowTest() {
  console.log('=====================================================');
  console.log('STARTING END-TO-END WORKFLOW & DB PERSISTENCE TEST');
  console.log('=====================================================\n');

  // STEP 1: Fetch current state from Supabase Cloud
  console.log('[STEP 1] Fetching live state from Supabase Cloud...');
  const res = await fetch(`${supabaseUrl}/rest/v1/ivp_app_state?id=eq.1&select=data`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });

  if (!res.ok) {
    console.error('FAILED to connect to Supabase Cloud:', await res.text());
    return;
  }

  const json = await res.json();
  const state = json[0].data;
  console.log('✓ Successfully retrieved cloud DB state.');
  console.log(`  Current Applications: ${state.applications ? state.applications.length : 0}`);
  console.log(`  Current Users: ${state.users ? state.users.length : 0}\n`);

  // STEP 2: Register new test student
  const testPhone = '9123456789';
  const testAppId = `GRT-2026-27-${Date.now().toString().slice(-4)}`;
  const testUsername = 'teststudent' + Date.now().toString().slice(-4);
  const testPassword = 'password123';
  const testName = 'Automated Workflow Student';

  console.log('[STEP 2] Simulating Student Registration...');
  console.log(`  Name: ${testName}`);
  console.log(`  Phone: ${testPhone}`);
  console.log(`  App ID: ${testAppId}`);
  console.log(`  Username: ${testUsername}`);

  const newApp = {
    applicationId: testAppId,
    type: 'individual',
    applicantName: testName,
    phone: testPhone,
    email: 'test.workflow@annauniv.edu',
    college: 'CEG Guindy',
    ideaName: 'AI Powered Solar Crop Analyzer',
    sector: 'AgriTech',
    industry: 'Agriculture',
    ideaDescription: 'Automated solar-powered device to analyze crop health in real-time.',
    problemStatement: 'Farmers lack affordable real-time crop disease detection.',
    proposedSolution: 'Solar IoT sensors with edge ML classification.',
    fundingRequested: 300000,
    stage: 'registration',
    status: 'pending',
    bootcamp: { attended: true, date: '2026-10-05', remarks: 'Attended full session' },
    data: { consentLetter: true, fundingTemplate: true, msmeRegistered: true, msmeNumber: 'UDYAM-TN-03-0099881', status: 'submitted', submittedDate: '2026-10-05' },
    rounds: {},
    finalEval: { status: 'pending' },
    bank: {},
    registration: { udyamNumber: 'UDYAM-TN-03-0099881' },
    grant: { approvedAmount: 300000, phase1: { amount: 100000 }, phase2: { amount: 100000 }, phase3: { amount: 100000 } },
    documents: [],
    notes: [],
    history: [{ timestamp: new Date().toISOString(), title: 'Registered', by: testName }]
  };

  const newUser = {
    username: testUsername,
    password: testPassword,
    role: 'student',
    linkedApplicationId: testAppId,
    name: testName,
    phone: testPhone
  };

  state.applications.push(newApp);
  state.users.push(newUser);
  console.log('✓ Student registration added to payload.\n');

  // STEP 3: Admin evaluates Round 1
  console.log('[STEP 3] Admin evaluates Round 1...');
  newApp.stage = 'ced_evaluation';
  newApp.rounds.r1 = {
    status: 'selected',
    attempts: [
      {
        by: 'Arun Kumar R (Reviewer)',
        date: new Date().toISOString().slice(0, 10),
        marks: { p1a: 10, p1b: 10, p2a: 10, p2b: 10, p3a: 30, p4a: 10, p9a: 10 },
        total: 90,
        scoreOutOf10: 9.0,
        outcome: 'selected',
        remarks: 'Outstanding technology stack, clear market viability, highly recommended!'
      }
    ]
  };
  console.log('✓ Round 1 scored 9.0/10 (Status: Selected).\n');

  // STEP 4: Admin evaluates Round 2 (Gate Review)
  console.log('[STEP 4] Admin completes Round 2 Gate Review...');
  newApp.stage = 'data_collection';
  newApp.rounds.r2 = {
    status: 'selected',
    attempts: [
      {
        by: 'Sakthivel S (Reviewer)',
        date: new Date().toISOString().slice(0, 10),
        passed: true,
        gates: { g1: 'yes', g2: 'yes', g3: 'yes', g4: 'a', g5: 'yes' },
        remarks: 'All gates cleared successfully. Approved for grant funding consideration.'
      }
    ]
  };
  console.log('✓ Round 2 Gate Review PASSED.\n');

  // STEP 5: Save everything to Supabase Cloud DB
  console.log('[STEP 5] Saving updated workflow data to Supabase Cloud DB...');
  const upsertRes = await fetch(`${supabaseUrl}/rest/v1/ivp_app_state`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify({
      id: 1,
      data: state,
      updated_at: new Date().toISOString()
    })
  });

  if (!upsertRes.ok) {
    console.error('❌ FAILED to save to Supabase Cloud:', await upsertRes.text());
    return;
  }
  console.log('✓ Cloud DB update successful!\n');

  // STEP 6: Read back from Supabase Cloud to verify cross-device persistence
  console.log('[STEP 6] Verifying DB persistence by re-querying Supabase Cloud...');
  const verifyRes = await fetch(`${supabaseUrl}/rest/v1/ivp_app_state?id=eq.1&select=data`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });

  const verifyJson = await verifyRes.json();
  const verifyState = verifyJson[0].data;

  const savedApp = (verifyState.applications || []).find(a => a.applicationId === testAppId);
  const savedUser = (verifyState.users || []).find(u => u.username === testUsername);

  if (!savedApp || !savedUser) {
    console.error('❌ VERIFICATION FAILED: Record not found in Supabase Cloud DB!');
    return;
  }

  console.log('✓ VERIFICATION SUCCESSFUL! Record verified in Cloud DB:');
  console.log(`  - App ID: ${savedApp.applicationId}`);
  console.log(`  - Applicant Name: ${savedApp.applicantName}`);
  console.log(`  - Stage: ${savedApp.stage}`);
  console.log(`  - Round 1 Score: ${savedApp.rounds.r1.attempts[0].scoreOutOf10}/10`);
  console.log(`  - Round 1 Reviewer: ${savedApp.rounds.r1.attempts[0].by}`);
  console.log(`  - Round 1 Remarks: "${savedApp.rounds.r1.attempts[0].remarks}"`);
  console.log(`  - Round 2 Gate Passed: ${savedApp.rounds.r2.attempts[0].passed}`);
  console.log(`  - Linked Student Username: ${savedUser.username}`);
  console.log(`  - Linked Student Password: ${savedUser.password}`);

  console.log('\n=====================================================');
  console.log('ALL WORKFLOW STEPS PASSED & PERSISTED TO SUPABASE CLOUD');
  console.log('=====================================================');
}

runEndToEndWorkflowTest();
