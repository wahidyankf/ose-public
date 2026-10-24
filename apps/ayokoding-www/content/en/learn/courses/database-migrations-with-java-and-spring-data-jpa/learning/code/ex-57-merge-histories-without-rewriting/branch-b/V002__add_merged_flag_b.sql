-- Sibling B V002: adds flag to the shared first table.
-- Same version, sibling-specific change: the merge reports the fork.
ALTER TABLE ex57_first
ADD COLUMN flag_b BOOLEAN NOT NULL DEFAULT false;

-- => DEFAULT keeps the merged replay valid on any existing rows
