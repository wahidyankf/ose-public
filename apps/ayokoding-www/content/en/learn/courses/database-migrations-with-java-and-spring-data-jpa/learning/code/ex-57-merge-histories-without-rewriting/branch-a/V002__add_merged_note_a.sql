-- Sibling A V002: adds note to the shared first table.
ALTER TABLE ex57_first
ADD COLUMN note_a VARCHAR(200);

-- => sibling-specific column: the merge keeps both siblings' rows
