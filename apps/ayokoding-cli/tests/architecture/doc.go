// Package architecture guards the production import graph: the test in this
// package walks cmd and internal plus negative fixtures, and the rule table
// in check.go decides which imports each path may hold.
package architecture
