import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://bfrgzovowzrmnygoxnsn.supabase.co';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_MI1Jw2-YYczpRLiSvfs6TA_8h1B1FMy';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type TableRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          phone: string;
          created_at?: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          created_at?: string;
        };
      };
      library_logs: {
        Row: {
          id: string;
          name: string;
          phone: string;
          in_time: string;
          out_time: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          in_time?: string;
          out_time?: string | null;
        };
      };
      books: {
        Row: {
          id: number;
          stocknumber: string | null;
          callnumber: string | null;
          title: string;
          author: string | null;
          language: string | null;
          category: string | null;
          price: string | null;
          publisher: string | null;
          shelfnumber: string | null;
        };
      };
    };
  };
}
