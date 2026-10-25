-- Disputed V002 from branch A: never runs because B claims it too.
ALTER TABLE ex60_base
ADD COLUMN email VARCHAR(200);

-- => the DDL that stays unexecuted while versions collide
