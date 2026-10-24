-- 0004: status defaults every order open. -- => the default reaches back in time
ALTER TABLE orders -- => existing orders gain status immediately
    ADD COLUMN status TEXT NOT NULL DEFAULT 'open'; -- => old and new orders share the default
