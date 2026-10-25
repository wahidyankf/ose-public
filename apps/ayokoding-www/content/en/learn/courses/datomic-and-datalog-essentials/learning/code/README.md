## Example code for datomic-and-datalog-essentials

One folder per worked example: `ex-NN-<slug>/` holds `main.py`, its `run.yaml` (`toolchain: python`, standard library only), and the recorded output under `expected/`. Every unit is deterministic: no network, no clock reads, no random seeds, fixed fictional facts only.

Every example builds its own small in-process reference datom store, so each file runs standalone. Kencana Parts Co. and every worked company are fictional.
