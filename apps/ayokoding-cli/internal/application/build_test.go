package application_test

import (
	"context"
	"errors"
	"testing"
	"testing/fstest"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/application"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/catalog"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/containerplan"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// buildCall records one stubbed derived build.
type buildCall struct {
	toolID     string
	baseRef    string
	dockerfile []byte
}

// stubBuilder stands in for the container runtime: it records every build
// and returns one tag per id, or a fixed failure.
type stubBuilder struct {
	calls []buildCall
	fail  error
}

// BuildDerived records the build and returns the content-hash tag.
func (s *stubBuilder) BuildDerived(_ context.Context, _ containerplan.Settings, _, toolID, baseRef string, dockerfile []byte, _ []string) (string, error) {
	if s.fail != nil {
		return "", s.fail
	}
	s.calls = append(s.calls, buildCall{toolID: toolID, baseRef: baseRef, dockerfile: dockerfile})
	return "ayokoding-toolchain/" + toolID + ":testtag", nil
}

// buildCatalog is one derived and one official entry with complete literals,
// as the exhaustruct rule for catalog.Toolchain requires.
func buildCatalog() catalog.Catalog {
	return catalog.Catalog{Toolchains: []catalog.Toolchain{
		{
			ID:           "typescript",
			Kind:         catalog.KindLanguage,
			Version:      "7.0.2",
			Image:        "ayokoding-toolchain/typescript:testtag@sha256:0000000000000000000000000000000000000000000000000000000000000000",
			Env:          nil,
			Install:      catalog.Install{},
			Build:        "typescript/Dockerfile",
			Platform:     "",
			Ready:        nil,
			ReadyTimeout: "",
			Connect:      nil,
		},
		{
			ID:           "python",
			Kind:         catalog.KindLanguage,
			Version:      "3.15.0",
			Image:        "docker.io/library/python:3.15.0@sha256:e748956ccf3f50c9555f236753bbcd5f430d3937e665d3bd6922dd0e6e591a24",
			Env:          nil,
			Install:      catalog.Install{},
			Build:        "",
			Platform:     "",
			Ready:        nil,
			ReadyTimeout: "",
			Connect:      nil,
		},
	}}
}

// buildFiles holds the one Dockerfile recipe the derived entry names.
func buildFiles() fstest.MapFS {
	return fstest.MapFS{
		"typescript/Dockerfile": {Data: []byte("FROM docker.io/library/node:24@sha256:14078204b6bb268c107ceff6d3c43f45a888105e5c2b18b14c32b3409d93a1b0\n")},
	}
}

// TestBuildBuildsDerivedInOrder requires every named derived image to build
// with its pinned base reference and recipe bytes.
func TestBuildBuildsDerivedInOrder(t *testing.T) {
	stub := &stubBuilder{}
	built, err := application.Build(context.Background(), application.BuildRequest{
		Catalog: buildCatalog(),
		Files:   buildFiles(),
		IDs:     []string{"typescript"},
		Builder: stub,
	})
	if err != nil {
		t.Fatalf("Build=%v, want nil", err)
	}
	if len(built) != 1 || built[0].ID != "typescript" || built[0].Tag != "ayokoding-toolchain/typescript:testtag" {
		t.Fatalf("built=%+v, want one typescript tag", built)
	}
	if len(stub.calls) != 1 {
		t.Fatalf("calls=%+v, want one build", stub.calls)
	}
	call := stub.calls[0]
	if call.baseRef != "docker.io/library/node:24@sha256:14078204b6bb268c107ceff6d3c43f45a888105e5c2b18b14c32b3409d93a1b0" {
		t.Fatalf("baseRef=%q, want the recipe base, not the derived image", call.baseRef)
	}
	if string(call.dockerfile) != "FROM docker.io/library/node:24@sha256:14078204b6bb268c107ceff6d3c43f45a888105e5c2b18b14c32b3409d93a1b0\n" {
		t.Fatalf("dockerfile=%q, want the recipe bytes", call.dockerfile)
	}
}

// TestBuildRequiresIDs requires a build with no ids to be a usage error.
func TestBuildRequiresIDs(t *testing.T) {
	_, err := application.Build(context.Background(), application.BuildRequest{
		Catalog: buildCatalog(),
		Files:   buildFiles(),
		Builder: &stubBuilder{},
	})
	if err == nil {
		t.Fatal("Build succeeded, want missing-selection")
	}
	coded, ok := errors.AsType[*finding.Error](err)
	if !ok {
		t.Fatalf("error=%T, want *finding.Error", err)
	}
	if coded.Code != finding.UsageMissingSelection {
		t.Fatalf("code=%q, want missing-selection", coded.Code)
	}
}

// TestBuildRejectsUnknownID requires an unknown toolchain id to be a usage
// error.
func TestBuildRejectsUnknownID(t *testing.T) {
	_, err := application.Build(context.Background(), application.BuildRequest{
		Catalog: buildCatalog(),
		Files:   buildFiles(),
		IDs:     []string{"zeta"},
		Builder: &stubBuilder{},
	})
	if err == nil {
		t.Fatal("Build succeeded, want invalid-arguments")
	}
	coded, ok := errors.AsType[*finding.Error](err)
	if !ok {
		t.Fatalf("error=%T, want *finding.Error", err)
	}
	if coded.Code != finding.UsageInvalidArguments {
		t.Fatalf("code=%q, want invalid-arguments", coded.Code)
	}
}

// TestBuildRejectsRecipeLessEntry requires an entry without a Dockerfile
// recipe to be a usage error.
func TestBuildRejectsRecipeLessEntry(t *testing.T) {
	_, err := application.Build(context.Background(), application.BuildRequest{
		Catalog: buildCatalog(),
		Files:   buildFiles(),
		IDs:     []string{"python"},
		Builder: &stubBuilder{},
	})
	if err == nil {
		t.Fatal("Build succeeded, want invalid-arguments")
	}
	coded, ok := errors.AsType[*finding.Error](err)
	if !ok {
		t.Fatalf("error=%T, want *finding.Error", err)
	}
	if coded.Code != finding.UsageInvalidArguments {
		t.Fatalf("code=%q, want invalid-arguments", coded.Code)
	}
}

// TestBuildReportsMissingRecipe requires a Dockerfile the files do not
// carry to be a wrapped failure.
func TestBuildReportsMissingRecipe(t *testing.T) {
	_, err := application.Build(context.Background(), application.BuildRequest{
		Catalog: buildCatalog(),
		Files:   fstest.MapFS{},
		IDs:     []string{"typescript"},
		Builder: &stubBuilder{},
	})
	if err == nil {
		t.Fatal("Build succeeded, want a read failure")
	}
	if _, ok := errors.AsType[*finding.Error](err); ok {
		t.Fatalf("error=%v, want a wrapped failure, not a coded one", err)
	}
}

// TestBuildReportsUnpinnedRecipe requires a Dockerfile without a pinned
// base to be a wrapped failure.
func TestBuildReportsUnpinnedRecipe(t *testing.T) {
	_, err := application.Build(context.Background(), application.BuildRequest{
		Catalog: buildCatalog(),
		Files: fstest.MapFS{
			"typescript/Dockerfile": {Data: []byte("FROM scratch\n")},
		},
		IDs:     []string{"typescript"},
		Builder: &stubBuilder{},
	})
	if err == nil {
		t.Fatal("Build succeeded, want a base failure")
	}
	if _, ok := errors.AsType[*finding.Error](err); ok {
		t.Fatalf("error=%v, want a wrapped failure, not a coded one", err)
	}
}

// TestBuildMapsBuilderFailure requires a failed build to surface the
// builder error unchanged.
func TestBuildMapsBuilderFailure(t *testing.T) {
	failure := &finding.Error{Code: "ayokoding.examples.env-build-failed", Message: "build failed: boom"}
	_, err := application.Build(context.Background(), application.BuildRequest{
		Catalog: buildCatalog(),
		Files:   buildFiles(),
		IDs:     []string{"typescript"},
		Builder: &stubBuilder{fail: failure},
	})
	if err == nil {
		t.Fatal("Build succeeded, want the builder failure")
	}
	coded, ok := errors.AsType[*finding.Error](err)
	if !ok {
		t.Fatalf("error=%T, want *finding.Error", err)
	}
	if coded.Code != "ayokoding.examples.env-build-failed" {
		t.Fatalf("code=%q, want the closed build code", coded.Code)
	}
}
