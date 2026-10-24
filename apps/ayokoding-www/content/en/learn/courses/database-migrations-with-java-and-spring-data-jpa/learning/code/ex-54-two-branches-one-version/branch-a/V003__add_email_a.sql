-- Branch A V003: adds email to the shared base table.
-- Same version as branch B, different bytes: the collision this scans for.
ALTER TABLE ex54_base
ADD COLUMN email VARCHAR(200);

-- => branch A needs emails, branch B needs phones: one version, two intents
