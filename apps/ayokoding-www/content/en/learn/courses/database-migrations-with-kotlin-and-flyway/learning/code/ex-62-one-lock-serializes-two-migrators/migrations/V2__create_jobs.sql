-- V2: jobs belong to a queue.
CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    queue_id INTEGER NOT NULL REFERENCES queues(id)
);
