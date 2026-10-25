## Example code for practical-data-analytics

One folder per worked example: `ex-NN-<slug>/` holds `main.py`, its `run.yaml` (`toolchain: python`, standard library only), the fixture datasets the page names, and the recorded output under `expected/`. Every unit is deterministic: no network, no clock reads, no random seeds, fixed fictional facts only.

Every monetary amount is an integer count of rupiah, never a float, so rounding is reproducible across runs. Sinar Abadi and every worked company are fictional. Join examples build an in-memory `sqlite3` database from the committed CSV fixtures, using the same SELECT, JOIN, GROUP BY, and HAVING semantics the catalog's existing Postgres toolchain runs.
