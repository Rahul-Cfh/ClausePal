CREATE TABLE IF NOT EXISTS knowledge_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('playbook', 'past_contract', 'template', 'policy')),
  raw_text text,
  summary jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own knowledge documents"
  ON knowledge_documents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own knowledge documents"
  ON knowledge_documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own knowledge documents"
  ON knowledge_documents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_knowledge_documents_user_id ON knowledge_documents(user_id);
CREATE INDEX idx_knowledge_documents_created_at ON knowledge_documents(created_at DESC);
CREATE INDEX idx_knowledge_documents_type ON knowledge_documents(document_type);
