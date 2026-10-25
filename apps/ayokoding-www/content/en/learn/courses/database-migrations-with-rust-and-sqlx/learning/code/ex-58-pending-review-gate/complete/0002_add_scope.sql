-- 0002: scope arrives under review. -- => the candidate the gate inspects
ALTER TABLE flags -- => the shipped table gains the reviewed column
    ADD COLUMN scope TEXT NOT NULL DEFAULT 'global'; -- => defaulted so shipped rows comply
