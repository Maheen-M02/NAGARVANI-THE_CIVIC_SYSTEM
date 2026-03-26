-- Blockchain Audit Trail - Database Setup
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS audit_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id text NOT NULL,
  action text NOT NULL,
  data jsonb DEFAULT '{}',
  timestamp timestamptz DEFAULT now(),
  previous_hash text NOT NULL,
  hash text NOT NULL UNIQUE,
  block_index integer NOT NULL DEFAULT 0
);

-- Index for fast lookup by complaint
CREATE INDEX IF NOT EXISTS idx_audit_blocks_complaint ON audit_blocks(complaint_id);
CREATE INDEX IF NOT EXISTS idx_audit_blocks_timestamp ON audit_blocks(timestamp);

-- RLS: insert only, no update/delete
ALTER TABLE audit_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read audit blocks" ON audit_blocks;
DROP POLICY IF EXISTS "Authenticated can insert audit blocks" ON audit_blocks;

CREATE POLICY "Anyone can read audit blocks"
  ON audit_blocks FOR SELECT USING (true);

CREATE POLICY "Authenticated can insert audit blocks"
  ON audit_blocks FOR INSERT TO authenticated
  WITH CHECK (true);

-- NO UPDATE or DELETE policies = immutable

GRANT SELECT, INSERT ON audit_blocks TO authenticated;
GRANT SELECT ON audit_blocks TO anon;

SELECT 'audit_blocks table created successfully' as status;
