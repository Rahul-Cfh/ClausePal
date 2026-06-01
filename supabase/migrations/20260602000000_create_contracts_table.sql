CREATE TABLE IF NOT EXISTS saved_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_name text NOT NULL,
  contract_type text,
  country text,
  analysis_result jsonb,
  deal_score integer,
  verdict text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE saved_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own contracts"
  ON saved_contracts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contracts"
  ON saved_contracts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own contracts"
  ON saved_contracts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_saved_contracts_user_id ON saved_contracts(user_id);
CREATE INDEX idx_saved_contracts_created_at ON saved_contracts(created_at DESC);
