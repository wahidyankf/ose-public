-- V002 adds the note column certified in test before production.
ALTER TABLE chained_things
ADD COLUMN note VARCHAR(200);

-- => nullable: certification stages prove behavior before enforcement
