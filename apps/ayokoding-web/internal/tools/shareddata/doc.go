package shareddata

// Package shareddata embeds the language-neutral tool datasets so the
// serving binary always reads the same bytes the TypeScript readers and the
// shared test vectors were generated from. The JSON files are NOT committed:
// the build:assets target copies them from libs/ayokoding-data/data before
// go build runs, and TestEmbeddedMatchesSource fails the build if a checked-in
// working copy drifts from the canonical library.
