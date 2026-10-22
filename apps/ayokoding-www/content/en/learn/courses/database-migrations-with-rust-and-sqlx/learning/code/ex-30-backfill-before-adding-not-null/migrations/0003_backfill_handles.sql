-- 0003: invent handles for the handle-less. -- => every row gains a value
UPDATE profiles -- => rewrite nulls into real handles
    SET handle = 'user-' || id WHERE handle IS NULL; -- => derived handles, only where missing
