-- 0004: distinct values become rows. -- => truthful by construction
INSERT INTO kinds (kind) -- => exactly the values in use
    SELECT DISTINCT kind FROM parcels; -- => duplicates collapse here
