-- 0004: derive every code. -- => the fill between ship and strictness
UPDATE batches -- => rewrite codeless rows
    SET code = 'batch-' || id WHERE code IS NULL; -- => guarded, like all good backfills
