package toolchains_test

import (
	"bytes"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/toolchains"
)

// TestBytesCarriesTheEmbeddedCatalog requires the version hash input to be
// the pinned catalog, never empty.
func TestBytesCarriesTheEmbeddedCatalog(t *testing.T) {
	data := toolchains.Bytes()
	if len(data) == 0 {
		t.Fatal("Bytes empty, want the embedded catalog")
	}
	if !bytes.Contains(data, []byte("schema: ayokoding.toolchains/v1")) {
		t.Fatalf("Bytes misses the catalog schema marker (%d bytes)", len(data))
	}
}
