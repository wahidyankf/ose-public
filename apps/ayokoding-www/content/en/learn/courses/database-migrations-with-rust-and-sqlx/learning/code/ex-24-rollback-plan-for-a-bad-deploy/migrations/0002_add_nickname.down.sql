-- 0002 down: the rollback drops nickname. -- => recovery keeps id and name intact
ALTER TABLE members -- => the table survives; only the experiment leaves
    DROP COLUMN nickname; -- => the way back, tested before the deploy
