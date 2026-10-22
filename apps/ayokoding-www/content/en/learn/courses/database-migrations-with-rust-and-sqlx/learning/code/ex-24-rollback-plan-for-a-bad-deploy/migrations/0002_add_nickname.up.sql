-- 0002 up: the risky nickname column. -- => the deploy under rollback rehearsal
ALTER TABLE members -- => the existing members keep their names
    ADD COLUMN nickname TEXT; -- => nullable: the experiment touches nothing existing
