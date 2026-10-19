package containers_test

import (
	"context"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/adapters/containers"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/containerplan"
)

// TestRun_ForwardsStdinToContainer proves the run input reaches the
// container CLI: the run contract feeds the stdin file to standard input,
// so dropping it starves every stdin run of its input.
func TestRun_ForwardsStdinToContainer(t *testing.T) {
	var got []byte
	runtime := &containers.Runtime{Exec: func(_ context.Context, _ string, _ []string, stdin []byte) (string, error) {
		got = stdin
		return "", nil
	}}
	_, err := runtime.Run(context.Background(), containerplan.Invocation{
		Binary: "ignored",
		Args:   []string{"run", "--interactive", "img", "cat"},
	}, []byte("typed\n"))
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	if string(got) != "typed\n" {
		t.Fatalf("stdin=%q, want the run input bytes", got)
	}
}
