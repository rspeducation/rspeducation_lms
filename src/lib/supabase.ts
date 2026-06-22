// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase configuration
 * - Reads from Vite env first, then falls back to hardcoded project values.
 * - Keep these values in .env for local dev and in host env for deploy.
 */

// Hardcoded fallbacks (from project setup)
const FALLBACK_URL = 'https://kaewhoozzlvtxeafxzcj.supabase.co';
const FALLBACK_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthZXdob296emx2dHhlYWZ4emNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NzM1OTgsImV4cCI6MjA3MTE0OTU5OH0.Wj94m10ou2pIu97KvGTfuA6NhbfYOxK22KBtgjVRXF0';

// Prefer env vars (Vite) if present
const SUPABASE_URL = (import.meta as any)?.env?.VITE_SUPABASE_URL || FALLBACK_URL;
const SUPABASE_ANON_KEY = (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY;

// Guard against misconfiguration
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

/**
 * Clients
 * - supabase: standard client with session persistence (required for RLS reads after refresh)
 * - supabaseNoSession: non-persistent client (useful for admin flows that should not touch the current session)
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const supabaseNoSession = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

export default supabase;

/**
 * Table name constants (match the project’s actual table names)
 * Note: these keys reflect the schema created by the project’s SQL/setup guides.
 */
export const TABLES = {
  USERS: 'users',
  STUDENTS: 'students',
  COURSES: 'courses',
  BATCHES: 'batches',
  COURSECONTENT: 'coursecontent',      // project uses 'coursecontent'
  INTERVIEWS: 'interviews',
  PLACEMENTS: 'placements',
  USERQUERIES: 'userqueries',
  RESUMETEMPLATES: 'resumetemplates',
} as const;

/**
 * Minimal Database type (extend as needed).
 * Columns are defined to the extent referenced around the app and setup docs.
 * If your live schema differs, adjust here to keep types accurate.
 */
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          name: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Insert: {
          id?: string;
          email?: string | null;
          name?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['users']['Row']>;
      };

      students: {
        Row: {
          id: string;
          user_id?: string | null;
          userid?: string | null;
          course: string | null;
          batch: string | null;
          status: 'active' | 'inactive';
          enrollment_date?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          name?: string | null;
          email?: string | null;
          phone?: string | null;
        };
        Insert: Partial<Database['public']['Tables']['students']['Row']> & {
          status?: 'active' | 'inactive';
        };
        Update: Partial<Database['public']['Tables']['students']['Row']>;
      };

      courses: {
        Row: {
          id: string;
          name: string;
          description?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          status?: 'active' | 'inactive';
          duration?: string | null;
          price?: number | null;
        };
        Insert: Partial<Database['public']['Tables']['courses']['Row']> & { name: string };
        Update: Partial<Database['public']['Tables']['courses']['Row']>;
      };

      batches: {
        Row: {
          id: string;
          name: string;
          start_date?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          status?: 'active' | 'inactive';
        };
        Insert: { id?: string; name: string; start_date?: string | null; status?: 'active' | 'inactive' };
        Update: Partial<Database['public']['Tables']['batches']['Row']>;
      };

      coursecontent: {
        Row: {
          id: string;
          batchid: string;
          title?: string | null;
          description?: string | null;
          url?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Insert: Partial<Database['public']['Tables']['coursecontent']['Row']> & { batchid: string };
        Update: Partial<Database['public']['Tables']['coursecontent']['Row']>;
      };

      // NOTE: this is a legacy typing. The new SQL for interviews (with user_id, date/time fields)
      // is enforced by the DB and RLS; use untyped queries or extend this type to match the new schema if desired.
      interviews: {
        Row: {
          id: string;
          student_id: string;
          status?: string | null;
          scheduled_at?: string | null;
          feedback?: string | null;
          score?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Insert: Partial<Database['public']['Tables']['interviews']['Row']> & { student_id: string };
        Update: Partial<Database['public']['Tables']['interviews']['Row']>;
      };

      placements: {
        Row: {
          id: string;
          student_id: string;
          company?: string | null;
          position?: string | null;
          salary?: number | null;
          placement_date?: string | null;
          status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Insert: Partial<Database['public']['Tables']['placements']['Row']> & { student_id: string };
        Update: Partial<Database['public']['Tables']['placements']['Row']>;
      };

      userqueries: {
        Row: {
          id: string;
          name?: string | null;
          email?: string | null;
          subject?: string | null;
          message?: string | null;
          status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Insert: Partial<Database['public']['Tables']['userqueries']['Row']>;
        Update: Partial<Database['public']['Tables']['userqueries']['Row']>;
      };

      resumetemplates: {
        Row: {
          id: string;
          name: string;
          url: string;
          isactive?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Insert: Partial<Database['public']['Tables']['resumetemplates']['Row']> & {
          name: string; url: string;
        };
        Update: Partial<Database['public']['Tables']['resumetemplates']['Row']>;
      };
    };
  };
}
