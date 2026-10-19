package cli

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os"

	"github.com/spf13/cobra"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/adapters/containers"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/application"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/containerplan"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/toolchains"
)

// runBuild builds the named derived images and prints one id and tag per
// build. The container CLI defaults to docker; AYOKODING_CONTAINER_CLI
// overrides it, and AYOKODING_BUILDX_CACHE adds the local buildx cache
// flags. The context cancels the build, so interrupts stop it.
func runBuild(ctx context.Context, cmd *cobra.Command) error {
	cat, err := loadCatalog(cmd)
	if err != nil {
		return err
	}
	mode, err := flagValue(cmd, "output")
	if err != nil {
		return err
	}
	built, err := application.Build(ctx, application.BuildRequest{
		Catalog: cat,
		Files:   toolchains.Files(),
		IDs:     cmd.Flags().Args(),
		Builder: containers.Builder{},
		Settings: containerplan.Settings{
			ContainerCLI: os.Getenv("AYOKODING_CONTAINER_CLI"),
			CacheDir:     os.Getenv("AYOKODING_BUILDX_CACHE"),
		},
	})
	if err != nil {
		return fmt.Errorf("cli: build images: %w", err)
	}
	return renderBuiltImages(cmd.OutOrStdout(), mode, built)
}

// builtImagePayload is one machine-readable built image in field order: id,
// tag.
type builtImagePayload struct {
	ID  string `json:"id"`
	Tag string `json:"tag"`
}

// builtImagesDocument is the machine-readable build payload. It carries no
// durations, timestamps, or absolute paths, so the same inputs give the same
// bytes.
type builtImagesDocument struct {
	SchemaVersion int                 `json:"schemaVersion"`
	Images        []builtImagePayload `json:"images"`
}

// renderBuiltImages writes one id and tag per build to standard output: one
// line per id as text, or one JSON document under --output json.
func renderBuiltImages(out io.Writer, mode string, built []application.BuiltImage) error {
	if mode == outputJSON {
		document := builtImagesDocument{SchemaVersion: 1, Images: []builtImagePayload{}}
		for _, image := range built {
			document.Images = append(document.Images, builtImagePayload{ID: image.ID, Tag: image.Tag})
		}
		body, err := json.Marshal(document)
		if err != nil {
			return fmt.Errorf("cli: marshal built images: %w", err)
		}
		if _, err := fmt.Fprintln(out, string(body)); err != nil {
			return &finding.PipeError{}
		}
		return nil
	}
	for _, image := range built {
		if _, err := fmt.Fprintf(out, "%s %s\n", image.ID, image.Tag); err != nil {
			return &finding.PipeError{}
		}
	}
	return nil
}
