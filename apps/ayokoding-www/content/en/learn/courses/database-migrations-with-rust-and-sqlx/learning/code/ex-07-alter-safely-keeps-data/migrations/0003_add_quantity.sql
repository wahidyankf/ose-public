-- 0003: quantity defaults so the old row survives. -- => NOT NULL needs a default on live tables
ALTER TABLE inventory -- => the existing row stays exactly where it is
    ADD COLUMN qty INTEGER NOT NULL DEFAULT 0; -- => old rows gain zero, new rows must say
