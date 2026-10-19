package application_test

import (
	"context"
	"errors"
	"slices"
	"strings"
	"testing"
	"time"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/application"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/catalog"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/containerplan"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// errProbeRefused scripts a service probe that never answers.
var errProbeRefused = errors.New("probe: connection refused")

// serviceCourse carries one unit querying postgres by its service name.
func serviceCourse() map[string]string {
	return map[string]string{
		"demo/learning/code/ex-01-query/run.yaml": `schema: ayokoding.run/v1
toolchain: python
services: [postgres]
runs:
  - name: main
    command: [python3, query.py]
    expect:
      exit: 0
      stdout: expected/main.stdout.txt
`,
		"demo/learning/code/ex-01-query/query.py":                 "print('one row')\n",
		"demo/learning/code/ex-01-query/expected/main.stdout.txt": "one row\n",
	}
}

// serviceClock advances virtual time on every sleep for bounded readiness
// tests.
type serviceClock struct {
	now time.Time
}

// Now reports the virtual time.
func (clock *serviceClock) Now() time.Time {
	return clock.now
}

// Sleep advances the virtual time by the pause.
func (clock *serviceClock) Sleep(pause time.Duration) {
	clock.now = clock.now.Add(pause)
}

// withServiceClock injects the virtual clock into the request.
func withServiceClock(req application.RunRequest, clock *serviceClock) application.RunRequest {
	req.Now = clock.Now
	req.Sleep = clock.Sleep
	return req
}

// containsFlag reports whether the argv carries the flag.
func containsFlag(argv []string, flag string) bool {
	return slices.Contains(argv, flag)
}

// containsImageRun reports whether the argv is a unit run (not a service
// start): a run without the network alias.
func containsImageRun(argv []string) bool {
	return argv[0] == "run" && !containsFlag(argv, "--network-alias") && !containsFlag(argv, "-d")
}

// TestRunServicePasses requires a unit reaching its service by name to
// pass: the internal network, the aliased service start with the catalog
// variables, readiness probes, the unit runs on that network, and the
// cleanup removing containers before the network.
func TestRunServicePasses(t *testing.T) {
	fake := &scriptedRuntime{run: okExecution("one row\n")}
	clock := &serviceClock{now: time.Now()}
	cat := testCatalog()
	for index, entry := range cat.Toolchains {
		if entry.ID == "postgres" {
			entry.Env = map[string]string{"POSTGRES_HOST_AUTH_METHOD": "trust"}
			cat.Toolchains[index] = entry
		}
	}
	req := withServiceClock(baseRunRequest(runContent(serviceCourse()), fake), clock)
	req.Catalog = cat
	report, err := application.Run(context.Background(), req)
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	if len(report.Findings) != 0 {
		t.Fatalf("findings=%+v, want none", report.Findings)
	}
	if len(report.Passed) != 1 {
		t.Fatalf("passed=%+v, want one pass", report.Passed)
	}
	argv := runArgv(fake)
	if !strings.Contains(argv, "network create --internal") {
		t.Fatalf("lifecycle misses the internal network (argv=%q)", argv)
	}
	if !strings.Contains(argv, "--network-alias postgres") {
		t.Fatalf("service start misses the alias (argv=%q)", argv)
	}
	if !strings.Contains(argv, "POSTGRES_HOST_AUTH_METHOD=trust") {
		t.Fatalf("service start misses the catalog variable (argv=%q)", argv)
	}
	if !strings.Contains(argv, "exec") || !strings.Contains(argv, "pg_isready") {
		t.Fatalf("lifecycle misses the readiness probe (argv=%q)", argv)
	}
	if strings.Contains(argv, "--network none") {
		t.Fatalf("unit runs keep --network none with services (argv=%q)", argv)
	}
	if !strings.Contains(argv, "PGHOST=postgres") {
		t.Fatalf("unit runs miss the connection variable (argv=%q)", argv)
	}
	cleanup := argv[strings.LastIndex(argv, "rm -f"):]
	if !strings.Contains(cleanup, "network rm") {
		t.Fatalf("cleanup misses the network removal (argv=%q)", argv)
	}
	wantTracked := []string{
		"ayokoding-test-run-1-postgres",
		"ayokoding-test-run-1-0",
		"ayokoding-test-run-1-1",
	}
	if len(fake.trackedContainers) != len(wantTracked) || len(fake.trackedNetworks) != 1 {
		t.Fatalf("tracked=%v/%v, want %v and one network",
			fake.trackedContainers, fake.trackedNetworks, wantTracked)
	}
	for index, name := range wantTracked {
		if fake.trackedContainers[index] != name {
			t.Fatalf("tracked=%v, want %v", fake.trackedContainers, wantTracked)
		}
	}
}

// TestRunServiceNeverReady124 requires a service that never reports ready
// to stop the run with 124 after the teardown still removes everything.
func TestRunServiceNeverReady124(t *testing.T) {
	fake := &scriptedRuntime{run: func(invoke containerplan.Invocation, _ []byte) (application.Execution, error) {
		if len(invoke.Args) > 0 && invoke.Args[0] == "exec" {
			return application.Execution{}, errProbeRefused
		}
		return application.Execution{Exit: 0}, nil
	}}
	clock := &serviceClock{now: time.Now()}
	req := withServiceClock(baseRunRequest(runContent(serviceCourse()), fake), clock)
	_, err := application.Run(context.Background(), req)
	if finding.ExitCode(err) != 124 {
		t.Fatalf("exit=%d, want 124", finding.ExitCode(err))
	}
	argv := runArgv(fake)
	if !strings.Contains(argv, "rm -f") || !strings.Contains(argv, "network rm") {
		t.Fatalf("teardown misses the cleanup after 124 (argv=%q)", argv)
	}
	unitRuns := 0
	for _, call := range fake.calls {
		if containsImageRun(call.invoke.Args) {
			unitRuns++
		}
	}
	if unitRuns != 0 {
		t.Fatalf("unit runs=%d, want none before readiness", unitRuns)
	}
}

// TestRunServiceUnreadyExit124 requires a readiness probe exiting nonzero
// to stop the run with 124: probe exit statuses are data, never success.
func TestRunServiceUnreadyExit124(t *testing.T) {
	fake := &scriptedRuntime{run: func(invoke containerplan.Invocation, _ []byte) (application.Execution, error) {
		if len(invoke.Args) > 0 && invoke.Args[0] == "exec" {
			return application.Execution{Exit: 1}, nil
		}
		return application.Execution{Exit: 0}, nil
	}}
	clock := &serviceClock{now: time.Now()}
	req := withServiceClock(baseRunRequest(runContent(serviceCourse()), fake), clock)
	_, err := application.Run(context.Background(), req)
	if finding.ExitCode(err) != 124 {
		t.Fatalf("exit=%d, want 124", finding.ExitCode(err))
	}
	for _, call := range fake.calls {
		if containsImageRun(call.invoke.Args) {
			t.Fatalf("unit ran before readiness (argv=%q)", call.invoke.Args)
		}
	}
}

// TestRunEnvErrorStopsAtOnce requires an environment failure to stop the
// command keeping earlier findings: usage outranks it, it outranks negative
// results, and later courses never run.
func TestRunEnvErrorStopsAtOnce(t *testing.T) {
	content := runContent(map[string]string{
		"aaa/learning/code/ex-01-hello/run.yaml":                 validRunSpec,
		"aaa/learning/code/ex-01-hello/example.py":               "print('hello')\n",
		"aaa/learning/code/ex-01-hello/expected/main.stdout.txt": "hello\n",
		"bbb/learning/code/ex-01-query/run.yaml":                 serviceCourse()["demo/learning/code/ex-01-query/run.yaml"],
		"bbb/learning/code/ex-01-query/query.py":                 "print('one row')\n",
		"bbb/learning/code/ex-01-query/expected/main.stdout.txt": "one row\n",
		"ccc/learning/code/ex-01-hello/run.yaml":                 validRunSpec,
		"ccc/learning/code/ex-01-hello/example.py":               "print('hello')\n",
		"ccc/learning/code/ex-01-hello/expected/main.stdout.txt": "hello\n",
	})
	fake := &scriptedRuntime{run: func(invoke containerplan.Invocation, _ []byte) (application.Execution, error) {
		if len(invoke.Args) > 0 && invoke.Args[0] == "exec" {
			return application.Execution{}, errProbeRefused
		}
		if containsImageRun(invoke.Args) {
			return application.Execution{Exit: 3, Stdout: "hello\n"}, nil
		}
		return application.Execution{Exit: 0}, nil
	}}
	clock := &serviceClock{now: time.Now()}
	req := withServiceClock(application.RunRequest{
		Content: content,
		Catalog: testCatalog(),
		Courses: []string{"aaa", "bbb", "ccc"},
		Runtime: fake,
		RunID:   "test-run-1",
	}, clock)
	report, err := application.Run(context.Background(), req)
	if finding.ExitCode(err) != 124 {
		t.Fatalf("exit=%d, want 124", finding.ExitCode(err))
	}
	requireFinding(t, report, application.CodeExitMismatch, "expected exit 0", "actual 3")
	for _, call := range fake.calls {
		if strings.Contains(strings.Join(call.invoke.Args, " "), "ccc") {
			t.Fatalf("third course ran after the environment failure (argv=%q)", call.invoke.Args)
		}
	}
}

// TestRunUnknownServiceDataDir requires a catalog service without a pinned
// data folder to exit 2.
func TestRunUnknownServiceDataDir(t *testing.T) {
	cat := testCatalog()
	entries := append([]catalog.Toolchain(nil), cat.Toolchains...)
	redis := entries[0]
	redis.ID = "redis"
	redis.Ready = []string{"redis-cli", "ping"}
	redis.ReadyTimeout = "5s"
	redis.Connect = map[string]string{"REDIS": "redis"}
	entries = append(entries, redis)
	cat.Toolchains = entries
	content := runContent(map[string]string{
		"demo/learning/code/ex-01-cache/run.yaml": `schema: ayokoding.run/v1
toolchain: python
services: [redis]
runs:
  - name: main
    command: [python3, cache.py]
    expect:
      exit: 0
      stdout: expected/main.stdout.txt
`,
		"demo/learning/code/ex-01-cache/cache.py":                 "print('cached')\n",
		"demo/learning/code/ex-01-cache/expected/main.stdout.txt": "cached\n",
	})
	fake := &scriptedRuntime{run: okExecution("cached\n")}
	req := baseRunRequest(content, fake)
	req.Catalog = cat
	_, err := application.Run(context.Background(), req)
	coded, ok := errors.AsType[*finding.Error](err)
	if !ok || coded.Code != finding.UsageInvalidArguments {
		t.Fatalf("err=%v, want the invalid-arguments usage error", err)
	}
}

// TestRunBadReadyTimeoutRequiresUsage requires an unparsable service
// readyTimeout to exit 2.
func TestRunBadReadyTimeoutRequiresUsage(t *testing.T) {
	cat := testCatalog()
	for index, entry := range cat.Toolchains {
		if entry.ID == "postgres" {
			entry.ReadyTimeout = "bogus"
			cat.Toolchains[index] = entry
		}
	}
	fake := &scriptedRuntime{run: okExecution("one row\n")}
	req := baseRunRequest(runContent(serviceCourse()), fake)
	req.Catalog = cat
	_, err := application.Run(context.Background(), req)
	coded, ok := errors.AsType[*finding.Error](err)
	if !ok || coded.Code != finding.UsageInvalidArguments {
		t.Fatalf("err=%v, want the invalid-arguments usage error", err)
	}
}

// TestRunServicePullFailure requires a refused service image pull to stop
// the run with its environment status.
func TestRunServicePullFailure(t *testing.T) {
	fake := &scriptedRuntime{
		run:     okExecution("one row\n"),
		pullErr: &finding.Error{Code: finding.EnvRuntimeRefused, Message: "pull failed"},
	}
	clock := &serviceClock{now: time.Now()}
	req := withServiceClock(baseRunRequest(runContent(serviceCourse()), fake), clock)
	_, err := application.Run(context.Background(), req)
	if finding.ExitCode(err) != 125 {
		t.Fatalf("exit=%d, want 125", finding.ExitCode(err))
	}
}

// TestRunSecondExecutionTimeout requires a second execution exceeding its
// timeout to fail as a timed-out result.
func TestRunSecondExecutionTimeout(t *testing.T) {
	calls := 0
	fake := &scriptedRuntime{run: func(containerplan.Invocation, []byte) (application.Execution, error) {
		calls++
		if calls == 1 {
			return application.Execution{Exit: 0, Stdout: "hello\n"}, nil
		}
		return application.Execution{TimedOut: true}, nil
	}}
	report, err := application.Run(context.Background(), baseRunRequest(helloCourse(), fake))
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	requireFinding(t, report, application.CodeRunTimeout, "main")
}

// TestRunServiceStartFailurePropagates requires a refused service start to
// stop the run with its environment status.
func TestRunServiceStartFailurePropagates(t *testing.T) {
	refused := &finding.Error{Code: finding.EnvRuntimeRefused, Message: "daemon hiccup"}
	fake := &scriptedRuntime{run: func(invoke containerplan.Invocation, _ []byte) (application.Execution, error) {
		if slices.Contains(invoke.Args, "--network-alias") {
			return application.Execution{}, refused
		}
		return application.Execution{Exit: 0}, nil
	}}
	clock := &serviceClock{now: time.Now()}
	req := withServiceClock(baseRunRequest(runContent(serviceCourse()), fake), clock)
	_, err := application.Run(context.Background(), req)
	if finding.ExitCode(err) != 125 {
		t.Fatalf("exit=%d, want 125", finding.ExitCode(err))
	}
}
