-- 0004: derive every total from qty and price. -- => the backfill itself
UPDATE invoices -- => rewrite old rows into the new shape
    SET total = qty * price; -- => the derivation, applied to every row at once
