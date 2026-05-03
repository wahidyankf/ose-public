package cmd

import (
	"os"

	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/agents"
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/bcregistry"
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/docs"
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/doctor"
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/envbackup"
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/git"
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/mermaid"
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/speccoverage"
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/testcoverage"
)

// OS operation function variables for dependency injection in tests.
var (
	osStat  = os.Stat
	osGetwd = os.Getwd
)

// Internal package function variables for dependency injection in tests.

// doctor command delegation.
var doctorCheckAllFn = doctor.CheckAll
var doctorFixAllFn = doctor.FixAll

// agents sync command delegation.
var agentsSyncAllFn = agents.SyncAll

// agents validate-claude command delegation.
var agentsValidateClaudeFn = agents.ValidateClaude

// agents validate-sync command delegation.
var agentsValidateSyncFn = agents.ValidateSync

// docs validate-links command delegation.
var docsValidateAllLinksFn = docs.ValidateAllLinks

// spec-coverage validate command delegation.
var specCoverageCheckAllFn = speccoverage.CheckAll

// test-coverage validate command delegation.
var testCoverageComputeLCOVResultFn = testcoverage.ComputeLCOVResult
var testCoverageComputeJaCoCoResultFn = testcoverage.ComputeJaCoCoResult
var testCoverageComputeCoberturaResultFn = testcoverage.ComputeCoberturaResult
var testCoverageComputeGoResultFn = testcoverage.ComputeGoResult

// test-coverage merge command delegation.
var testCoverageToCoverageMapFn = testcoverage.ToCoverageMap

// test-coverage diff command delegation.
var testCoverageComputeDiffCoverageFn = testcoverage.ComputeDiffCoverage

// env backup command delegation.
var envBackupFn = envbackup.Backup

// env restore command delegation.
var envRestoreFn = envbackup.Restore

// confirm prompt function delegation.
var confirmFn = envbackup.DefaultConfirmFn

// git pre-commit command delegation.
var gitRunFn = git.Run
var gitDefaultDepsFn = git.DefaultDeps

// docs validate-mermaid command delegation.
var docsValidateMermaidFn = mermaid.ValidateBlocks

// bc validate command delegation.
var bcValidateAllFn = bcregistry.ValidateAll

// readFileFn is a variable for dependency injection of os.ReadFile in tests.
var readFileFn = os.ReadFile

// getMermaidStagedFilesFn is injectable for unit tests (avoids real git call).
var getMermaidStagedFilesFn = getMermaidStagedFiles

// getMermaidChangedFilesFn is injectable for unit tests (avoids real git call).
var getMermaidChangedFilesFn = getMermaidChangedFiles
