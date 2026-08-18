import { supabase } from '@/utils/supabase';
import type { QueueEntry, QueuePosition, ApiResponse } from '@/types';

export async function registerQueue(
  roundId: string,
  playerName: string,
  contact: string,
  position: QueuePosition
) {
  const { data, error } = await supabase.rpc('register_queue_entry', {
    p_round_id: roundId,
    p_player_name: playerName,
    p_contact: contact,
    p_position: position
  });
  
  if (error) throw error;
  return { id: data } as { id: string };
}

export async function randomSelectQueue(
  roundId: string,
  position: QueuePosition
): Promise<ApiResponse<QueueEntry>> {
  const { data, error } = await supabase.rpc('random_select_queue', {
    p_round_id: roundId,
    p_position: position
  });
  
  if (error) throw error;
  return data as ApiResponse<QueueEntry>;
}

export async function confirmRandomQueue(entryId: string): Promise<ApiResponse> {
  const { data, error } = await supabase.rpc('confirm_random_queue', {
    p_entry_id: entryId
  });
  
  if (error) throw error;
  return data as ApiResponse;
}

export async function rejectRandomQueue(entryId: string): Promise<ApiResponse> {
  const { data, error } = await supabase.rpc('reject_random_queue', {
    p_entry_id: entryId
  });
  
  if (error) throw error;
  return data as ApiResponse;
}

export async function manualCallQueue(entryId: string): Promise<ApiResponse> {
  const { data, error } = await supabase.rpc('manual_call_queue', {
    p_entry_id: entryId
  });
  
  if (error) throw error;
  return data as ApiResponse;
}

export async function completeQueue(entryId: string): Promise<ApiResponse> {
  const { data, error } = await supabase.rpc('complete_queue', {
    p_entry_id: entryId
  });
  
  if (error) throw error;
  return data as ApiResponse;
}

export async function markNoShow(entryId: string): Promise<ApiResponse> {
  const { data, error } = await supabase.rpc('mark_no_show', {
    p_entry_id: entryId
  });
  
  if (error) throw error;
  return data as ApiResponse;
}

export async function cancelQueue(entryId: string): Promise<ApiResponse> {
  const { data, error } = await supabase.rpc('cancel_queue', {
    p_entry_id: entryId
  });
  
  if (error) throw error;
  return data as ApiResponse;
}

export async function getQueueEntries(roundId: string, filters?: {
  position?: QueuePosition;
  status?: QueueEntry['status'];
  search?: string;
}) {
  let query = supabase
    .from('queue_entries')
    .select('*')
    .eq('round_id', roundId)
    .order('created_at', { ascending: true });
  
  if (filters?.position) {
    query = query.eq('position', filters.position);
  }
  
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  
  let entries = data as QueueEntry[];
  
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    entries = entries.filter(entry =>
      entry.queue_number.toLowerCase().includes(searchLower) ||
      entry.player_name.toLowerCase().includes(searchLower) ||
      entry.contact.toLowerCase().includes(searchLower)
    );
  }
  
  return entries;
}

export async function getQueueEntry(entryId: string): Promise<QueueEntry | null> {
  const { data, error } = await supabase
    .from('queue_entries')
    .select('*')
    .eq('id', entryId)
    .single();
  
  if (error) return null;
  return data as QueueEntry;
}

export async function getQueueByNumber(queueNumber: string): Promise<QueueEntry | null> {
  const { data, error } = await supabase
    .from('queue_entries')
    .select('*, rounds!inner(event_date, round_number)')
    .eq('queue_number', queueNumber)
    .single();
  
  if (error) return null;
  return data as QueueEntry;
}

export async function getQueueByContact(contact: string, roundId?: string): Promise<QueueEntry[]> {
  let query = supabase
    .from('queue_entries')
    .select('*, rounds!inner(event_date, round_number)')
    .eq('contact', contact)
    .order('created_at', { ascending: false });
  
  if (roundId) {
    query = query.eq('round_id', roundId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data as QueueEntry[];
}

export async function updateQueueNotes(entryId: string, notes: string) {
  const { data, error } = await supabase
    .from('queue_entries')
    .update({ notes, updated_at: new Date().toISOString() })
    .eq('id', entryId)
    .select()
    .single();
  
  if (error) throw error;
  return data as QueueEntry;
}

export async function subscribeToQueueEntries(roundId: string, callback: (entry: QueueEntry) => void) {
  return supabase
    .channel(`queue_entries:${roundId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'queue_entries',
        filter: `round_id=eq.${roundId}`
      },
      (payload) => {
        if (payload.new) {
          callback(payload.new as QueueEntry);
        }
      }
    )
    .subscribe();
}