-- Branch B V003: adds aisle to the shared store table.
-- Same number, different change: branch B will renumber to V004.
ALTER TABLE ex56_store
ADD COLUMN aisle VARCHAR(20);

-- => branch B needs aisles, renumbering keeps both changes
