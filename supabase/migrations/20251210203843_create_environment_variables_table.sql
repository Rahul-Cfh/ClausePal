/*
  # Create Environment Variables Table

  1. New Tables
    - `environment_variables`
      - `id` (uuid, primary key) - Unique identifier for each variable
      - `key` (text, unique) - The environment variable name (e.g., "OPENAI_API_KEY")
      - `value` (text) - The secret value to store
      - `description` (text, optional) - Description of what this variable is used for
      - `created_at` (timestamptz) - When the variable was created
      - `updated_at` (timestamptz) - When the variable was last updated

  2. Security
    - Enable RLS on `environment_variables` table
    - Add policy for service role only (server-side access only)
    - This ensures secrets are only accessible from server-side code, not client-side

  3. Important Notes
    - This table is designed to store application secrets securely
    - Only server-side code with service role key can access these values
    - Client-side code cannot read these secrets
*/

CREATE TABLE IF NOT EXISTS environment_variables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE environment_variables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage all environment variables"
  ON environment_variables
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_environment_variables_key ON environment_variables(key);
