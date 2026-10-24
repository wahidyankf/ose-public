# Phase 0 Lock Source — Plan 10

## Reuse assessment: no source available

Plan 06 is unmerged and its backlog folder contains no `requirements.lock`; no
`requirements.lock` exists anywhere under `apps/ayokoding-www/content/`. There is
no lock text to record and no hash to compute. This is expected under the user's
execution order (plan 10 before plan 06).

## Resolution (recorded, same class as the absorbed-foundation decision)

The `database-migrations-with-python-and-alembic` course generates its hash-locked
`requirements.lock` fresh at course-write time (Phase 3): the maker re-verifies the
current Alembic, SQLAlchemy-core, and PostgreSQL-driver versions, records hashes with
`pip hash`, and dates the access, per the course spec's provenance rule ("Python 3.14
with the hash-locked pure-Python Alembic and SQLAlchemy-core distribution"). Generating
it now would bake stale versions; the Phase 3 writer step owns it.
