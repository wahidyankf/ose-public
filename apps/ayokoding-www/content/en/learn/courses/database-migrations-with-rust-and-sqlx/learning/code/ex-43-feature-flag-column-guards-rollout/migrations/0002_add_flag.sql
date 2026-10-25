-- 0002: every launch starts dark. -- => safe default: nothing rolls out by accident
ALTER TABLE launches -- => the existing rows stay dark
    ADD COLUMN rolled_out BOOLEAN NOT NULL DEFAULT false; -- => opt-in per row, never global
