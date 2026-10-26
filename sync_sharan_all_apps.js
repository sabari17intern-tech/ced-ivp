const supabaseUrl = 'https://atwxokzxgbzluqdwgvml.supabase.co';
const supabaseKey = 'sb_publishable_3shb08pQrYbqQtSJhgfTGQ_QeJ0oKP_';

async function syncSharanApps() {
  const res = await fetch(`${supabaseUrl}/rest/v1/ivp_app_state?id=eq.1&select=data`, {
    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
  });
  const json = await res.json();
  const state = json[0].data;

  const evalData = {
    status: 'selected',
    attempts: [
      {
        by: 'Arun Kumar R (Reviewer)',
        date: '2026-10-05',
        marks: { p1a: 10, p1b: 10, p2a: 10, p2b: 10, p3a: 25, p4a: 10, p9a: 10 },
        total: 85,
        scoreOutOf10: 8.5,
        outcome: 'selected',
        remarks: 'Cleared Round 1. Pitch deck and problem statement verified.'
      }
    ]
  };

  (state.applications || []).forEach(a => {
    if (a.phone === '9443533618' || a.phone === '9894090630' || a.applicationId === 'GRT-2026-27-178' || a.applicationId === 'GRT-2026-27-177') {
      a.stage = 'ced_evaluation';
      a.rounds = a.rounds || {};
      a.rounds.r1 = evalData;
    }
  });

  const saveRes = await fetch(`${supabaseUrl}/rest/v1/ivp_app_state`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify({ id: 1, data: state, updated_at: new Date().toISOString() })
  });

  if (saveRes.ok) {
    console.log('SUCCESS: All Sharan student accounts updated in Cloud DB with evaluation marks!');
  } else {
    console.error('Failed to save to Supabase Cloud:', await saveRes.text());
  }
}

syncSharanApps();
