// Package bdd_test binds the CLI-contract Gherkin corpus through three
// drivers chosen by build tag: the default build runs the command in process,
// -tags integration runs a freshly built binary against temp dirs, and
// -tags e2e runs the stamped binary in AYOKODING_BIN.
package bdd_test
