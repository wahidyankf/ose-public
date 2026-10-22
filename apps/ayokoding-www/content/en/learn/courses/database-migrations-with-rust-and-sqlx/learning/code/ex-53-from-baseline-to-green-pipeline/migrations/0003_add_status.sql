-- 0003: the pipeline builds normally now. -- => no special cases past the floor
ALTER TABLE legacy_orders -- => the adopted table evolves like any other
    ADD COLUMN status TEXT NOT NULL DEFAULT 'open'; -- => defaulted so legacy rows comply
