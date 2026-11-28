// Command parity builds the old-site URL inventory and reports the new app's
// gaps against it. It is a thin entry: the behaviour lives in internal/parity.
package main

import (
	"os"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/parity"
)

// exit and hostFor are the process seams main uses. The real process keeps
// os.Exit and parity.OSHost; unit tests replace them with doubles.
var (
	exit    = os.Exit
	hostFor = parity.OSHost
)

func main() {
	exit(parity.Run(os.Args[1:], hostFor()))
}
