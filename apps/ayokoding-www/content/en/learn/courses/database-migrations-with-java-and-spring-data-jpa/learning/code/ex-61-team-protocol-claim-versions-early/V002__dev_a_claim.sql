-- V002 claimed by developer A before either file was written.
-- Early claims turn collisions into conversations before code exists.
ALTER TABLE ex61_claims
ADD COLUMN email VARCHAR(200);

-- => developer A's claimed change lands under its reserved number
