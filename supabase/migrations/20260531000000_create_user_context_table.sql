CREATE TABLE IF NOT EXISTS user_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  role text,
  company_name text,
  industry text,
  main_concern text,
  jurisdiction text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon to insert user_context"
  ON user_context FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon to select user_context"
  ON user_context FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon to update user_context"
  ON user_context FOR UPDATE TO anon USING (true);
