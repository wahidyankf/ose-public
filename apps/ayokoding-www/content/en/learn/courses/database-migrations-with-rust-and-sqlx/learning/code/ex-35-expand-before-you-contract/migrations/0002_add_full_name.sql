-- 0002: the new shape arrives beside the old. -- => expansion, not replacement
ALTER TABLE users -- => the old column stays exactly where it is
    ADD COLUMN full_name TEXT; -- => nullable: readers adopt it gradually
