// Shapes declares the rectangle API: exported surface, hidden fields.
// => exported type plus constructor: the only legal way to build one
// => lowercase fields: readable through methods, unwritable from outside
package main

// Rect is a rectangle with hidden dimensions and an exported behavior set.
// => uppercase type: importers (and main.go) can name it freely
// => hidden fields force construction through NewRect: no half-made values
type Rect struct { // => the exported surface of this tiny package
	w, h int // => lowercase: dimensions change only through methods
}

// NewRect builds a valid rectangle: negative sides become their absolute value.
// => uppercase constructor: the package boundary's front door, documented
func NewRect(w, h int) Rect { // => returns by value: small, copyable, safe
	// => abs normalizes: negative inputs cannot create a negative rectangle
	if w < 0 { // => guard each dimension independently, same rule twice
		w = -w // => mirror: width is a magnitude, never a direction
	}
	if h < 0 { // => same guard: height obeys the same magnitude rule
		h = -h // => mirror: symmetry beats cleverness in constructors
	}
	return Rect{w: w, h: h} // => named fields: order-independent, readable
}

// Area reports the covered surface: length times width, nothing more.
// => uppercase method: part of the exported promise, tested and stable
func (r Rect) Area() int { // => value receiver: reports without mutating
	return r.w * r.h // => fields readable here: same package, full access
}
