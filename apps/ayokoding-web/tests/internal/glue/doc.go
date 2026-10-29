// Package glue shares the web-contract step definitions across the BDD
// suites. Unit and e2e bind every step through tests/bdd; integration binds
// every step except the @integration-exempt browser scenarios through
// tests/bdd-integration, which the static gate excuses only when no binding
// references them.
package glue
