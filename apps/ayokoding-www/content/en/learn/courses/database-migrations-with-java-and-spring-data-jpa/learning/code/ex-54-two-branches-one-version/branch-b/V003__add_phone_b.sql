-- Branch B V003: adds phone to the shared base table.
-- Same version as branch A, different bytes: the scan must refuse both.
ALTER TABLE ex54_base
ADD COLUMN phone VARCHAR(40);

-- => branch B needs phones, branch A needs emails: the collision is real
