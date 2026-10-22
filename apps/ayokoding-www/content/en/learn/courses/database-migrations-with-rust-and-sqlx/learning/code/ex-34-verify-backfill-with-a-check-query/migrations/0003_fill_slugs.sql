-- 0003: derive slugs from titles. -- => the work the check verifies
UPDATE articles -- => rewrite slug-less rows
    SET slug = lower(replace(title, ' ', '-')) WHERE slug IS NULL; -- => guarded, like all good backfills
