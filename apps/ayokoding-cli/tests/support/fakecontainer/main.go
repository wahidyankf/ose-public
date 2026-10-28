// Command fakecontainer stands in for the container CLI in integration
// tests: it records every argv line, and its behaviour is scripted through
// FAKECONTAINER_* environment variables. It is never used in production.
//
// Protocol:
// Every invocation appends "argv: <args joined by one space>" to
// FAKECONTAINER_LOG when set. "info" prints rootless engine JSON, or rootful
// JSON with FAKECONTAINER_ROOTFUL=1; FAKECONTAINER_DAEMON_DOWN=1 makes "info"
// and "version" fail, FAKECONTAINER_PULL_FAIL=1 makes "pull" fail, and
// FAKECONTAINER_NEVER_READY=1 makes "exec" fail. "build" succeeds. "run"
// parses --name, logs "started <name>", sleeps FAKECONTAINER_SLEEP seconds,
// logs "exited <name> code=<n>", and exits FAKECONTAINER_RUN_EXIT (default 0).
// "ps" prints FAKECONTAINER_PS verbatim, "network ls" prints
// FAKECONTAINER_NETWORKS verbatim (Podman JSON in the sweep tests),
// FAKECONTAINER_ECHO_STDIN=1 copies standard input to standard output on
// "run", "rm" logs
// "removed container <name>"
// per name, and "network create" and "network rm" log their network.
package main

import (
	"fmt"
	"io"
	"os"
	"strconv"
	"strings"
	"time"
)

// getenv reads one script variable, empty when unset.
func getenv(name string) string {
	return os.Getenv(name)
}

// record appends one line to the fake log when logging is configured.
func record(line string) {
	path := getenv("FAKECONTAINER_LOG")
	if path == "" {
		return
	}
	file, err := os.OpenFile(path, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0o600)
	if err != nil {
		fmt.Fprintln(os.Stderr, "fakecontainer: open log: "+err.Error())
		os.Exit(2)
	}
	_, _ = fmt.Fprintln(file, line)
	_ = file.Close()
}

// fail reports a scripted failure on standard error.
func fail(message string) int {
	fmt.Fprintln(os.Stderr, "fakecontainer: "+message)
	return 1
}

// runName returns the value of the --name flag, empty when absent.
func runName(args []string) string {
	for i, arg := range args {
		if arg == "--name" && i+1 < len(args) {
			return args[i+1]
		}
		if name, ok := strings.CutPrefix(arg, "--name="); ok {
			return name
		}
	}
	return ""
}

// runContainer simulates one attached container run. FAKECONTAINER_ECHO_STDIN=1
// copies standard input to standard output, so callers prove input delivery.
func runContainer(args []string) int {
	name := runName(args)
	record("started " + name)
	if output := getenv("FAKECONTAINER_STDOUT"); output != "" {
		_, _ = os.Stdout.WriteString(output)
	}
	if seconds, err := strconv.Atoi(getenv("FAKECONTAINER_SLEEP")); err == nil && seconds > 0 {
		time.Sleep(time.Duration(seconds) * time.Second)
	}
	if getenv("FAKECONTAINER_ECHO_STDIN") == "1" {
		_, _ = io.Copy(os.Stdout, os.Stdin)
	}
	code := 0
	if raw := getenv("FAKECONTAINER_RUN_EXIT"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil {
			code = parsed
		}
	}
	record("exited " + name + " code=" + strconv.Itoa(code))
	return code
}

// runNetwork simulates the network subcommands.
func runNetwork(args []string) int {
	if len(args) == 0 {
		return fail("network needs a subcommand")
	}
	switch args[0] {
	case "create":
		for _, name := range args[1:] {
			if !strings.HasPrefix(name, "-") {
				record("created network " + name)
			}
		}
		return 0
	case "rm":
		for _, name := range args[1:] {
			if !strings.HasPrefix(name, "-") {
				record("removed network " + name)
			}
		}
		return 0
	case "ls":
		_, _ = os.Stdout.WriteString(getenv("FAKECONTAINER_NETWORKS"))
		return 0
	default:
		return fail("unknown network subcommand " + args[0])
	}
}

// run dispatches one fake container CLI invocation.
func run(args []string) int {
	record("argv: " + strings.Join(args, " "))
	if len(args) == 0 {
		return fail("needs a subcommand")
	}
	switch args[0] {
	case "info":
		if getenv("FAKECONTAINER_DAEMON_DOWN") == "1" {
			return fail("daemon unreachable")
		}
		if getenv("FAKECONTAINER_ROOTFUL") == "1" {
			_, _ = os.Stdout.WriteString(`{"host":{"security":{"rootless":false}}}` + "\n")
			return 0
		}
		_, _ = os.Stdout.WriteString(`{"host":{"security":{"rootless":true}}}` + "\n")
		return 0
	case "version":
		if getenv("FAKECONTAINER_DAEMON_DOWN") == "1" {
			return fail("daemon unreachable")
		}
		_, _ = os.Stdout.WriteString("fakecontainer 0.0.0\n")
		return 0
	case "pull":
		if getenv("FAKECONTAINER_PULL_FAIL") == "1" {
			return fail("pull failed")
		}
		return 0
	case "build":
		return 0
	case "run":
		return runContainer(args[1:])
	case "exec":
		if getenv("FAKECONTAINER_NEVER_READY") == "1" {
			return fail("not ready")
		}
		return 0
	case "ps":
		_, _ = os.Stdout.WriteString(getenv("FAKECONTAINER_PS"))
		return 0
	case "rm":
		for _, name := range args[1:] {
			if !strings.HasPrefix(name, "-") {
				record("removed container " + name)
			}
		}
		return 0
	case "network":
		return runNetwork(args[1:])
	case "image":
		return 0
	default:
		return fail("unknown subcommand " + args[0])
	}
}

func main() {
	os.Exit(run(os.Args[1:]))
}
