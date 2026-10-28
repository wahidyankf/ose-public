//go:build nativecharter

package bdd_test

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"testing"
	"time"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/adapters/containers"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/containerplan"
)

// TestNativePodmanCharter runs only under the explicitly authorized native charter.
func TestNativePodmanCharter(t *testing.T) {
	for _, environment := range []bool{false, true} {
		scenario := &world{adapter: "e2e", driver: unitDriver{}, env: map[string]string{}}
		err := scenario.nativeStoreJourney(environment)
		t.Logf("environment=%v trace:\n%s", environment, strings.Join(scenario.nativeTrace, "\n"))
		if scenario.syncTemp != "" {
			if cleanupErr := os.RemoveAll(scenario.syncTemp); cleanupErr != nil {
				t.Fatal(cleanupErr)
			}
		}
		if err != nil {
			t.Fatalf("native store environment=%v: %v", environment, err)
		}
		if err := scenario.requireNativeStore(); err != nil {
			t.Fatal(err)
		}
	}
	provider := &world{adapter: "e2e", driver: unitDriver{}, env: map[string]string{}}
	if err := provider.useComposeProvider(); err != nil {
		t.Fatal(err)
	}
	if err := provider.checkComposeProvider(); err != nil {
		t.Fatal(err)
	}
	if err := provider.requireProviderCall(false); err != nil {
		t.Fatal(err)
	}
	if err := os.RemoveAll(provider.syncTemp); err != nil {
		t.Fatal(err)
	}
	t.Log("real provider dispatch passed with competitor unused")
	unreachable := &world{adapter: "e2e", driver: unitDriver{}, env: map[string]string{}}
	defer unreachable.restoreHostEnv()
	if err := unreachable.useNativeUnreachable(); err != nil {
		t.Fatal(err)
	}
	if err := unreachable.runRunCourse(); err != nil {
		t.Fatal(err)
	}
	if err := unreachable.requireStatus(125); err != nil {
		t.Fatal(err)
	}
	if err := unreachable.thenPodman("no workload is created"); err != nil {
		t.Fatal(err)
	}
	if err := unreachable.requireStderrContains("ayokoding.env.container-runtime-unavailable"); err != nil {
		t.Fatal(err)
	}
	if err := os.RemoveAll(unreachable.syncTemp); err != nil {
		t.Fatal(err)
	}
	t.Log("real unavailable connection returned 125 with no workload")
}

func TestNativeMissingTagCharter(t *testing.T) {
	root := t.TempDir()
	binary, err := exec.LookPath((&containers.Runtime{}).ResolveCLI())
	if err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	tag := fmt.Sprintf("ayokoding-env/missing-%d:fixture", time.Now().UnixNano())
	invoke := func(ctx context.Context, _ string, args []string) (string, error) {
		actual, instrumentErr := instrumentNativeArgs(args)
		if instrumentErr != nil {
			return "", instrumentErr
		}
		t.Logf("original argv: %q; actual argv: %q", args, actual)
		output, runErr := exec.CommandContext(ctx, binary, actual...).CombinedOutput()
		if runErr != nil {
			return string(output), fmt.Errorf("native podman: %w", runErr)
		}
		return string(output), nil
	}
	if err := nativeTagAbsent(ctx, binary, tag, invoke); err != nil {
		t.Fatal(err)
	}
	plan := containerplan.PlanRun(containerplan.RunConfig{CLI: binary, RunID: fmt.Sprintf("p1-missing-%d", time.Now().UnixNano()), Image: tag, Command: []string{"python3", "-c", "print('unexpected')"}, Unit: ".", HostDir: root, CPUs: 1, Seq: 1, MemoryBytes: 512 * 1024 * 1024, UID: os.Getuid(), GID: os.Getgid()})
	runtime := &containers.Runtime{Exec: func(ctx context.Context, cli string, args []string, _ []byte) (string, error) {
		return invoke(ctx, cli, args)
	}}
	_, err = runtime.Run(ctx, plan.Invoke, nil)
	if err := requireNativeMissing(err); err != nil {
		t.Fatal(err)
	}
	t.Log("raw native podman exit status: 125")
}
