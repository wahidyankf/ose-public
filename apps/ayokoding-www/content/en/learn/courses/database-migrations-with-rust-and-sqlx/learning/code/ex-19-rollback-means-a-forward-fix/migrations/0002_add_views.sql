-- 0002: the views column ships too soon. -- => the mistake under repair
ALTER TABLE posts -- => the existing rows keep their titles
    ADD COLUMN views INTEGER NOT NULL DEFAULT 0; -- => analytics wanted this yesterday
