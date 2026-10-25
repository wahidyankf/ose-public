-- 0003: the default fills old rows at alter time. -- => no update statement needed
ALTER TABLE charges -- => existing rows gain USD instantly
    ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD'; -- => old and new rows share the default
