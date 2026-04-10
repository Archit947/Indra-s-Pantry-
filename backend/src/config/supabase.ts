import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Service-role client — bypasses Row Level Security for all backend operations
export const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
