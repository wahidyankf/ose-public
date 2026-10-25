-- V002 backfills categories in ten batches of one hundred by key range.
-- Small statements keep locks short, one transaction keeps them atomic.
-- Each UPDATE names a disjoint key range so batches never overlap.
UPDATE ex29_events
SET
  category = 'engagement'
WHERE
  id BETWEEN 1 AND 100;

-- => batch one claims its disjoint key range with a short lock
UPDATE ex29_events
SET
  category = 'engagement'
WHERE
  id BETWEEN 101 AND 200;

-- => batch two follows without ever locking the whole table
UPDATE ex29_events
SET
  category = 'engagement'
WHERE
  id BETWEEN 201 AND 300;

-- => batch three keeps the same small-lock discipline
UPDATE ex29_events
SET
  category = 'engagement'
WHERE
  id BETWEEN 301 AND 400;

-- => batch four advances through the key space steadily
UPDATE ex29_events
SET
  category = 'engagement'
WHERE
  id BETWEEN 401 AND 500;

-- => batch five passes the halfway mark of the table
UPDATE ex29_events
SET
  category = 'engagement'
WHERE
  id BETWEEN 501 AND 600;

-- => batch six continues the steady disjoint march
UPDATE ex29_events
SET
  category = 'engagement'
WHERE
  id BETWEEN 601 AND 700;

-- => batch seven leaves three hundred rows still uncategorized
UPDATE ex29_events
SET
  category = 'engagement'
WHERE
  id BETWEEN 701 AND 800;

-- => batch eight narrows the remaining work to two hundred
UPDATE ex29_events
SET
  category = 'engagement'
WHERE
  id BETWEEN 801 AND 900;

-- => batch nine leaves only the final hundred untouched
UPDATE ex29_events
SET
  category = 'engagement'
WHERE
  id BETWEEN 901 AND 1000;

-- => batch ten finishes the table: every row categorized exactly once
