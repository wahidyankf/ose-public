// Starter: commits-only sort. The gap: ties keep input order, unstable.
// => less compares Commits alone: equal commits never establish an order
// => rewrite: add the name tiebreak, following Example 7's two-key predicate
package main

import (
	"fmt"  // => prints the tie-unstable ranking: citra before budi by luck
	"sort" // => Slice sorts in place with the single-key predicate below
)

// Dev pairs a handle with a commit count: the ranking input for both shapes.
type Dev struct { // => same type the solution reuses: data unchanged, order fixed
	Name    string // => tiebreak key, IGNORED by the starter predicate
	Commits int    // => primary key: the only key the starter compares
}

func main() {
	// => citra listed before budi with equal commits: input order decides ties
	team := []Dev{{"citra", 30}, {"sari", 41}, {"budi", 30}} // => tie: 30 and 30
	// => single-key less: commits only, ties left wherever input put them
	sort.Slice(team, func(i, j int) bool { // => one comparison, no tiebreak
		return team[i].Commits > team[j].Commits // => tie: returns false both ways
	})
	// => citra still precedes budi: input order survived, not a real ranking
	fmt.Println(team) // => order of the tie is luck: rerun with shuffled input
}
