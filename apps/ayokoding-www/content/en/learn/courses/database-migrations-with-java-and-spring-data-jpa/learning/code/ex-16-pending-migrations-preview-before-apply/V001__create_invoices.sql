-- V001 creates invoices: pending until the preview confirms and apply runs.
-- Preview compares sorted files against ledger versions, nothing more.
CREATE TABLE ex16_invoices (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for invoices
  amount_cents INTEGER NOT NULL
  -- => money stays in integer cents, never floating point
);
