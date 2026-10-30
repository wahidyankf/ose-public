package shareddata_test

import (
	"os"
	"path/filepath"
	"runtime"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/tools/shareddata"
)

// libraryRoot resolves the canonical libs/ayokoding-data tree from this
// package's location so the drift check works in any checkout layout.
func libraryRoot(t *testing.T) string {
	t.Helper()
	_, file, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("runtime caller unavailable")
	}
	root := filepath.Join(filepath.Dir(file), "..", "..", "..", "..", "..", "libs", "ayokoding-data", "data")
	info, err := os.Stat(root)
	if err != nil || !info.IsDir() {
		t.Fatalf("canonical shared data missing at %s: %v", root, err)
	}
	return root
}

func TestEmbeddedMatchesSource(t *testing.T) {
	root := libraryRoot(t)
	cases := map[string]func() ([]byte, error){
		"ai-benchmark.json":   shareddata.Benchmark,
		"cost-of-living.json": shareddata.CostOfLiving,
		"fx.json":             shareddata.Fx,
	}
	for name, load := range cases {
		embedded, err := load()
		if err != nil {
			t.Fatalf("embedded %s unreadable: %v (run the build:assets target to copy it)", name, err)
		}
		if len(embedded) == 0 {
			t.Fatalf("embedded %s is empty", name)
		}
		canonical, err := os.ReadFile(filepath.Join(root, name))
		if err != nil {
			t.Fatalf("canonical %s unreadable: %v", name, err)
		}
		if string(embedded) != string(canonical) {
			t.Fatalf("embedded %s drifts from libs/ayokoding-data/data/%s; re-run build:assets", name, name)
		}
	}
}
