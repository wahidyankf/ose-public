-- 0003: the total column arrives empty. -- => nullable first, filled next
ALTER TABLE invoices -- => the seeded rows stay exactly where they are
    ADD COLUMN total INTEGER; -- => NULL until the backfill derives values
