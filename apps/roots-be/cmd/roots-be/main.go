// Command roots-be serves the Roots backend.
//
// This file is deliberately thin and is excluded from the coverage denominator:
// everything it does is bind a socket and read the process environment, which
// are precisely the boundaries Unit proof may not touch. All decisions it makes
// live in internal/config and internal/router, which are covered at 100%.
package main

import (
	"flag"
	"fmt"
	"net"
	"os"
	"strconv"

	"github.com/wahidyankf/ose-public/apps/roots-be/internal/config"
	"github.com/wahidyankf/ose-public/apps/roots-be/internal/router"
)

func main() {
	// Keep ROOTS_BE_PORT beside its environment read so the declared environment
	// contract can verify that the public key has a real consumer.
	portFlag := flag.String("port", "", "listener port; overrides ROOTS_BE_PORT")
	flag.Parse()

	port, err := config.ResolvePort(*portFlag, os.LookupEnv, "ROOTS_BE_PORT")
	if err != nil {
		// Refuse to start rather than fall back to the default, so a typo'd port
		// surfaces immediately instead of as traffic arriving on the wrong one.
		fmt.Fprintf(os.Stderr, "roots-be: %v\n", err)
		os.Exit(1)
	}

	address := net.JoinHostPort("", strconv.Itoa(port))
	if err := router.New().Run(address); err != nil {
		fmt.Fprintf(os.Stderr, "roots-be: %v\n", err)
		os.Exit(1)
	}
}
