-- Branch A V003: adds region to the shared store table.
ALTER TABLE ex56_store
ADD COLUMN region VARCHAR(60);

-- => branch A needs regions first
