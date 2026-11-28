# P3-Corpus: C4 delivery proof

Run after GREEN and REFACTOR. The tree is commit `00d942256`
(`refactor(ayokoding-web): resolve the default corpus roots in one function`), the last code commit of the unit.
Each command ran as one HIPPO job, one at a time, with ports 3191 and 3102 checked free first. Raw outputs are in
`c4/`.

| Step                           | Command (HIPPO class and tier)                                                            | Exit | Positive result                                                                                                                                                      | Raw output                                  |
| ------------------------------ | ----------------------------------------------------------------------------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| ayokoding-web test:quick       | `npm exec -- nx run ayokoding-web:test:quick --skip-nx-cache` (ephemeral, standard)       | 0    | Unit coverage 99.0% (minimum 99%); behaviour coverage checked 1007 scenarios, no findings                                                                            | `c4/ayokoding-web-test-quick.raw.txt`       |
| ayokoding-web build            | `npm exec -- nx run ayokoding-web:build --skip-nx-cache` (ephemeral, standard)            | 0    | Successfully ran target build                                                                                                                                        | `c4/ayokoding-web-build.raw.txt`            |
| ayokoding-web test:integration | `npm exec -- nx run ayokoding-web:test:integration --skip-nx-cache` (ephemeral, standard) | 0    | `tests/bdd-integration` ok; `tests/integration` ok                                                                                                                   | `c4/ayokoding-web-test-integration.raw.txt` |
| ayokoding-web-be-e2e test:e2e  | `npm exec -- nx run ayokoding-web-be-e2e:test:e2e --skip-nx-cache` (ephemeral, heavy)     | 0    | Real-corpus config 20 passed; fixture config 5 passed                                                                                                                | `c4/ayokoding-web-be-e2e-test-e2e.raw.txt`  |
| ayokoding-web-fe-e2e test:e2e  | `npm exec -- nx run ayokoding-web-fe-e2e:test:e2e --skip-nx-cache` (ephemeral, heavy)     | 0    | Real-corpus config 213 passed (bdd 66 and specs 5 per browser, chromium, firefox, webkit); fixture config 58 passed (bdd-fixture 17 per browser; htmx 7 on chromium) | `c4/ayokoding-web-fe-e2e-test-e2e.raw.txt`  |

The reported counts show no skipped, flaky or failed tests in any run above. The be and fe real-corpus
counts (20 and 213) are the figures from the C4 runs above, which ran after the refactor.
