import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// These are safe to expose in frontend code - RLS policies protect the data
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ftcdqmrjjooluihysuyc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0Y2RxbXJqam9vbHVpaHlzdXljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0MTUyMTUsImV4cCI6MjA2MTk5MTIxNX0.i-Kyfaty47RL-0z8CCAscsUvabGCfStVKaxNaRKAPbw';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to check if user is authenticated
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Helper to check connection
export const checkConnection = async () => {
  try {
    const { error } = await supabase.from('loom_stories').select('count', { count: 'exact', head: true });
    // If table doesn't exist yet, that's okay - we'll create it
    if (error && !error.message.includes('does not exist')) {
      console.error('[Supabase] Connection error:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[Supabase] Connection failed:', e);
    return false;
  }
};

export default supabase;
