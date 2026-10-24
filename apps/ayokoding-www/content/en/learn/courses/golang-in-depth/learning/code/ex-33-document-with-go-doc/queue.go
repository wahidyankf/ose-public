// Package main demonstrates documentation-driven design.
//
// A queue is a first-in first-out line: items leave in the order they arrived.
// The package comment frames everything go doc prints, so it states the idea
// before any single declaration below appears.
package main

// Queue is a first-in first-out line with a hidden backing slice.
//
// The zero value holds a nil slice; call NewQueue for the documented start.
// Items enter at the back through Push and leave from the front through Pop.
type Queue struct {
	items []string
}

// NewQueue returns an empty Queue ready for Push calls.
//
// The constructor documents the intended starting state: an empty, ready line.
// Prefer it over a bare &Queue{} so construction stays greppable in one place.
func NewQueue() *Queue {
	return &Queue{}
}

// Push adds an item to the back of the line.
//
// Appending amortizes growth, so pushing N items costs linear time overall.
// Pointer receiver: the shared line grows in place, visible to every holder.
func (q *Queue) Push(item string) {
	q.items = append(q.items, item)
}

// Pop removes and returns the front item, or false when the line is empty.
//
// The second result reports presence: false means nothing was removed at all.
// Removal reslices instead of copying, staying constant time however long
// the remaining line grows behind the departing front item.
func (q *Queue) Pop() (string, bool) {
	if len(q.items) == 0 {
		return "", false
	}
	front := q.items[0]
	q.items = q.items[1:]
	return front, true
}
