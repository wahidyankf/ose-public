// Kata 19: Compose pagination, filter, and sort together.
//
// One list function combining three steps in order: filter first,
// sort the survivors second, paginate last. The page carries total
// and a next-page cursor alongside its items.
package main

import (
	"fmt"  // => prints both pages with their metadata
	"log"  // => fail-fast on any self-check mismatch
	"sort" // => stable sort for the optional ordering step
)

// Task is the row shape being listed.
type Task struct { // => id plus one filterable and one sortable field
	ID       int    // => stable identity asserted per page
	Status   string // => the filter field
	Priority int    // => the sort field
}

// Page is the pagination envelope around one slice of rows.
type Page struct { // => co-19: items plus total plus a next-page cursor
	Items      []Task // => the rows on this page only
	Total      int    // => co-19: the filtered count, not the whole table
	NextOffset *int   // => nil when this page reaches the end
}

// ListTasks filters, sorts, then paginates one in-memory dataset.
func ListTasks(tasks []Task, status string, sortBy string, limit, offset int) Page { // => empty status means no filter
	var filtered []Task       // => survivors of the filter step
	for _, t := range tasks { // => one predicate check per row
		if status == "" || t.Status == status { // => co-20: filter step first
			filtered = append(filtered, t)
		}
	}
	if sortBy == "priority" { // => co-20: sort step second, over the filtered set
		sort.SliceStable(filtered, func(i, j int) bool { // => stable O(n log n) ordering
			return filtered[i].Priority < filtered[j].Priority
		})
	}
	end := offset + limit       // => the exclusive upper bound of this page window
	if offset > len(filtered) { // => past the end: clamp so slicing yields an empty page
		offset = len(filtered)
	}
	if end > len(filtered) { // => a short last page clamps the same way
		end = len(filtered)
	}
	page := filtered[offset:end]      // => co-19: pagination step last, over the filtered+sorted set
	var nextOffset *int               // => nil means "no further pages"
	if offset+limit < len(filtered) { // => more filtered rows remain beyond this page
		n := offset + limit // => the offset the next request should use
		nextOffset = &n     // => heap-allocated cursor for the caller
	}
	return Page{Items: page, Total: len(filtered), NextOffset: nextOffset} // => co-19: metadata alongside the page
}

func ids(tasks []Task) []int {
	out := make([]int, 0, len(tasks)) // => one id per row on this page
	for _, t := range tasks {         // => preserve page order
		out = append(out, t.ID)
	}
	return out // => the order assertions check
}

func equalInts(a, b []int) bool {
	if len(a) != len(b) { // => different lengths cannot match
		return false
	}
	for i := range a { // => element-wise comparison
		if a[i] != b[i] {
			return false
		}
	}
	return true // => same length, same order
}

func main() {
	tasks := []Task{ // => one shared dataset for both pages
		{ID: 1, Status: "open", Priority: 3},
		{ID: 2, Status: "open", Priority: 1},
		{ID: 3, Status: "done", Priority: 2},
		{ID: 4, Status: "open", Priority: 2},
	}

	page1 := ListTasks(tasks, "open", "priority", 2, 0) // => co-19/co-20: all three steps combine
	page2 := ListTasks(tasks, "open", "priority", 2, 2) // => the second page of the same filtered set

	fmt.Println(ids(page1.Items), page1.Total, *page1.NextOffset) // => Output: [2 4] 3 2
	if page1.NextOffset == nil {                                  // => page 1 must point at page 2
		log.Fatalf("page1 next_offset must not be nil")
	}
	fmt.Println(ids(page2.Items), page2.Total, page2.NextOffset == nil) // => Output: [1] 3 true

	if !equalInts(ids(page1.Items), []int{2, 4}) { // => sorted by priority (1, 2) among open tasks
		log.Fatalf("page1 = %v, want [2 4]", ids(page1.Items))
	}
	if page1.Total != 3 { // => co-19: three open tasks total, two on this page
		log.Fatalf("page1 total = %d, want 3", page1.Total)
	}
	if *page1.NextOffset != 2 { // => co-19: a next page exists at offset 2
		log.Fatalf("page1 next = %d, want 2", *page1.NextOffset)
	}
	if page2.NextOffset != nil { // => co-19: this page reaches the end of the filtered set
		log.Fatalf("page2 next must be nil")
	}
	fmt.Println("kata-19 OK") // => the self-check line this track greps for
}
