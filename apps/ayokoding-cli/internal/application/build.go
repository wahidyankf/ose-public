package application

import (
	"context"
	"errors"
	"fmt"
	"io/fs"
	"strings"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/catalog"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/containerplan"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// ImageBuilder builds one derived image from its embedded Dockerfile and
// returns its content-hash tag. The containers adapter implements it; tests
// carry a stub, so no test needs a container runtime.
type ImageBuilder interface {
	BuildDerived(ctx context.Context, settings containerplan.Settings, contextParent, toolID, baseRef string, dockerfile []byte, args []string) (string, error)
}

// BuildRequest names the derived images to build. Files carries the
// embedded toolchain files holding each Dockerfile recipe, and Builder
// executes the planned builds.
type BuildRequest struct {
	Catalog       catalog.Catalog
	Files         fs.FS
	IDs           []string
	Builder       ImageBuilder
	Settings      containerplan.Settings
	ContextParent string
}

// BuiltImage is one built image: the toolchain id and its content-hash tag.
type BuiltImage struct {
	ID  string
	Tag string
}

// errNoBaseDigest reports a Dockerfile recipe without a pinned base.
var errNoBaseDigest = errors.New("application: recipe pins no base digest")

// Build builds every named derived image in order and returns one id and
// tag per build. A build failure carries the closed environment-build code
// with the last 40 log lines.
func Build(ctx context.Context, req BuildRequest) ([]BuiltImage, error) {
	if len(req.IDs) == 0 {
		return nil, &finding.Error{
			Code:    finding.UsageMissingSelection,
			Message: "one or more toolchain IDs are required",
		}
	}
	built := make([]BuiltImage, 0, len(req.IDs))
	for _, id := range req.IDs {
		tag, err := buildOne(ctx, req, id)
		if err != nil {
			return nil, err
		}
		built = append(built, BuiltImage{ID: id, Tag: tag})
	}
	return built, nil
}

// buildOne builds one derived image from its embedded Dockerfile recipe.
// The catalog base reference stays digest-pinned end to end: the plan hashes
// its digest into the tag, so no suffix is ever stripped here. A catalog
// platform reaches the planned build, so x64-only recipes build their own
// architecture on every host.
func buildOne(ctx context.Context, req BuildRequest, toolID string) (string, error) {
	entry, found := req.Catalog.Lookup(toolID)
	if !found {
		return "", &finding.Error{
			Code:    finding.UsageInvalidArguments,
			Message: "toolchain " + toolID + " does not exist",
		}
	}
	if entry.Build == "" {
		return "", &finding.Error{
			Code:    finding.UsageInvalidArguments,
			Message: "toolchain " + toolID + " builds no image",
		}
	}
	dockerfile, err := fs.ReadFile(req.Files, entry.Build)
	if err != nil {
		return "", fmt.Errorf("application: read recipe for %s: %w", toolID, err)
	}
	base, ok := baseReference(dockerfile)
	if !ok {
		return "", fmt.Errorf("%w: %s", errNoBaseDigest, toolID)
	}
	settings := req.Settings
	settings.Platform = entry.Platform
	tag, err := req.Builder.BuildDerived(ctx, settings, req.ContextParent, toolID, base, dockerfile, nil)
	if err != nil {
		return "", fmt.Errorf("application: build %s: %w", toolID, err)
	}
	return tag, nil
}

// baseReference returns the pinned base reference of the final FROM stage.
// The tag hashes this reference's digest, so the image the Dockerfile builds
// FROM names the tag it produces. It mirrors the recipe-tag test: the last
// FROM line naming a reference wins, and stageless bases such as scratch
// keep the previous pinned one.
func baseReference(recipe []byte) (string, bool) {
	var base string
	var found bool
	for line := range strings.SplitSeq(string(recipe), "\n") {
		fields := strings.Fields(line)
		if len(fields) < 2 || fields[0] != "FROM" {
			continue
		}
		if strings.LastIndex(fields[1], "@") < 0 {
			continue
		}
		base, found = fields[1], true
	}
	return base, found
}
