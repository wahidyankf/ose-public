-- V2: stock rows belong to a warehouse.
CREATE TABLE stock (
    id SERIAL PRIMARY KEY,
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
    sku TEXT NOT NULL
);
