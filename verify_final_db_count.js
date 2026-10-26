const supabaseUrl = 'https://atwxokzxgbzluqdwgvml.supabase.co';
const supabaseKey = 'sb_publishable_3shb08pQrYbqQtSJhgfTGQ_QeJ0oKP_';

async function verifyFinalCount() {
  console.log('Querying live Supabase Cloud Database...');
  
  const res = await fetch(`${supabaseUrl}/rest/v1/ivp_app_state?id=eq.1&select=data,updated_at`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });

  if (!res.ok) {
    console.error('Failed to fetch from Supabase:', await res.text());
    return;
  }

  const json = await res.json();
  const row = json[0];
  const state = row.data;

  console.log('\n--- LIVE SUPABASE CLOUD DATABASE SUMMARY ---');
  console.log(`Last Updated At: ${row.updated_at}`);
  console.log(`Total Applications Stored: ${state.applications ? state.applications.length : 0}`);
  console.log(`Total Registered Users Stored: ${state.users ? state.users.length : 0}`);

  const sharanApps = (state.applications || []).filter(a =>
    (a.applicantName && a.applicantName.toLowerCase().includes('sharan')) ||
    a.phone === '9443533618' ||
    a.phone === '9894090630'
  );

  console.log(`\nSharan Application Records Stored (${sharanApps.length}):`);
  sharanApps.forEach(a => {
    console.log(`  - App ID: ${a.applicationId} | Name: ${a.applicantName} | Phone: ${a.phone} | Stage: ${a.stage}`);
    if (a.rounds && a.rounds.r1 && a.rounds.r1.attempts && a.rounds.r1.attempts.length) {
      console.log(`    Round 1 Score: ${a.rounds.r1.attempts[0].scoreOutOf10}/10 | Reviewer: ${a.rounds.r1.attempts[0].by}`);
    }
  });
}

verifyFinalCount();
