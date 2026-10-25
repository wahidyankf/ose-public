-- V002 adds the flag every promoted environment must carry.
-- Same file, same order, fresh schema: promotion proves reproducibility.
ALTER TABLE promoted_things
ADD COLUMN active BOOLEAN NOT NULL DEFAULT true;

-- => DEFAULT keeps the promotion replay valid on empty and filled tables
