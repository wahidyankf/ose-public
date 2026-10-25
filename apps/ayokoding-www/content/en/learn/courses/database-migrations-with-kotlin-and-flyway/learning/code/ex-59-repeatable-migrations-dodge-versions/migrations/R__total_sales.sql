-- R: the repeatable view always reflects current logic.
CREATE OR REPLACE VIEW total_sales AS SELECT sum(amount) AS total FROM sales;
