**`learning/code/`**

One unit directory per worked example: `ex-NN-<slug>/` holds the runnable
`main.py`, its `run.yaml` (`schema: ayokoding.run/v1`, Python 3.14, standard
library only), and the recorded `expected/main.stdout.txt`.

Each `main.py` drives a deterministic fixture shim of Hermes Agent's CLI and
file-system effects. No unit touches the network, a real API key, or a real
account. Run one with `python3 main.py` from inside its own directory and
diff your output against the expected file. Lesson fences in
`learning/*.md` are byte-identical to these files; do not edit fences by
hand, regenerate them from the files.
