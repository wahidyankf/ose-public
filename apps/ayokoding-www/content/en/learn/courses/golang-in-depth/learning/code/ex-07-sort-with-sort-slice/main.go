// Example 7: Sort with sort.Slice.
//
// The standard library sorts any slice when you supply a less function,
// so custom ordering lives in one small predicate you can read aloud.
package main

import (
	"fmt"  // => prints the ranking before and after the sort call
	"sort" // => Slice sorts in place using your less predicate
)

// Dev pairs a handle with a commit count for the ranking below.
// => struct groups related fields; less reads them, never reorders them
type Dev struct { // => exported fields: sortable from any package
	Name    string // => tiebreak key, compared only when commits tie
	Commits int    // => primary key: more commits ranks higher
}

func main() {
	// => deliberately unordered input, with one commit-count tie inside
	team := []Dev{{"citra", 30}, {"sari", 41}, {"budi", 30}} // => budi ties citra
	// => Slice sorts in place: no copy is returned, the input is arranged
	// => less(i, j) answers "should element i come before element j"
	sort.Slice(team, func(i, j int) bool { // => closure captures nothing here
		// => primary key first: higher commits sort earlier, hence !=
		if team[i].Commits != team[j].Commits { // => tie test guards the tiebreak
			return team[i].Commits > team[j].Commits // => descending commits
		}
		// => tiebreak only runs on ties: alphabetical by handle, ascending
		return team[i].Name < team[j].Name // => budi precedes citra on 30
	})
	// => ranked: sari 41 first, then the 30-tie broken alphabetically
	fmt.Println(team) // => Output: [{sari 41} {budi 30} {citra 30}]
	// => IsSorted reuses the same predicate to verify the result cheaply
	ok := sort.SliceIsSorted(team, func(i, j int) bool { // => same order rule
		// => identical body: verification must use the identical predicate
		if team[i].Commits != team[j].Commits { // => same primary key first
			return team[i].Commits > team[j].Commits // => same descending rule
		}
		return team[i].Name < team[j].Name // => same alphabetical tiebreak
	})
	fmt.Println("sorted:", ok) // => Output: sorted: true
}
