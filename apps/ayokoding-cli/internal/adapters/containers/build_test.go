package containers_test

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/adapters/containers"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/catalog"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/containerplan"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// baseRef pins the node base the typescript recipe builds from.
const baseRef = "docker.io/library/node:24@sha256:14078204b6bb268c107ceff6d3c43f45a888105e5c2b18b14c32b3409d93a1b0"

// dockerfile is the smallest recipe under test.
const dockerfile = "FROM docker.io/library/node:24@sha256:14078204b6bb268c107ceff6d3c43f45a888105e5c2b18b14c32b3409d93a1b0\nRUN npm install\n"

// recorded captures one stubbed container CLI call.
type recorded struct {
	cli  string
	args []string
}

// errExecFailed stands in for a failed container CLI call.
var errExecFailed = errors.New("exit status 1")

// TestBuildDerived_recordsArgvAndReturnsTag proves the adapter materializes
// the planned context and executes its exact argv.
func TestBuildDerived_recordsArgvAndReturnsTag(t *testing.T) {
	var calls []recorded
	builder := containers.Builder{
		Exec: func(_ context.Context, cli string, args []string) (string, error) {
			calls = append(calls, recorded{cli: cli, args: append([]string(nil), args...)})
			return "built", nil
		},
	}
	settings := containerplan.Settings{ContainerCLI: "docker", CacheDir: ""}
	tag, err := builder.BuildDerived(context.Background(), settings, t.TempDir(), "typescript", baseRef, []byte(dockerfile), nil)
	if err != nil {
		t.Fatalf("build derived image: %v", err)
	}
	if !strings.HasPrefix(tag, "ayokoding-toolchain/typescript:") {
		t.Fatalf("tag=%q", tag)
	}
	if len(calls) != 1 {
		t.Fatalf("exec calls=%d, want 1", len(calls))
	}
	got := calls[0]
	if got.cli != "docker" {
		t.Fatalf("cli=%q, want docker", got.cli)
	}
	argv := strings.Join(got.args, " ")
	contextDir := got.args[len(got.args)-1]
	for _, want := range []string{"buildx build --load", "--tag " + tag, "--file " + filepath.Join(contextDir, "Dockerfile")} {
		if !strings.Contains(argv, want) {
			t.Fatalf("argv=%q, want %q", argv, want)
		}
	}
	content, err := os.ReadFile(filepath.Join(contextDir, "Dockerfile"))
	if err != nil {
		t.Fatalf("read materialized Dockerfile: %v", err)
	}
	if string(content) != dockerfile {
		t.Fatalf("materialized Dockerfile=%q", content)
	}
}

// TestBuildDerived_failureKeepsLast40LogLines proves the closed error body.
func TestBuildDerived_failureKeepsLast40LogLines(t *testing.T) {
	var lines []string
	for i := 1; i <= 50; i++ {
		lines = append(lines, fmt.Sprintf("log-line-%02d", i))
	}
	builder := containers.Builder{
		Exec: func(_ context.Context, _ string, _ []string) (string, error) {
			return strings.Join(lines, "\n") + "\n", errExecFailed
		},
	}
	settings := containerplan.Settings{ContainerCLI: "docker", CacheDir: ""}
	_, err := builder.BuildDerived(context.Background(), settings, t.TempDir(), "typescript", baseRef, []byte(dockerfile), nil)
	if err == nil {
		t.Fatalf("failed build returned no error")
	}
	var coded *finding.Error
	if !errors.As(err, &coded) {
		t.Fatalf("error type=%T, want *finding.Error", err)
	}
	if coded.Code != "ayokoding.examples.env-build-failed" {
		t.Fatalf("code=%q", coded.Code)
	}
	if !strings.Contains(coded.Message, "log-line-50") || !strings.Contains(coded.Message, "log-line-11") {
		t.Fatalf("message keeps the wrong window:\n%s", coded.Message)
	}
	if strings.Contains(coded.Message, "log-line-10") {
		t.Fatalf("message leaks beyond 40 lines:\n%s", coded.Message)
	}
}

