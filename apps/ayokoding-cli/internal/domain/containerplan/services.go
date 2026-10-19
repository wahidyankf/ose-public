package containerplan

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"sort"
	"time"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// readyPollInterval spaces service readiness probes, per tech-docs/005.
const readyPollInterval = 500 * time.Millisecond

// ServiceConfig carries one service start plan: the container identity,
// the shared internal network, the pinned image, the tmpfs data folder,
// and the catalog service variables.
type ServiceConfig struct {
	CLI       string
	Name      string
	RunID     string
	ServiceID string
	Network   string
	Image     string
	DataDir   string
	Env       map[string]string
}

// NetworkName names the per-unit internal network: no route out, deleted
// after the unit.
func NetworkName(runID, unit string) string {
	sum := sha256.Sum256([]byte(unit))
	return "ayokoding-" + runID + "-" + hex.EncodeToString(sum[:])[:8]
}

// NetworkCreate plans the internal network creation, labelled with the run
// so the leftover sweep finds it.
func NetworkCreate(cli, name, runID string) Invocation {
	return Invocation{
		Binary: cli,
		Args: []string{
			"network", "create",
			"--internal",
			labelFlag, "ayokoding.run=" + runID,
			name,
		},
	}
}

// ServiceStart plans one detached service start on the unit network: the
// service name, the run label, the network alias the unit reaches it by, a
// tmpfs data folder, and the sorted catalog variables.
func ServiceStart(cfg ServiceConfig) Invocation {
	argv := []string{
		"run", "-d",
		"--name", cfg.Name,
		labelFlag, "ayokoding.run=" + cfg.RunID,
		"--network", cfg.Network,
		"--network-alias", cfg.ServiceID,
		"--tmpfs", cfg.DataDir + ":rw,nosuid",
	}
	for _, variable := range sortedEnv(cfg.Env) {
		argv = append(argv, "--env", variable.Key+"="+variable.Value)
	}
	return Invocation{Binary: cfg.CLI, Args: append(argv, cfg.Image)}
}

// Cleanup plans the teardown in removal order: every service container
// with rm -f first, then the network.
func Cleanup(cli string, containers []string, network string) []Invocation {
	remove := append([]string{"rm", "-f"}, containers...)
	return []Invocation{
		{Binary: cli, Args: remove},
		{Binary: cli, Args: []string{"network", "rm", network}},
	}
}

// PollReady polls one service readiness probe every 500 ms until it
// succeeds or readyTimeout elapses. Elapsing is the environment error
// ayokoding.env.service-not-ready (exit 124). The clock and sleep are
// parameters so tests prove the bound over a fake clock; production passes
// time.Now and time.Sleep.
func PollReady(ctx context.Context, service string, timeout time.Duration, now func() time.Time, sleep func(time.Duration), probe func(context.Context) error) error {
	deadline := now().Add(timeout)
	for {
		if err := ctx.Err(); err != nil {
			return fmt.Errorf("containerplan: poll service %q: %w", service, err)
		}
		if err := probe(ctx); err == nil {
			return nil
		} else if !now().Before(deadline) {
			return &finding.Error{
				Code:    finding.EnvServiceUnready,
				Message: "service " + service + " not ready within " + timeout.String(),
			}
		}
		sleep(readyPollInterval)
	}
}

// sortedEnv orders environment variables by name for stable argv.
func sortedEnv(env map[string]string) []EnvVar {
	ordered := make([]EnvVar, 0, len(env))
	for key, value := range env {
		ordered = append(ordered, EnvVar{Key: key, Value: value})
	}
	sort.Slice(ordered, func(i, j int) bool { return ordered[i].Key < ordered[j].Key })
	return ordered
}
