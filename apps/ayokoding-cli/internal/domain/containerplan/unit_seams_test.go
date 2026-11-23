package containerplan_test

import (
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/containerplan"
)

// TestServiceStartSortsEnvironment requires two variables to render in
// name order.
func TestServiceStartSortsEnvironment(t *testing.T) {
	cfg := baseServiceConfig()
	cfg.Env = map[string]string{"ZULU": "z", "ALPHA": "a"}
	invoke := containerplan.ServiceStart(cfg)
	joined := strings.Join(invoke.Args, " ")
	alpha := strings.Index(joined, "ALPHA=a")
	zulu := strings.Index(joined, "ZULU=z")
	if alpha < 0 || zulu < 0 || alpha > zulu {
		t.Fatalf("argv=%q, want ALPHA before ZULU", joined)
	}
}
