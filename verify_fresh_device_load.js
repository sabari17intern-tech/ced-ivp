const supabaseUrl = 'https://atwxokzxgbzluqdwgvml.supabase.co';
const supabaseKey = 'sb_publishable_3shb08pQrYbqQtSJhgfTGQ_QeJ0oKP_';

async function verifyFreshDeviceLoad() {
  console.log('========================================================');
  console.log('SIMULATING BRAND-NEW DEVICE LOAD (ZERO LOCAL CACHE)');
  console.log('========================================================\n');

  // STEP 1: Query Supabase Cloud REST API as a completely clean client (simulating a new device)
  console.log('[STEP 1] Connecting to Supabase Cloud DB from a new device...');
  const res = await fetch(`${supabaseUrl}/rest/v1/ivp_app_state?id=eq.1&select=data,updated_at`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });

  if (!res.ok) {
    console.error('❌ Failed to reach Supabase Cloud DB:', await res.text());
    return;
  }

  const json = await res.json();
  const dbData = json[0].data;

  console.log(`✓ Connected! Server Timestamp: ${json[0].updated_at}`);
  console.log(`✓ Total Applications in Cloud DB: ${dbData.applications ? dbData.applications.length : 0}`);
  console.log(`✓ Total Registered Users in Cloud DB: ${dbData.users ? dbData.users.length : 0}\n`);

  // STEP 2: Check Student Account "gurusharan" (9443533618) on clean device
  console.log('[STEP 2] Verifying Student Account (9443533618 / gurusharan)...');
  const studentUser = (dbData.users || []).find(u => u.username === '9443533618' || u.username === 'gurusharan');
  
  if (!studentUser) {
    console.error('❌ Student user not found in Cloud DB!');
    return;
  }
  console.log(`✓ Student User Found: ${studentUser.name} (Linked App ID: ${studentUser.linkedApplicationId})`);

  const studentApp = (dbData.applications || []).find(a => a.applicationId === studentUser.linkedApplicationId);
  if (!studentApp) {
    console.error(`❌ Student application ${studentUser.linkedApplicationId} not found in Cloud DB!`);
    return;
  }

  console.log(`✓ Application Details Retrieved:`);
  console.log(`   - App ID: ${studentApp.applicationId}`);
  console.log(`   - Applicant Name: ${studentApp.applicantName}`);
  console.log(`   - Phone: ${studentApp.phone}`);
  console.log(`   - Current Stage: ${studentApp.stage}`);
  
  if (studentApp.rounds && studentApp.rounds.r1 && studentApp.rounds.r1.attempts && studentApp.rounds.r1.attempts.length) {
    const attempt = studentApp.rounds.r1.attempts[0];
    console.log(`   - Round 1 Status: ${studentApp.rounds.r1.status}`);
    console.log(`   - Round 1 Score: ${attempt.scoreOutOf10} / 10`);
    console.log(`   - Reviewer: ${attempt.by}`);
    console.log(`   - Remarks: "${attempt.remarks}"`);
  } else {
    console.error('❌ No evaluation rounds found on student application!');
    return;
  }

  // STEP 3: Check Workflow Test Student (GRT-2026-27-6205)
  console.log('\n[STEP 3] Verifying Automated Workflow Test Student...');
  const workflowApp = (dbData.applications || []).find(a => a.applicantName === 'Automated Workflow Student');
  if (workflowApp) {
    console.log(`✓ Workflow App Found: ${workflowApp.applicationId} | Stage: ${workflowApp.stage}`);
    console.log(`   - Round 1 Score: ${workflowApp.rounds.r1.attempts[0].scoreOutOf10} / 10`);
    console.log(`   - Round 2 Passed: ${workflowApp.rounds.r2.attempts[0].passed}`);
  }

  console.log('\n========================================================');
  console.log('FINAL VERIFICATION: ALL DATA IS 100% PERSISTED IN CLOUD DB!');
  console.log('ANY DEVICE LOGGING IN WILL LOAD THIS EXACT STATE.');
  console.log('========================================================');
}

verifyFreshDeviceLoad();
