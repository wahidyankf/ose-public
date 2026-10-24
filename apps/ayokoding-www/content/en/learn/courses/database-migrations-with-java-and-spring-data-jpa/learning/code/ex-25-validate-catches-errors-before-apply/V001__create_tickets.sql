-- V001 creates tickets: validated before it ever runs.
-- Validation recomputes this file's checksum and compares it to nothing yet.
-- Pending and intact is the clean bill of health this example prints.
CREATE TABLE ex25_tickets (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for tickets
  subject VARCHAR(200) NOT NULL
  -- => the ticket subject support agents triage by
);
