-- Disputed V002 from branch B: collides with A, so neither runs.
ALTER TABLE ex60_base
ADD COLUMN phone VARCHAR(40);

-- => the collision partner: same version, different bytes, full stop
