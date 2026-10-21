// Setup registers the two init steps this program needs before main.
// => init functions run in file order before main: setup only, never logic
// => keep them tiny: failures here panic, and testing init is miserable
package main

// registry holds setup markers in the order the init functions ran.
// => package state set once at startup: read-only after main begins
var registry []string // => nil until the first init appends below

// init seeds the registry first: file order decides, top of the file wins.
// => no arguments, no results: init cannot be called or tested directly
func init() { // => first init in file order: runs before the second below
	// => append the marker: proves this init ran before main's first line
	registry = append(registry, "seed") // => marker one: the seed step
}

// init loads the second marker after the first: same file, later position.
// => second init: file order is the only ordering guarantee within a file
func init() { // => runs after the seed init, still before main starts
	registry = append(registry, "load") // => marker two: the load step
}

// setupNote is called from main to prove the registry filled before main ran.
func setupNote() string { // => plain function: testable, unlike init itself
	// => Join-free manual render: two markers joined with a plus sign
	return registry[0] + "+" + registry[1] // => seed+load: both inits ran
}
