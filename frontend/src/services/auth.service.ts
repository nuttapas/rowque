import { supabase } from '@/utils/supabase';
import type { Profile, UserRole } from '@/types';
import type { Database } from '@/utils/database.types';
import type { User, Session } from '@supabase/auth-js';

export async function getCurrentUser(): Promise<{ user: User | null; profile: Profile | null } | null> {
  const res = await supabase.auth.getUser();
  const user = res.data?.user ?? null;
  
  if (!user) return null;
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  return { user, profile: profile as Profile | null };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string, displayName: string, role: UserRole = 'player') {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password
  });
  
  if (authError) throw authError;
  
  if (authData.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert<Database['public']['Tables']['profiles']['Insert']>([{
        id: authData.user.id,
        display_name: displayName,
        role
      }]);

    if (profileError) throw profileError;
  }
  
  return authData;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function updateUserRole(userId: string, role: UserRole) {
  const { error } = await supabase
    .from('profiles')
    .update<Database['public']['Tables']['profiles']['Update']>({ role })
    .eq('id', userId);
  
  if (error) throw error;
}

export async function onAuthStateChange(callback: (event: string, session: Session | null) => void) {
  return supabase.auth.onAuthStateChange(callback);
}