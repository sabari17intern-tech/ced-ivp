import fs from 'fs';

let url = '';
let key = '';

if (fs.existsSync('.env')) {
  const envFile = fs.readFileSync('.env', 'utf8');
  envFile.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || !trimmed.includes('=')) return;
    const parts = trimmed.split('=');
    const k = parts[0].trim();
    const v = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    if (k === 'VITE_SUPABASE_URL') url = v;
    if (k === 'VITE_SUPABASE_ANON_KEY') key = v;
  });
}

console.log('Testing Supabase Cloud URL:', url);
console.log('Using API Key:', key ? key.slice(0, 15) + '...' : 'NONE');

if (!url || !key) {
  console.error('Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not found in .env');
  process.exit(1);
}

async function checkRLS() {
  const tables = [
    'ivp_app_state',
    'ivp_applications',
    'ivp_members',
    'ivp_users',
    'ivp_notifications',
    'ivp_teams',
    'ivp_reviewers',
    'ivp_messages',
    'ivp_reviewer_slots'
  ];

  console.log('\n--- 1. Testing SELECT (Read Access / RLS) across Tables ---');
  for (const t of tables) {
    try {
      const res = await fetch(`${url}/rest/v1/${t}?select=*&limit=1`, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Prefer': 'count=exact'
        }
      });
      const range = res.headers.get('content-range');
      if (res.ok) {
        console.log(`  ✅ Table ${t}: HTTP ${res.status} OK (Count: ${range || 'accessible'})`);
      } else {
        const err = await res.text();
        console.log(`  ❌ Table ${t}: HTTP ${res.status} -> ${err}`);
      }
    } catch (e) {
      console.log(`  ❌ Table ${t} network error: ${e.message}`);
    }
  }

  console.log('\n--- 2. Testing ivp_app_state (Primary Application Store) RLS ---');
  
  // 2.1 Check read
  const readRes = await fetch(`${url}/rest/v1/ivp_app_state?id=eq.1&select=id,updated_at`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  if (readRes.ok) {
    const data = await readRes.json();
    console.log('  ✅ SELECT ivp_app_state row 1: SUCCESS ->', data);
  } else {
    console.log('  ❌ SELECT ivp_app_state failed:', await readRes.text());
  }

  // 2.2 Check update permission (RLS UPDATE policy)
  const testTimestamp = new Date().toISOString();
  const updateRes = await fetch(`${url}/rest/v1/ivp_app_state?id=eq.1`, {
    method: 'PATCH',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ updated_at: testTimestamp })
  });
  if (updateRes.ok) {
    const updated = await updateRes.json();
    console.log('  ✅ UPDATE (PATCH) ivp_app_state: SUCCESS (RLS allows update) ->', updated);
  } else {
    console.log('  ❌ UPDATE ivp_app_state failed (RLS blocked or error):', await updateRes.text());
  }

  // 2.3 Check upsert permission (RLS INSERT ON CONFLICT policy)
  const upsertRes = await fetch(`${url}/rest/v1/ivp_app_state`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify({ id: 1, updated_at: testTimestamp })
  });
  if (upsertRes.ok) {
    const upserted = await upsertRes.json();
    console.log('  ✅ UPSERT (POST merge) ivp_app_state: SUCCESS (RLS allows insert/upsert) ->', upserted);
  } else {
    console.log('  ❌ UPSERT ivp_app_state failed (RLS blocked or error):', await upsertRes.text());
  }

  console.log('\n--- 3. Testing Schema & RLS Policies Introspection ---');
  // Try querying rpc or schema if available
  const rpcRes = await fetch(`${url}/rest/v1/`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  if (rpcRes.ok) {
    const spec = await rpcRes.json();
    const availableEndpoints = Object.keys(spec.paths || {});
    console.log('  ✅ OpenAPI schema accessible. Total available table/view endpoints:', availableEndpoints.length);
    console.log('  Endpoints sample:', availableEndpoints.slice(0, 10));
  } else {
    console.log('  ℹ️ OpenAPI spec status:', rpcRes.status);
  }
}

checkRLS().catch(console.error);
