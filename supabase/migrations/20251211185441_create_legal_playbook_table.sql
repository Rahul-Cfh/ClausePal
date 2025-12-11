/*
  # Create Legal Playbook Table

  1. New Tables
    - `legal_playbook`
      - `id` (uuid, primary key)
      - `clause_title` (text) - Title of the clause
      - `ownership` (text) - Department/team that owns this clause
      - `standard_language` (text) - Standard language for the clause
      - `explanation` (text) - Explanation of the clause
      - `potential_edit_by_client` (text) - Potential edits clients may request
      - `unacceptable_position` (text) - Positions that cannot be accepted
      - `acceptable_level_of_deviation` (text) - What deviations are acceptable
      - `standard_response` (text) - Standard response to client requests
      - `approving_authority` (text) - Who can approve changes
      - `is_80_20` (text) - Whether this is an 80-20 clause
      - `created_at` (timestamptz) - When the record was created
      
  2. Security
    - Enable RLS on `legal_playbook` table
    - Add policy for authenticated users to read data
*/

CREATE TABLE IF NOT EXISTS legal_playbook (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clause_title text NOT NULL,
  ownership text,
  standard_language text,
  explanation text,
  potential_edit_by_client text,
  unacceptable_position text,
  acceptable_level_of_deviation text,
  standard_response text,
  approving_authority text,
  is_80_20 text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE legal_playbook ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read playbook"
  ON legal_playbook
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert playbook"
  ON legal_playbook
  FOR INSERT
  TO authenticated
  WITH CHECK (true);