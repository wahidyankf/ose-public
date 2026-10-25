-- 0003: the forward fix removes views. -- => rollback as a new version, not an edit
ALTER TABLE posts -- => history keeps both the mistake and its repair
    DROP COLUMN views; -- => the schema returns to the pre-column shape
