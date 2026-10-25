-- V003 indexes the shelf column: the query path of the closing set.
CREATE INDEX ex78_library_shelf_idx ON ex78_library (shelf);

-- => the index earns its own version like every change before it
