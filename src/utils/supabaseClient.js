import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hkztadtryzaoyadrhepa.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrenRhZHRyeXphb3lhZHJoZXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyNTM5MDcsImV4cCI6MjA5ODgyOTkwN30.bX8N4ohaO8iQxJ8o_GMcONQZylu42m96wsmPt5ItXbg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
