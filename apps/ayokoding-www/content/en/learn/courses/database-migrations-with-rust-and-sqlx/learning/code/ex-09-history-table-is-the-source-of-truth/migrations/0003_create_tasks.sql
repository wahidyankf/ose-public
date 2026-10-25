-- 0003: tasks belong to projects. -- => the third of three recorded runs
CREATE TABLE tasks ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    project_id INTEGER NOT NULL REFERENCES projects (id), -- => every task belongs to a project
    title TEXT NOT NULL -- => every task must be titled
); -- => the definition closes here
