-- 0003: three bounded updates, one per batch. -- => short locks, small rollbacks
UPDATE events SET day = 'one' WHERE id BETWEEN 1 AND 2; -- => batch one claims two rows
UPDATE events SET day = 'two' WHERE id BETWEEN 3 AND 4; -- => batch two claims two rows
UPDATE events SET day = 'three' WHERE id BETWEEN 5 AND 6; -- => batch three claims two rows
