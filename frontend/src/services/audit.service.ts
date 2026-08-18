import { supabase } from '@/utils/supabase';
import type { AuditLog, AuditAction } from '@/types';

export async function getAuditLogs(filters?: {
  action?: AuditAction;
  entity_type?: string;
  entity_id?: string;
  actor_id?: string;
  limit?: number;
}) {
  let query = supabase
    .from('audit_logs')
    .select('*, profiles:actor_id(display_name, role)')
    .order('created_at', { ascending: false });
  
  if (filters?.action) {
    query = query.eq('action', filters.action);
  }
  
  if (filters?.entity_type) {
    query = query.eq('entity_type', filters.entity_type);
  }
  
  if (filters?.entity_id) {
    query = query.eq('entity_id', filters.entity_id);
  }
  
  if (filters?.actor_id) {
    query = query.eq('actor_id', filters.actor_id);
  }
  
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data as AuditLog[];
}

export async function getAuditLogsByRound(roundId: string, limit: number = 100) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*, profiles:actor_id(display_name, role)')
    .or(`entity_id.eq.${roundId},metadata->>round_id.eq.${roundId}`)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data as AuditLog[];
}