// TestBuildDerived_rejectsUnpinnedBase surfaces the planner refusal.
func TestBuildDerived_rejectsUnpinnedBase(t *testing.T) {
	builder := containers.Builder{
		Exec: func(_ context.Context, _ string, _ []string) (string, error) {
			return "", nil
		},
	}
	settings := containerplan.Settings{ContainerCLI: "docker", CacheDir: ""}
	if _, err := builder.BuildDerived(context.Background(), settings, t.TempDir(), "typescript", "docker.io/library/node:24", []byte(dockerfile), nil); err == nil {
		t.Fatalf("unpinned base built without an error")
	}
}

// TestBuildDerived_contextFailure reports an unusable context parent.
func TestBuildDerived_contextFailure(t *testing.T) {
	parent := filepath.Join(t.TempDir(), "file")
	if err := os.WriteFile(parent, []byte("x"), 0o600); err != nil {
		t.Fatalf("write parent file: %v", err)
	}
	builder := containers.Builder{
		Exec: func(_ context.Context, _ string, _ []string) (string, error) {
			return "", nil
		},
	}
	settings := containerplan.Settings{ContainerCLI: "docker", CacheDir: ""}
	if _, err := builder.BuildDerived(context.Background(), settings, filepath.Join(parent, "child"), "typescript", baseRef, []byte(dockerfile), nil); err == nil {
		t.Fatalf("unusable context built without an error")
	}
}

// TestBuildEnvironment_writesLockfile proves the D9 recipe reaches the build.
func TestBuildEnvironment_writesLockfile(t *testing.T) {
	var calls []recorded
	builder := containers.Builder{
		Exec: func(_ context.Context, cli string, args []string) (string, error) {
			calls = append(calls, recorded{cli: cli, args: append([]string(nil), args...)})
			return "built", nil
		},
	}
	settings := containerplan.Settings{ContainerCLI: "docker", CacheDir: ""}
	lockfile := []byte("psycopg==3.2.1\n")
	image := "docker.io/library/python:3.15@sha256:e748956ccf3f50c9555f236753bbcd5f430d3937e665d3bd6922dd0e6e591a24"
	install := catalog.Install{
		Lockfiles: []string{"requirements.lock"},
		Command:   []string{"pip", "install", "-r", "/deps/lock/requirements.lock"},
		Env:       map[string]string{"PYTHONPATH": "/deps/python"},
	}
	tag, err := builder.BuildEnvironment(context.Background(), settings, t.TempDir(), "python", image, "requirements.lock", lockfile, install)
	if err != nil {
		t.Fatalf("build environment image: %v", err)
	}
	if !strings.HasPrefix(tag, "ayokoding-env/python:") {
		t.Fatalf("tag=%q", tag)
	}
	if len(calls) != 1 {
		t.Fatalf("exec calls=%d, want 1", len(calls))
	}
	contextDir := calls[0].args[len(calls[0].args)-1]
	content, err := os.ReadFile(filepath.Join(contextDir, "requirements.lock"))
	if err != nil {
		t.Fatalf("read materialized lockfile: %v", err)
	}
	if string(content) != string(lockfile) {
		t.Fatalf("materialized lockfile=%q", content)
	}
	rendered, err := os.ReadFile(filepath.Join(contextDir, "Dockerfile"))
	if err != nil {
		t.Fatalf("read materialized Dockerfile: %v", err)
	}
	if !strings.Contains(string(rendered), "COPY requirements.lock /deps/lock/requirements.lock") {
		t.Fatalf("materialized Dockerfile:\n%s", rendered)
	}
}

// TestPresent_reportsInspection proves the presence probe both ways.
func TestPresent_reportsInspection(t *testing.T) {
	present := containers.Builder{
		Exec: func(_ context.Context, _ string, _ []string) (string, error) {
			return "{}", nil
		},
	}
	if !present.Present(context.Background(), "docker", "img:tag") {
		t.Fatalf("inspected image reported missing")
	}
	missing := containers.Builder{
		Exec: func(_ context.Context, _ string, _ []string) (string, error) {
			return "", errExecFailed
		},
	}
	if missing.Present(context.Background(), "docker", "img:tag") {
		t.Fatalf("missing image reported present")
	}
}
