// Solution: two-key less with the name tiebreak. Ties rank deterministically.
// => primary commits, tiebreak name: the full ordering in one predicate
// => budi precedes citra on 30: alphabetical, not input-order luck
package main

import (
	"fmt"  // => prints the tie-stable ranking: sari, budi, citra, always
	"sort" // => Slice with the two-key predicate: ties resolved, not kept
)

// Dev pairs a handle with a commit count: identical data, stable order now.
type Dev struct { // => same shape as the starter: only the predicate changed
	Name    string // => tiebreak key, USED by the solution predicate
	Commits int    // => primary key: higher commits still rank first
}

func main() {
	// => same tricky input: citra before budi, equal commits, tie to resolve
	team := []Dev{{"citra", 30}, {"sari", 41}, {"budi", 30}} // => tie: 30 and 30
	// => two-key less: commits first, name on ties: deterministic, input-proof
	sort.Slice(team, func(i, j int) bool { // => primary plus tiebreak, one place
		// => tie test guards the tiebreak: unequal commits never reach names
		if team[i].Commits != team[j].Commits { // => primary decides first
			return team[i].Commits > team[j].Commits // => descending commits
		}
		return team[i].Name < team[j].Name // => tiebreak: budi before citra
	})
	// => ranked: sari 41 first, then the 30-tie broken alphabetically, always
	fmt.Println(team) // => Output: [{sari 41} {budi 30} {citra 30}]
}
