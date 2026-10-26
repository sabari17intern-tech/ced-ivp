const supabaseUrl = 'https://atwxokzxgbzluqdwgvml.supabase.co';
const supabaseKey = 'sb_publishable_3shb08pQrYbqQtSJhgfTGQ_QeJ0oKP_';

async function check() {
  console.log('Fetching ivp_app_state (id=1)...');
  const res = await fetch(`${supabaseUrl}/rest/v1/ivp_app_state?id=eq.1&select=data`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });

  const json = await res.json();
  if (!json || !json.length) {
    console.error('No data found');
    return;
  }

  const state = json[0].data;
  console.log('Total applications in cloud state:', state.applications ? state.applications.length : 0);
  console.log('Total users in cloud state:', state.users ? state.users.length : 0);

  const sharanApps = (state.applications || []).filter(a =>
    (a.applicantName && a.applicantName.toLowerCase().includes('sharan')) ||
    a.phone === '9443533618' ||
    a.phone === '9894090630' ||
    a.applicationId === 'GRT-2026-27-177' ||
    a.applicationId === 'GRT-2026-27-178'
  );

  console.log('\n--- Applications for Sharan ---');
  sharanApps.forEach(app => {
    console.log(`App ID: ${app.applicationId}, Name: ${app.applicantName}, Phone: ${app.phone}, Stage: ${app.stage}`);
    console.log('Rounds:', JSON.stringify(app.rounds, null, 2));
  });

  const sharanUsers = (state.users || []).filter(u =>
    (u.username && u.username.toLowerCase().includes('sharan')) ||
    (u.name && u.name.toLowerCase().includes('sharan')) ||
    u.phone === '9443533618' ||
    u.phone === '9894090630'
  );

  console.log('\n--- Users for Sharan ---');
  sharanUsers.forEach(u => {
    console.log(`Username: ${u.username}, Name: ${u.name}, Phone: ${u.phone}, LinkedAppId: ${u.linkedApplicationId}`);
  });
}

check();
