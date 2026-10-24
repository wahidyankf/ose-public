-- V002 applies the winner: emails keep their claimed number.
ALTER TABLE kata04_base
ADD COLUMN email VARCHAR(200);

-- => the agreed V002: applied first, never moved again
