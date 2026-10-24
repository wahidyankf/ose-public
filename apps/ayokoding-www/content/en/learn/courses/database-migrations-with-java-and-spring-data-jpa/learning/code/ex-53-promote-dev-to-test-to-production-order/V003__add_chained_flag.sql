-- V003 adds the flag only production-ready after two prior promotions.
ALTER TABLE chained_things
ADD COLUMN ready BOOLEAN NOT NULL DEFAULT false;

-- => DEFAULT keeps every promoted replay valid on any row count
