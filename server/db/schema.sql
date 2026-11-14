CREATE TABLE IF NOT EXISTS group_info (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  concept TEXT,
  highlights TEXT[] DEFAULT '{}',
  shared_projects JSONB DEFAULT '[]',
  contact JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS members (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  projects JSONB DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, id);
