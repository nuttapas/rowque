import { supabase } from '@/utils/supabase';
import type { Round, RoundWithStats, QueueStats } from '@/types';

export async function getRounds(filters?: {
  status?: Round['status'];
  event_date?: string;
  accepting_entries?: boolean;
}) {
  let query = supabase
    .from('rounds')
    .select('*')
    .order('event_date', { ascending: false })
    .order('round_number', { ascending: false });
  
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters?.event_date) {
    query = query.eq('event_date', filters.event_date);
  }
  
  if (filters?.accepting_entries !== undefined) {
    query = query.eq('accepting_entries', filters.accepting_entries);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data as Round[];
}

export async function getRoundWithStats(roundId: string): Promise<RoundWithStats | null> {
  const { data: round } = await supabase
    .from('rounds')
    .select('*')
    .eq('id', roundId)
    .single();
  
  if (!round) return null;
  
  // Get stats for both positions
  const { data: entries } = await supabase
    .from('queue_entries')
    .select('position, status')
    .eq('round_id', roundId) as any;
  
  const stats: any = {
    support: {
      total: 0,
      waiting: 0,
      selected: 0,
      called: 0,
      serving: 0,
      completed: 0,
      no_show: 0,
      cancelled: 0
    },
    general: {
      total: 0,
      waiting: 0,
      selected: 0,
      called: 0,
      serving: 0,
      completed: 0,
      no_show: 0,
      cancelled: 0
    }
  };
  
  if (entries) {
    for (const entry of entries as any[]) {
      const pos = entry.position as 'support' | 'general';
      const status = entry.status as keyof QueueStats;
      stats[pos].total++;
      stats[pos][status]++;
    }
  }

  const roundObj = round as any;
  return { ...roundObj, stats } as RoundWithStats;
}

export async function createRound(eventDate: string) {
  const { data, error } = await (supabase as any)
    .from('rounds')
    .insert([
      {
        event_date: eventDate,
        status: 'open',
        accepting_entries: true
      }
    ] as any)
    .select()
    .single();

  if (error) throw error;
  return data as Round;
}

export async function updateRound(roundId: string, updates: Partial<Round>) {
  const { data, error } = await (supabase as any)
    .from('rounds')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    } as any)
    .eq('id', roundId)
    .select()
    .single();
  
  if (error) throw error;
  return data as Round;
}

export async function openRound(roundId: string) {
  const { data, error } = await supabase.rpc('reopen_round', {
    p_round_id: roundId,
    p_reason: 'เปิดรอบใหม่'
  } as any);
  
  if (error) throw error;
  return data;
}

export async function closeRoundAccepting(roundId: string) {
  const { data, error } = await (supabase as any)
    .from('rounds')
    .update({
      accepting_entries: false,
      updated_at: new Date().toISOString()
    } as any)
    .eq('id', roundId)
    .select()
    .single();
  
  if (error) throw error;
  return data as Round;
}

export async function reopenRound(roundId: string, reason?: string) {
  const { data, error } = await supabase.rpc('reopen_round', {
    p_round_id: roundId,
    p_reason: reason
  } as any);
  
  if (error) throw error;
  return data;
}

export async function completeRound(roundId: string) {
  const { data, error } = await (supabase as any)
    .from('rounds')
    .update({
      status: 'completed',
      accepting_entries: false,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as any)
    .eq('id', roundId)
    .select()
    .single();
  
  if (error) throw error;
  return data as Round;
}

export async function cancelRound(roundId: string) {
  const { data, error } = await (supabase as any)
    .from('rounds')
    .update({
      status: 'cancelled',
      accepting_entries: false,
      updated_at: new Date().toISOString()
    } as any)
    .eq('id', roundId)
    .select()
    .single();
  
  if (error) throw error;
  return data as Round;
}

export async function subscribeToRounds(callback: (round: Round) => void) {
  return supabase
    .channel('rounds')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'rounds'
      },
      (payload) => {
        if (payload.new) {
          callback(payload.new as Round);
        }
      }
    )
    .subscribe();
}