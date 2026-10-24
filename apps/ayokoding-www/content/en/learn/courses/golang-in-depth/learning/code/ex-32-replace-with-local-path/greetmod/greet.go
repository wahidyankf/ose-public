// Package greetmod is the nested sibling module wired by replace.
// => its own module path: it COULD publish independently one day
// => replace keeps it local meanwhile: develop together, version never
package greetmod

// Hello renders the greeting this module owns: one function, one sentence.
// => exported: the main module imports exactly this name through the path
func Hello(name string) string { // => pure: same name in, same greeting out
	// => Sprintf-free concatenation: the sentence shape is fixed and tiny
	return "selamat datang, " + name // => Indonesian greeting, owned here
}
