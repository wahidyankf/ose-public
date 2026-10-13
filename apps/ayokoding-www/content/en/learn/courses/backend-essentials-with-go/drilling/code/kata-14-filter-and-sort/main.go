// Kata 14: Filter and sort mock records from query-param-like input.
//
// Filters combine with AND semantics; an optional sort orders the
// survivors. Field names come from an allowlist, never eval'd.
package main

import (
	"fmt"  // => prints the three id lists
	"log"  // => fail-fast on any self-check mismatch
	"sort" // => stable sort for the optional ordering step
)

// Task is the mock row shape.
type Task struct { // => tiny record with two filterable fields
	ID       int    // => stable identity asserted in order below
	Status   string // => e.g. open or done
	Priority string // => e.g. high or low
}

// fieldValue reads one allowlisted field from a task.
func fieldValue(t Task, field string) (string, bool) { // => allowlist lookup, never direct map indexing
	switch field { // => co-20: an allowlist, never eval of a raw field name
	case "status":
		return t.Status, true
	case "priority":
		return t.Priority, true
	default:
		return "", false // => unknown field: caller treats as no-match or rejects
	}
}

// FilterAndSort applies AND-combined filters, then an optional sort.
func FilterAndSort(tasks []Task, filters map[string]string, sortKey string) []Task { // => sortKey empty means no sort
	var result []Task            // => survivors of the filter step
	for _, task := range tasks { // => one membership test per row
		matches := true                    // => AND semantics: must match every supplied filter
		for field, want := range filters { // => each query-param-like filter
			got, ok := fieldValue(task, field) // => allowlisted read
			if !ok || got != want {            // => unknown field or value mismatch
				matches = false
				break
			}
		}
		if matches { // => only rows matching every filter survive
			result = append(result, task)
		}
	}
	if sortKey != "" { // => sort is optional: absent keeps insertion order
		sort.SliceStable(result, func(i, j int) bool { // => stable O(n log n) sort
			vi, _ := fieldValue(result[i], sortKey) // => allowlisted accessor doubles as sort key
			vj, _ := fieldValue(result[j], sortKey) // => same accessor for the other side
			return vi < vj                          // => alphabetical ordering
		})
	}
	return result // => filtered, optionally sorted
}

func ids(tasks []Task) []int {
	out := make([]int, 0, len(tasks)) // => one id per surviving row
	for _, t := range tasks {         // => preserve the result order
		out = append(out, t.ID)
	}
	return out // => the order assertions below check
}

func equalInts(a, b []int) bool {
	if len(a) != len(b) { // => different lengths cannot be equal
		return false
	}
	for i := range a { // => compare element by element
		if a[i] != b[i] {
			return false
		}
	}
	return true // => same length, same elements in order
}

func main() {
	tasks := []Task{ // => small in-memory dataset
		{ID: 1, Status: "open", Priority: "high"},
		{ID: 2, Status: "done", Priority: "low"},
		{ID: 3, Status: "done", Priority: "high"},
		{ID: 4, Status: "open", Priority: "low"},
	}

	doneOnly := FilterAndSort(tasks, map[string]string{"status": "done"}, "")                     // => single filter, no sort
	doneHigh := FilterAndSort(tasks, map[string]string{"status": "done", "priority": "high"}, "") // => co-20: two filters AND'd
	sortedByPriority := FilterAndSort(tasks, map[string]string{}, "priority")                     // => no filter, just a sort

	fmt.Println(ids(doneOnly))         // => Output: [2 3]
	fmt.Println(ids(doneHigh))         // => Output: [3]
	fmt.Println(ids(sortedByPriority)) // => Output: [1 3 2 4] (high, high, low, low)

	if !equalInts(ids(doneOnly), []int{2, 3}) { // => both done rows, insertion order
		log.Fatalf("doneOnly = %v, want [2 3]", ids(doneOnly))
	}
	if !equalInts(ids(doneHigh), []int{3}) { // => id 2 is done but low priority, excluded by AND
		log.Fatalf("doneHigh = %v, want [3]", ids(doneHigh))
	}
	if !equalInts(ids(sortedByPriority), []int{1, 3, 2, 4}) { // => alphabetical: high, high, low, low, stable
		log.Fatalf("sorted = %v, want [1 3 2 4]", ids(sortedByPriority))
	}
	fmt.Println("kata-14 OK") // => the self-check line this track greps for
}
