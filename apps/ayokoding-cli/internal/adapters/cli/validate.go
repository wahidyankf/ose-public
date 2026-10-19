package cli

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/application"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/catalog"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/toolchains"
)

// loadCatalog returns the catalog from --catalog or the embedded one. An
// unpinned catalog refuses with a closed error.
func loadCatalog(cmd *cobra.Command) (catalog.Catalog, error) {
	path, err := flagValue(cmd, "catalog")
	if err != nil {
		return catalog.Catalog{}, err
	}
	if path != "" {
		data, err := os.ReadFile(path)
		if err != nil {
			return catalog.Catalog{}, fmt.Errorf("cli: read catalog file: %w", err)
		}
		validated, err := catalog.Validated(data)
		if err != nil {
			return catalog.Catalog{}, fmt.Errorf("cli: load catalog: %w", err)
		}
		return validated, nil
	}
	loaded, err := catalog.Load(toolchains.Files())
	if err != nil {
		return catalog.Catalog{}, fmt.Errorf("cli: load catalog: %w", err)
	}
	return loaded, nil
}

// runValidate checks the selected courses and reports every finding.
func runValidate(cmd *cobra.Command) error {
	cat, err := loadCatalog(cmd)
	if err != nil {
		return err
	}
	courses, err := cmd.Flags().GetStringSlice("course")
	if err != nil {
		return fmt.Errorf("cli: read --course: %w", err)
	}
	inert, err := cmd.Flags().GetBool("include-inert")
	if err != nil {
		return fmt.Errorf("cli: read --include-inert: %w", err)
	}
	content, err := flagValue(cmd, "content")
	if err != nil {
		return err
	}
	if _, err := os.Stat(content); err != nil {
		return fmt.Errorf("cli: open content: %w", err)
	}
	mode, err := flagValue(cmd, "output")
	if err != nil {
		return err
	}
	findings, err := application.Validate(application.ValidateRequest{
		Content:      os.DirFS(content),
		Catalog:      cat,
		Courses:      courses,
		IncludeInert: inert,
	})
	if err != nil {
		return fmt.Errorf("cli: validate courses: %w", err)
	}
	if err := renderFindings(cmd.OutOrStdout(), mode, findings); err != nil {
		return err
	}
	if len(findings) != 0 {
		return &statusError{status: 1}
	}
	return nil
}

// runList prints the catalog entries in id order.
func runList(cmd *cobra.Command) error {
	cat, err := loadCatalog(cmd)
	if err != nil {
		return err
	}
	mode, err := flagValue(cmd, "output")
	if err != nil {
		return err
	}
	return renderToolchains(cmd.OutOrStdout(), mode, application.ListToolchains(cat))
}
