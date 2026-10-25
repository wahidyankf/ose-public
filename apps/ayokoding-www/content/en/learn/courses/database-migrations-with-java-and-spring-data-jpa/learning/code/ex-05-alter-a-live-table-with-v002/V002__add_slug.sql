-- V002 adds a slug column to the live teams table.
-- DEFAULT fills the existing keeper row at alter time: nothing is lost.
-- New rows after the migration get the default unless they say otherwise.
ALTER TABLE ex05_teams
ADD COLUMN slug VARCHAR(100) NOT NULL DEFAULT 'team';

-- => NOT NULL plus DEFAULT keeps old and new rows valid together
