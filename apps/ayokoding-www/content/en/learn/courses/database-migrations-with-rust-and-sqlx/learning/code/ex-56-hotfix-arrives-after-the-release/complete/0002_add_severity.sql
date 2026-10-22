-- 0002 hotfix: severity cannot wait. -- => the only pending file in the second run
ALTER TABLE tickets -- => the shipped table gains the urgent column
    ADD COLUMN severity TEXT NOT NULL DEFAULT 'normal'; -- => defaulted so shipped rows comply
