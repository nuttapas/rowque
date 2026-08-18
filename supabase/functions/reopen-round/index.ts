import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || Deno.env.get('NEXT_PUBLIC_SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

export default async function (req: Request) {
  try {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    const body = await req.json();
    const { round_id, reason } = body;
    if (!round_id) return new Response(JSON.stringify({ success: false, code: 'BAD_REQUEST', message: 'round_id required' }), { status: 400 });

    const { data, error } = await supabase.rpc('reopen_round', {
      p_round_id: round_id,
      p_reason: reason || null
    });

    if (error) return new Response(JSON.stringify({ success: false, code: 'RPC_ERROR', message: error.message }), { status: 500 });

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, code: 'INTERNAL_ERROR', message: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
