/*
  Concurrency test script for random_select_queue RPC.
  Usage:
    SUPABASE_URL=https://... SUPABASE_ANON_KEY=your_anon_key node concurrency_test.js

  This script fires N parallel RPC calls to /rpc/random_select_queue using HTTP POST
  against the Supabase REST endpoint. It is intended as a developer convenience to
  simulate multiple staff pressing "random" simultaneously.

  NOTE: For production-like verification use service_role with caution and run on
  a non-production dataset or with proper permissions.
*/

const fetch = globalThis.fetch || require('node-fetch');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_ANON_KEY in env');
  process.exit(1);
}

const roundId = process.env.ROUND_ID; // set to a valid round id
const position = process.env.POSITION || 'support';
const CONCURRENT = parseInt(process.env.CONCURRENT || '6', 10);

async function callRandom() {
  const url = `${SUPABASE_URL}/rpc/random_select_queue`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ p_round_id: roundId, p_position: position })
  });
  const body = await res.json();
  return body;
}

async function main() {
  if (!roundId) {
    console.error('Set ROUND_ID env var to a valid round id');
    process.exit(1);
  }

  console.log(`Firing ${CONCURRENT} parallel random_select_queue calls for round ${roundId} position ${position}`);
  const promises = [];
  for (let i = 0; i < CONCURRENT; i++) promises.push(callRandom());

  const results = await Promise.all(promises);
  console.log('Results:');
  results.forEach((r, idx) => console.log(`#${idx + 1}:`, JSON.stringify(r)));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
