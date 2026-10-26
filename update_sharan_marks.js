const supabaseUrl = 'https://atwxokzxgbzluqdwgvml.supabase.co';
const supabaseKey = 'sb_publishable_3shb08pQrYbqQtSJhgfTGQ_QeJ0oKP_';

async function updateSharanMarks() {
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

  const r1ScoreData = {
    status: 'selected',
    attempts: [
      {
        by: 'Arun Kumar R (Reviewer)',
        date: new Date().toISOString().slice(0, 10),
        marks: {
          p1a: 10,
          p1b: 10,
          p2a: 10,
          p2b: 10,
          p3a: 25,
          p4a: 10,
          p9a: 10
        },
        total: 85,
        scoreOutOf10: 8.5,
        outcome: 'selected',
        remarks: 'Excellent pitch deck and problem definition. Strong business model and technical feasibility.'
      }
    ]
  };

  let updatedCount = 0;
  (state.applications || []).forEach(app => {
    if (
      (app.applicantName && app.applicantName.toLowerCase().includes('sharan')) ||
      app.phone === '9443533618' ||
      app.phone === '9894090630' ||
      app.applicationId === 'GRT-2026-27-177' ||
      app.applicationId === 'GRT-2026-27-178' ||
      app.applicationId === 'GRT-2026-27-179'
    ) {
      console.log(`Updating marks for App ID: ${app.applicationId} (${app.applicantName})`);
      app.stage = 'ced_evaluation';
      app.rounds = app.rounds || {};
      app.rounds.r1 = r1ScoreData;
      updatedCount++;
    }
  });

  console.log(`Updated ${updatedCount} applications.`);

  // Put back to Supabase
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

  if (upsertRes.ok) {
    console.log('Successfully saved updated marks to Supabase Cloud!');
  } else {
    console.error('Failed to save to Supabase:', await upsertRes.text());
  }
}

updateSharanMarks();
