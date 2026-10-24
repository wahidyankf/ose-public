-- V001 adds a nullable nickname: safe to deploy beside running code.
-- Nullable and unenforced, this column changes nothing for old binaries.
CREATE TABLE ex34_players (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for players
  handle VARCHAR(100) NOT NULL,
  -- => the existing handle the nickname derives from
  nickname VARCHAR(100)
  -- => nullable and unenforced: the safe first release
);

-- => two players give the later backfill real rows to derive from
INSERT INTO
  ex34_players (handle)
VALUES
  ('striker9'),
  ('keeper1');

-- => seeds share the migration transaction with the create above
