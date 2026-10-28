package cli_test

import (
	"bytes"
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/adapters/cli"
)

// buildImagesDocument is the machine-readable build payload.
type buildImagesDocument struct {
	SchemaVersion int `json:"schemaVersion"`
	Images        []struct {
		ID  string `json:"id"`
		Tag string `json:"tag"`
	} `json:"images"`
}

// fakeContainerCLI writes a shell script that logs its argv to the log file
// and exits with the status: it stands in for the container runtime, so no
// test needs Podman. The embedded catalog carries the recipes, so the tests
// need no --catalog flag.
func fakeContainerCLI(t *testing.T, status int) string {
	t.Helper()
	dir := t.TempDir()
	log := filepath.Join(dir, "argv.log")
	script := filepath.Join(dir, "container-cli")
	body := "#!/bin/sh\necho \"$@\" >> '" + log + "'\n"
	body += "if [ \"$1\" = info ]; then echo '{\"host\":{\"security\":{\"rootless\":true}}}'; exit 0; fi\n"
	if status != 0 {
		body += "echo boom\nexit 1\n"
	}
	if err := os.WriteFile(script, []byte(body), 0o700); err != nil {
		t.Fatalf("write fake container CLI: %v", err)
	}
	t.Setenv("AYOKODING_CONTAINER_CLI", script)
	return log
}

// builtTag matches one printed id and content-hash tag line.
var builtTag = regexp.MustCompile(`^typescript ayokoding-toolchain/typescript:[0-9a-f]{64}` + "\n$")

// catalogTypescriptTag is the embedded catalog tag for typescript: the build
// must reproduce it byte for byte, proving the tag hashes the recipe.
const catalogTypescriptTag = "ayokoding-toolchain/typescript:b7c9c03f556ecef1da8571cb3ddceb9697254b8d4b0a473b73672eb4821bdd14"

// TestBuildPrintsIDAndTag requires a derived toolchain to build and print
// its id and tag.
func TestBuildPrintsIDAndTag(t *testing.T) {
	log := fakeContainerCLI(t, 0)
	args := []string{"toolchains", "build", "typescript"}
	var stdout, stderr bytes.Buffer
	status := cli.Execute(context.Background(), args, cli.Options{Stdout: &stdout, Stderr: &stderr})
	if status != 0 {
		t.Fatalf("status=%d, want 0 (stdout=%q stderr=%q)", status, stdout.String(), stderr.String())
	}
	if !builtTag.MatchString(stdout.String()) {
		t.Fatalf("stdout=%q, want one id and content-hash tag line", stdout.String())
	}
	if strings.TrimSpace(stdout.String()) != "typescript "+catalogTypescriptTag {
		t.Fatalf("stdout=%q, want the catalog tag", stdout.String())
	}
	argv, err := os.ReadFile(log)
	if err != nil {
		t.Fatalf("read argv log: %v", err)
	}
	if !strings.Contains(string(argv), "build --layers --format docker --tag ayokoding-toolchain/typescript:") {
		t.Fatalf("argv=%q, want the derived build shape", argv)
	}
}

// TestBuildUnknownIDIsUsageError requires an unknown toolchain id to exit 2.
func TestBuildUnknownIDIsUsageError(t *testing.T) {
	fakeContainerCLI(t, 0)
	args := []string{"toolchains", "build", "zeta"}
	var stdout, stderr bytes.Buffer
	status := cli.Execute(context.Background(), args, cli.Options{Stdout: &stdout, Stderr: &stderr})
	if status != 2 {
		t.Fatalf("status=%d, want 2 (stdout=%q stderr=%q)", status, stdout.String(), stderr.String())
	}
	if !strings.Contains(stderr.String(), "ayokoding.usage.invalid-arguments") {
		t.Fatalf("stderr missing usage code (stderr=%q)", stderr.String())
	}
}

// TestBuildOfficialImageIsUsageError requires an entry without a Dockerfile
// recipe to exit 2.
func TestBuildOfficialImageIsUsageError(t *testing.T) {
	fakeContainerCLI(t, 0)
	args := []string{"toolchains", "build", "python"}
	var stdout, stderr bytes.Buffer
	status := cli.Execute(context.Background(), args, cli.Options{Stdout: &stdout, Stderr: &stderr})
	if status != 2 {
		t.Fatalf("status=%d, want 2 (stdout=%q stderr=%q)", status, stdout.String(), stderr.String())
	}
	if !strings.Contains(stderr.String(), "ayokoding.usage.invalid-arguments") {
		t.Fatalf("stderr missing usage code (stderr=%q)", stderr.String())
	}
}

// TestBuildWithoutIDsIsUsageError requires a build with no ids to exit 2.
func TestBuildWithoutIDsIsUsageError(t *testing.T) {
	fakeContainerCLI(t, 0)
	args := []string{"toolchains", "build"}
	var stdout, stderr bytes.Buffer
	status := cli.Execute(context.Background(), args, cli.Options{Stdout: &stdout, Stderr: &stderr})
	if status != 2 {
		t.Fatalf("status=%d, want 2 (stdout=%q stderr=%q)", status, stdout.String(), stderr.String())
	}
	if !strings.Contains(stderr.String(), "ayokoding.usage.missing-selection") {
		t.Fatalf("stderr missing usage code (stderr=%q)", stderr.String())
	}
}

// TestBuildFailureRendersCodedError requires a failed build to exit 2
// naming the closed build code.
func TestBuildFailureRendersCodedError(t *testing.T) {
	fakeContainerCLI(t, 1)
	args := []string{"toolchains", "build", "typescript"}
	var stdout, stderr bytes.Buffer
	status := cli.Execute(context.Background(), args, cli.Options{Stdout: &stdout, Stderr: &stderr})
	if status != 2 {
		t.Fatalf("status=%d, want 2 (stdout=%q stderr=%q)", status, stdout.String(), stderr.String())
	}
	if !strings.Contains(stderr.String(), "ayokoding.examples.env-build-failed") {
		t.Fatalf("stderr missing build code (stderr=%q)", stderr.String())
	}
}

// TestBuildJSONShape requires the JSON payload to carry id and tag per
// built image.
func TestBuildJSONShape(t *testing.T) {
	fakeContainerCLI(t, 0)
	args := []string{"toolchains", "build", "typescript", "--output", "json"}
	var stdout, stderr bytes.Buffer
	status := cli.Execute(context.Background(), args, cli.Options{Stdout: &stdout, Stderr: &stderr})
	if status != 0 {
		t.Fatalf("status=%d, want 0 (stdout=%q stderr=%q)", status, stdout.String(), stderr.String())
	}
	var body buildImagesDocument
	if err := json.Unmarshal(bytes.TrimSpace(stdout.Bytes()), &body); err != nil {
		t.Fatalf("stdout is not one JSON document: %v (stdout=%q)", err, stdout.String())
	}
	if body.SchemaVersion != 1 || len(body.Images) != 1 {
		t.Fatalf("body=%+v, want one built image", body)
	}
	if body.Images[0].ID != "typescript" || !strings.HasPrefix(body.Images[0].Tag, "ayokoding-toolchain/typescript:") {
		t.Fatalf("image=%+v, want typescript id and tag", body.Images[0])
	}
}
