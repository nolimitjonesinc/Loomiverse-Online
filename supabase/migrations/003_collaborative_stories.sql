-- Collaborative Stories Tables for Loomiverse
-- Run this in Supabase SQL Editor

-- 1. Collaborative Sessions Table
CREATE TABLE IF NOT EXISTS loom_collab_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_code VARCHAR(6) UNIQUE NOT NULL,
  host_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Collaborative Story',
  genre TEXT,
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'paused', 'completed')),
  settings JSONB DEFAULT '{"maxParticipants": 4, "turnTimeLimit": null, "allowSpectators": false, "autoAdvanceTurn": true}'::jsonb,
  bible JSONB,
  generated_chapters JSONB[] DEFAULT ARRAY[]::JSONB[],
  current_turn_index INTEGER DEFAULT 0,
  turn_order UUID[] DEFAULT ARRAY[]::UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Collaborative Participants Table
CREATE TABLE IF NOT EXISTS loom_collab_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES loom_collab_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'contributor' CHECK (role IN ('host', 'contributor', 'spectator')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'left', 'kicked')),
  contributions_count INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

-- 3. Collaborative Contributions Table
CREATE TABLE IF NOT EXISTS loom_collab_contributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES loom_collab_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  chapter_number INTEGER NOT NULL,
  content_type VARCHAR(20) DEFAULT 'chapter' CHECK (content_type IN ('chapter', 'choice', 'outline', 'edit')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_collab_sessions_code ON loom_collab_sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_collab_sessions_host ON loom_collab_sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_collab_sessions_status ON loom_collab_sessions(status);
CREATE INDEX IF NOT EXISTS idx_collab_participants_session ON loom_collab_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_collab_participants_user ON loom_collab_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_collab_contributions_session ON loom_collab_contributions(session_id);

-- Enable RLS
ALTER TABLE loom_collab_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loom_collab_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE loom_collab_contributions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Sessions
-- Anyone can view sessions (to join by code)
CREATE POLICY "Sessions are viewable by all authenticated users" ON loom_collab_sessions
  FOR SELECT TO authenticated
  USING (true);

-- Only host can insert new session (handled by app logic, but enforce host_id match)
CREATE POLICY "Users can create sessions" ON loom_collab_sessions
  FOR INSERT TO authenticated
  WITH CHECK (host_id = auth.uid());

-- Only host can update session
CREATE POLICY "Hosts can update their sessions" ON loom_collab_sessions
  FOR UPDATE TO authenticated
  USING (host_id = auth.uid());

-- Only host can delete session
CREATE POLICY "Hosts can delete their sessions" ON loom_collab_sessions
  FOR DELETE TO authenticated
  USING (host_id = auth.uid());

-- RLS Policies for Participants
-- Anyone in session can view participants
CREATE POLICY "Participants are viewable by session members" ON loom_collab_participants
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM loom_collab_participants p
      WHERE p.session_id = loom_collab_participants.session_id
      AND p.user_id = auth.uid()
    )
  );

-- Users can insert themselves as participant
CREATE POLICY "Users can join sessions" ON loom_collab_participants
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own participant record
CREATE POLICY "Users can update their participation" ON loom_collab_participants
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for Contributions
-- Anyone in session can view contributions
CREATE POLICY "Contributions are viewable by session members" ON loom_collab_contributions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM loom_collab_participants p
      WHERE p.session_id = loom_collab_contributions.session_id
      AND p.user_id = auth.uid()
    )
  );

-- Users can insert their own contributions
CREATE POLICY "Users can add contributions" ON loom_collab_contributions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Enable Realtime for all collab tables
ALTER PUBLICATION supabase_realtime ADD TABLE loom_collab_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE loom_collab_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE loom_collab_contributions;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_collab_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_collab_session_timestamp ON loom_collab_sessions;
CREATE TRIGGER update_collab_session_timestamp
  BEFORE UPDATE ON loom_collab_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_collab_session_timestamp();
