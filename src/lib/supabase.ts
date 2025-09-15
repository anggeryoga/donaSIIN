import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ebuacyrslucrmndrerqh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVidWFjeXJzbHVjcm1uZHJlcnFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0ODg3MzgsImV4cCI6MjA3MzA2NDczOH0.mM5g8ovHw_2QdA8JOFSK7j4et0TjKaoIurq7AHvRxgo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);