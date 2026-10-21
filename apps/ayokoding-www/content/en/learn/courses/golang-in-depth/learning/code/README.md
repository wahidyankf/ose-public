## Example code for golang-in-depth

One folder per worked example: `ex-NN-<slug>/` holds the Go sources, its `run.yaml` (`toolchain: go`, standard library only), and the recorded output under `expected/`. Single-file units build with `go build -o main main.go`; multi-file package units carry their own `go.mod` and build with `go build -o main .`. Testing-convention units run `go test -v` with timing normalized out of the transcript; the toolchain chapter runs `go vet`, `go list -m all`, `go doc Queue`, or a benchmark count where the lesson is about the tool itself. No example needs the network, the clock, or random seeds: fixed inputs keep every run byte-deterministic.

The `.go` files are heavily annotated in the `// =>` notation, except the `go doc` unit, which keeps genuine doc comments so the recorded `go doc` output is exactly what a reader would see. The lesson pages embed every file byte-identically; `go.mod` files appear as text blocks beside their units.
