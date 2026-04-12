-- Team model: users, teams, and membership
CREATE TABLE IF NOT EXISTS app_user (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL UNIQUE,
  display_name text NOT NULL,
  password_hash text NOT NULL,
  avatar_url  text,
  role        text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  owner_id    uuid NOT NULL REFERENCES app_user(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_member (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     uuid NOT NULL REFERENCES team(id),
  user_id     uuid NOT NULL REFERENCES app_user(id),
  role        text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by  uuid REFERENCES app_user(id),
  joined_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_member_team ON team_member(team_id);
CREATE INDEX IF NOT EXISTS idx_team_member_user ON team_member(user_id);

-- Link studies to teams
ALTER TABLE study ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES app_user(id);
ALTER TABLE study ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES team(id);
