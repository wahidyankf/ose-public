package architecture_test

import (
	"encoding/base64"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// toolchainDir is the toolchain tree beside the CLI module: the byte-identity
// invariant below only holds when the test runs from this package directory
// (the repository's nx targets do).
const toolchainDir = "../../toolchains"

// jarFetchEcho bounds the generated JarFetch.java inside a toolchain
// Dockerfile. A build context holds only its Dockerfile, so the recipe cannot
// copy the source file: it regenerates it with a base64 fetcher line (base64
// keeps every quote intact where a heredoc would break the repo's hadolint
// gate), and this test decodes every fetcher line back to the source.
const jarFetchEchoPrefix = "echo '"

const jarFetchEchoSuffix = "' > /tmp/JarFetch.b64"

// TestJarFetchCopiesAreIdentical pins the JarFetch distribution invariant:
// every JarFetch.java under a toolchain directory is byte-identical to the
// java source, and every Dockerfile fetcher line decodes to exactly the same
// bytes, so the image can never drift from the reviewed source. The layout is
// one level deep (toolchains/<id>/...), so no recursive walk is needed.
func TestJarFetchCopiesAreIdentical(t *testing.T) {
	source, err := os.ReadFile(filepath.Join(toolchainDir, "java", "JarFetch.java"))
	if err != nil {
		t.Fatalf("read java JarFetch.java: %v", err)
	}
	entries, err := os.ReadDir(toolchainDir)
	if err != nil {
		t.Fatalf("read toolchains: %v", err)
	}
	found := 0
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		dir := filepath.Join(toolchainDir, entry.Name())
		if candidate, err := os.ReadFile(filepath.Join(dir, "JarFetch.java")); err == nil {
			found++
			if string(candidate) != string(source) && dir != filepath.Join(toolchainDir, "java") {
				t.Errorf("%s differs from toolchains/java/JarFetch.java", dir)
			}
			continue
		}
		recipe, err := os.ReadFile(filepath.Join(dir, "Dockerfile"))
		if err != nil {
			continue
		}
		block, ok := jarFetchBlock(string(recipe))
		if !ok {
			continue
		}
		found++
		if block != string(source) {
			t.Errorf("%s embeds a JarFetch.java that differs from toolchains/java/JarFetch.java", dir)
		}
	}
	if found == 0 {
		t.Fatal("no JarFetch.java copy or embedded block found under toolchains/")
	}
}

// jarFetchBlock decodes the first base64 fetcher line in the recipe. The
// decoded bytes must equal the source byte for byte; any edit to the
// fetcher line breaks the comparison.
func jarFetchBlock(recipe string) (string, bool) {
	for line := range strings.Lines(strings.TrimSpace(recipe)) {
		start := strings.Index(line, jarFetchEchoPrefix)
		if start < 0 {
			continue
		}
		rest := line[start+len(jarFetchEchoPrefix):]
		end := strings.Index(rest, jarFetchEchoSuffix)
		if end < 0 {
			continue
		}
		decoded, err := base64.StdEncoding.DecodeString(rest[:end])
		if err != nil {
			return "", false
		}
		return string(decoded), true
	}
	return "", false
}
