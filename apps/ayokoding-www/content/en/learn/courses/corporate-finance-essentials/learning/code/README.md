## Example code for corporate-finance-essentials

One folder per worked example: `ex-NN-<slug>/` holds `main.py`, its `run.yaml` (`toolchain: python`, standard library only), and the recorded output under `expected/`. Every unit is deterministic: no network, no clock reads, no random seeds, fixed fictional facts only.

Every monetary amount uses `decimal.Decimal`, never a float, so rounding is reproducible across runs. The lesson pages embed every file byte-identically. Merpati Trading Co. and every worked company are fictional.
