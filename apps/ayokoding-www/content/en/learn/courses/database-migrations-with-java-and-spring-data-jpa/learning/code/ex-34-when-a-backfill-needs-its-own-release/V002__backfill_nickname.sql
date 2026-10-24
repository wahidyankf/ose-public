-- V002 backfills nicknames as its own promotion after the schema release.
-- Running separately from the deploy keeps long writes out of the release.
UPDATE ex34_players
SET
  nickname = handle;

-- => every existing row derives its nickname from its handle
