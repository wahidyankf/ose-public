-- U002 restores paid from status if the new shape must be abandoned.
-- Contraction still ships a reverse: abandonment stays possible, just rare.
ALTER TABLE ex37_orders
ADD COLUMN paid BOOLEAN NOT NULL DEFAULT false;

-- => the column returns with a safe default before values restore below
UPDATE ex37_orders
SET
  paid = (status = 'paid');

-- => values restore from the new vocabulary the migrate phase certified
