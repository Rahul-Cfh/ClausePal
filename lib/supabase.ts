import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface PlaybookClause {
  id: string;
  clause_title: string;
  ownership: string | null;
  standard_language: string | null;
  explanation: string | null;
  potential_edit_by_client: string | null;
  unacceptable_position: string | null;
  acceptable_level_of_deviation: string | null;
  standard_response: string | null;
  approving_authority: string | null;
  is_80_20: string | null;
  created_at: string;
}

export async function fetchPlaybookClauses(): Promise<PlaybookClause[]> {
  const { data, error } = await supabase
    .from('legal_playbook')
    .select('*')
    .order('clause_title', { ascending: true });

  if (error) {
    console.error('Error fetching playbook clauses:', error);
    throw error;
  }

  return data || [];
}
