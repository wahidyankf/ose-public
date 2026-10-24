-- V002 adds the due date invoices need for dunning.
-- Small single-purpose files keep previews readable for reviewers.
ALTER TABLE ex16_invoices
ADD COLUMN due_on DATE NOT NULL DEFAULT CURRENT_DATE;

-- => DEFAULT keeps existing invoice rows valid at alter time
