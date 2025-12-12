/*
  # Create Legal Playbook Table

  1. New Tables
    - `legal_playbook`
      - `id` (uuid, primary key) - Unique identifier for each playbook entry
      - `clause_title` (text) - The title of the clause
      - `ownership` (text) - The department/team that owns this clause
      - `standard_language` (text) - The standard contractual language for this clause
      - `explanation` (text) - Detailed explanation of the clause
      - `potential_edit_by_client` (text) - Common edits clients may request
      - `unacceptable_position` (text) - Positions that cannot be accepted
      - `acceptable_level_of_deviation` (text) - What deviations can be accepted
      - `standard_response` (text) - Standard response to client requests
      - `approving_authority` (text) - Who can approve changes to this clause
      - `is_80_20` (text) - Whether this is an 80-20 clause
      - `created_at` (timestamptz) - When the record was created
      - `updated_at` (timestamptz) - When the record was last updated

  2. Security
    - Enable RLS on `legal_playbook` table
    - Add policy for authenticated users to read playbook data
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
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE legal_playbook ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read playbook"
  ON legal_playbook
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert playbook"
  ON legal_playbook
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
