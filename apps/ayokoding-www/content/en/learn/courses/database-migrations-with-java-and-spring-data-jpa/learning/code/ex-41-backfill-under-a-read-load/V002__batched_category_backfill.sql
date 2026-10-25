-- V002 backfills categories in batches of fifty by key range.
-- Small batches hold row locks briefly, readers pass between batches.
UPDATE ex41_metrics
SET
  category = 'standard'
WHERE
  id BETWEEN 1 AND 50;

-- => batch one claims its disjoint key range with short row locks
UPDATE ex41_metrics
SET
  category = 'standard'
WHERE
  id BETWEEN 51 AND 100;

-- => batch two follows without ever locking the whole table
UPDATE ex41_metrics
SET
  category = 'standard'
WHERE
  id BETWEEN 101 AND 150;

-- => batch three keeps the same small-lock discipline
UPDATE ex41_metrics
SET
  category = 'standard'
WHERE
  id BETWEEN 151 AND 200;

-- => batch four finishes the table: every row categorized exactly once
