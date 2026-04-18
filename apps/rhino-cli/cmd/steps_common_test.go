package cmd

// Common step patterns shared across multiple commands.
const (
	stepExitsSuccessfully = `^the command exits successfully$`
	stepExitsWithFailure  = `^the command exits with a failure code$`
	stepOutputIsValidJSON = `^the output is valid JSON$`
)

// Doctor-specific step patterns.
const (
	stepAllToolsPresentWithMatchingVersions   = `^all required development tools are present with matching versions$`
	stepARequiredToolNotFoundInPATH           = `^a required development tool is not found in the system PATH$`
	stepARequiredToolInstalledWithNonMatching = `^a required development tool is installed with a non-matching version$`
	stepDeveloperRunsDoctorCommand            = `^the developer runs the doctor command$`
	stepDeveloperRunsDoctorCommandWithJSON    = `^the developer runs the doctor command with JSON output$`
	stepOutputReportsEachToolAsPassing        = `^the output reports each tool as passing$`
	stepOutputIdentifiesMissingTool           = `^the output identifies the missing tool$`
	stepOutputReportsToolAsWarning            = `^the output reports the tool as a warning rather than a failure$`
	stepJSONListsEveryCheckedToolWithStatus   = `^the JSON lists every checked tool with its status$`
)

// Doctor scope step patterns.
const (
	stepDeveloperRunsDoctorWithMinimalScope = `^the developer runs the doctor command with minimal scope$`
	stepOutputChecksOnlyMinimalToolSet      = `^the output checks only the minimal tool set$`
)

// Doctor fix step patterns.
const (
	stepDeveloperRunsDoctorWithFix       = `^the developer runs the doctor command with the fix flag$`
	stepDeveloperRunsDoctorWithFixDryRun = `^the developer runs the doctor command with fix and dry-run flags$`
	stepOutputContainsFixProgress        = `^the output contains fix progress$`
	stepOutputContainsDryRunPreview      = `^the output contains a dry-run preview$`
	stepOutputReportsNothingToFix        = `^the output reports nothing to fix$`
)

// Test-coverage validate step patterns.
const (
	stepGoCoverageFile90Pct                        = `^a Go coverage file recording 90% line coverage$`
	stepGoCoverageFile70Pct                        = `^a Go coverage file recording 70% line coverage$`
	stepGoCoverageFile85Pct                        = `^a Go coverage file recording 85% line coverage$`
	stepLCOVCoverageFile90Pct                      = `^an LCOV coverage file recording 90% line coverage$`
	stepLCOVCoverageFileMultipleSourceFiles        = `^an LCOV coverage file with multiple source files$`
	stepDeveloperRunsValidateCoverage85WithPerFile = `^the developer runs test-coverage validate with an 85% threshold and per-file flag$`
	stepOutputContainsPerFileCoverageBreakdown     = `^the output contains per-file coverage breakdown$`
	stepDeveloperRunsValidateCoverageWithExclusion = `^the developer runs test-coverage validate with exclusion of a source file$`
	stepOutputDoesNotContainExcludedFile           = `^the output does not contain the excluded file$`
	stepCoberturaXMLCoverageFile90Pct              = `^a Cobertura XML coverage file recording 90% line coverage$`
	stepCoberturaXMLCoverageFileWithPartialBranch  = `^a Cobertura XML coverage file with partial branch coverage$`
	stepNoCoverageFileExistsAtPath                 = `^no coverage file exists at the specified path$`
	stepDeveloperRunsValidateCoverage85            = `^the developer runs test-coverage validate with an 85% threshold$`
	stepDeveloperRunsValidateCoverage85WithJSON    = `^the developer runs test-coverage validate with an 85% threshold requesting JSON output$`
	stepOutputReportsMeasuredCoveragePct           = `^the output reports the measured coverage percentage$`
	stepOutputIndicatesCoveragePasses              = `^the output indicates the coverage passes the threshold$`
	stepOutputIndicatesCoverageFails               = `^the output indicates the coverage fails the threshold$`
	stepJSONIncludesCoveragePctAndPassFail         = `^the JSON includes the coverage percentage and pass/fail status$`
	stepOutputDescribesMissingFile                 = `^the output describes the missing file$`
)

// Test-coverage merge step patterns.
const (
	stepTwoLCOVFilesWithDifferentSourceFiles = `^two LCOV coverage files with different source files$`
	stepTwoLCOVFilesWithHighCoverage         = `^two LCOV coverage files with high coverage$`
	stepTwoLCOVFilesWithLowCoverage          = `^two LCOV coverage files with low coverage$`
	stepDeveloperRunsMergeWithOutputFile     = `^the developer runs test-coverage merge with an output file$`
	stepDeveloperRunsMergeWithValidation80   = `^the developer runs test-coverage merge with validation at 80% threshold$`
	stepDeveloperRunsMergeWithValidation95   = `^the developer runs test-coverage merge with validation at 95% threshold$`
	stepMergedOutputFileExistsInLCOVFormat   = `^the merged output file exists in LCOV format$`
)

// Agents sync step patterns.
const (
	stepClaudeDirWithValidAgentsAndSkills         = `^a \.claude/ directory with valid agents and skills$`
	stepClaudeDirWithAgentsAndSkillsToConvert     = `^a \.claude/ directory with agents and skills to convert$`
	stepClaudeDirWithBothAgentsAndSkills          = `^a \.claude/ directory with both agents and skills$`
	stepClaudeAgentConfiguredWithSonnetModel      = `^a \.claude/ agent configured with the "sonnet" model$`
	stepDeveloperRunsSyncAgents                   = `^the developer runs agents sync$`
	stepDeveloperRunsSyncAgentsWithDryRunFlag     = `^the developer runs agents sync with the --dry-run flag$`
	stepDeveloperRunsSyncAgentsWithAgentsOnlyFlag = `^the developer runs agents sync with the --agents-only flag$`
	stepOpenCodeDirContainsConvertedConfig        = `^the \.opencode/ directory contains the converted configuration$`
	stepOutputDescribesPlannedOperations          = `^the output describes the planned operations$`
	stepNoFilesWrittenToOpenCodeDir               = `^no files are written to the \.opencode/ directory$`
	stepOnlyAgentFilesWrittenToOpenCodeDir        = `^only agent files are written to the \.opencode/ directory$`
	stepCorrespondingOpenCodeAgentUsesZaiGlmModel = `^the corresponding \.opencode/ agent uses the "zai-coding-plan/glm-5\.1" model identifier$`
)

// Agents validate-claude step patterns.
const (
	stepClaudeDirWhereAllAgentsAndSkillsValid         = `^a \.claude/ directory where all agents and skills are valid$`
	stepClaudeDirWhereOneAgentMissingToolsField       = `^a \.claude/ directory where one agent is missing the required "tools" field$`
	stepClaudeDirWithTwoAgentsSameName                = `^a \.claude/ directory containing two agent files declaring the same name$`
	stepClaudeDirAgentsValidButSkillsHaveIssues       = `^a \.claude/ directory where agents are valid but skills have issues$`
	stepClaudeDirSkillsValidButAgentsHaveIssues       = `^a \.claude/ directory where skills are valid but agents have issues$`
	stepDeveloperRunsValidateClaude                   = `^the developer runs agents validate-claude$`
	stepDeveloperRunsValidateClaudeWithAgentsOnlyFlag = `^the developer runs agents validate-claude with the --agents-only flag$`
	stepDeveloperRunsValidateClaudeWithSkillsOnlyFlag = `^the developer runs agents validate-claude with the --skills-only flag$`
	stepOutputReportsAllChecksAsPassing               = `^the output reports all checks as passing$`
	stepOutputIdentifiesAgentAndMissingField          = `^the output identifies the agent and the missing field$`
	stepOutputReportsDuplicateAgentName               = `^the output reports the duplicate agent name$`
)

// Agents validate-naming step patterns.
const (
	stepAgentsTreeAllConform                = `^a repository where every agent filename ends with an allowed role suffix and mirrors across harnesses$`
	stepAgentsTreeUnknownSuffix             = `^a repository with one agent whose filename ends in an unknown suffix$`
	stepAgentsTreeFrontmatterMismatch       = `^a repository with a \.claude/agents/ file whose frontmatter name differs from its filename$`
	stepAgentsTreeMirrorDrift               = `^a repository where one \.claude/agents/ file has no corresponding \.opencode/agent/ file$`
	stepDeveloperRunsAgentsValidateNaming   = `^the developer runs agents validate-naming$`
	stepOutputZeroNamingViolations          = `^the output reports zero naming violations$`
	stepOutputIdentifiesAgentUnknownSuffix  = `^the output identifies the offending agent file and its unknown suffix$`
	stepOutputIdentifiesFrontmatterMismatch = `^the output identifies the frontmatter mismatch$`
	stepOutputIdentifiesMirrorDrift         = `^the output identifies the mirror-drift violation$`
)

// Workflows validate-naming step patterns.
const (
	stepWorkflowsTreeAllConform               = `^a repository where every workflow filename ends with an allowed type suffix$`
	stepWorkflowsTreeUnknownSuffix            = `^a repository with one workflow whose filename ends in an unknown suffix$`
	stepWorkflowsTreeFrontmatterMismatch      = `^a repository with a workflow file whose frontmatter name differs from its filename$`
	stepWorkflowsTreeMetaExempt               = `^a repository with a file under governance/workflows/meta/ whose name does not follow the type-suffix rule$`
	stepDeveloperRunsWorkflowsValidateNaming  = `^the developer runs workflows validate-naming$`
	stepOutputIdentifiesWorkflowUnknownSuffix = `^the output identifies the offending workflow file and its unknown suffix$`
)

// Agents validate-sync step patterns.
const (
	stepClaudeAndOpenCodeConfigsFullySynchronised      = `^\.claude/ and \.opencode/ configurations that are fully synchronised$`
	stepAgentInClaudeWithDescriptionMismatch           = `^an agent in \.claude/ whose description differs from its \.opencode/ counterpart$`
	stepClaudeContainingMoreAgentsThanOpenCode         = `^\.claude/ containing more agents than \.opencode/$`
	stepDeveloperRunsValidateSync                      = `^the developer runs agents validate-sync$`
	stepOutputReportsAllSyncChecksAsPassing            = `^the output reports all sync checks as passing$`
	stepOutputIdentifiesAgentWithMismatchedDescription = `^the output identifies the agent with the mismatched description$`
	stepOutputReportsAgentCountMismatch                = `^the output reports the agent count mismatch$`
)

// Docs validate-links step patterns.
const (
	stepMarkdownFilesAllInternalLinksValid       = `^markdown files where all internal links point to existing files$`
	stepMarkdownFileWithLinkToNonExistentFile    = `^a markdown file with a link pointing to a non-existent file$`
	stepMarkdownFileContainingOnlyExternalLinks  = `^a markdown file containing only external HTTPS links$`
	stepMarkdownFileWithBrokenLinkNotStaged      = `^a markdown file with a broken link that has not been staged in git$`
	stepDeveloperRunsValidateDocsLinks           = `^the developer runs docs validate-links$`
	stepDeveloperRunsValidateDocsLinksWithStaged = `^the developer runs docs validate-links with the --staged-only flag$`
	stepOutputReportsNoBrokenLinksFound          = `^the output reports no broken links found$`
	stepOutputIdentifiesFileContainingBrokenLink = `^the output identifies the file containing the broken link$`
)

// Spec-coverage validate step patterns.
const (
	stepSpecsDirEveryFeatureFileHasTest              = `^a specs directory where every feature file has a corresponding test file$`
	stepSpecsDirContainsFeatureFileWithNoTest        = `^a specs directory containing a feature file with no corresponding test file$`
	stepFeatureFileWithScenarioNotInAnyTestFile      = `^a feature file with a scenario whose title does not appear in any test file$`
	stepFeatureFileWithStepTextNotInAnyTestFile      = `^a feature file with a step text that does not appear in any test file$`
	stepDeveloperRunsValidateSpecCoverage            = `^the developer runs spec-coverage validate on the specs and app directories$`
	stepOutputReportsAllSpecsAsCovered               = `^the output reports all specs as covered$`
	stepOutputIdentifiesFeatureFileAsUncoveredSpec   = `^the output identifies the feature file as an uncovered spec$`
	stepOutputIdentifiesScenarioAsUnimplemented      = `^the output identifies the scenario as an unimplemented scenario$`
	stepOutputIdentifiesStepAsUndefined              = `^the output identifies the step as an undefined step$`
	stepFeatureFilesWithStepsInSharedStepFiles       = `^feature files with steps implemented in shared step files$`
	stepDeveloperRunsValidateSpecCoverageSharedSteps = `^the developer runs spec-coverage validate with shared-steps flag$`
	stepCommandValidatesStepsAcrossAllSourceFiles    = `^the command validates steps across all source files without file matching$`
	stepFeatureFilesWithTestsInMultipleLanguages     = `^feature files with test implementations in multiple languages$`
	stepTestFilesMatchedUsingLanguageConventions     = `^test files are matched using language-specific conventions$`
)

// Test-coverage diff step patterns.
const (
	stepCoverageFileAndNoGitChanges                    = `^a coverage file and no git changes$`
	stepCoverageFileAllChangedLinesCovered             = `^a coverage file where all changed lines are covered$`
	stepCoverageFileSomeChangedLinesMissed             = `^a coverage file where some changed lines are missed$`
	stepCoverageFileAndChangesInExcludedFiles          = `^a coverage file and changes in excluded files$`
	stepDeveloperRunsTestCoverageDiff                  = `^the developer runs test-coverage diff$`
	stepDeveloperRunsTestCoverageDiffWithThreshold     = `^the developer runs test-coverage diff with a threshold$`
	stepDeveloperRunsTestCoverageDiffWithHighThreshold = `^the developer runs test-coverage diff with a high threshold$`
	stepDeveloperRunsTestCoverageDiffWithExclusion     = `^the developer runs test-coverage diff with exclusion$`
	stepOutputReports100PercentCoverage                = `^the output reports 100% coverage$`
	stepExcludedFilesDoNotAffectDiffResult             = `^the excluded files do not affect the diff coverage result$`
)

// Git pre-commit step patterns.
const (
	stepDeveloperIsOutsideGitRepository     = `^the developer is outside a git repository$`
	stepDeveloperRunsGitPreCommit           = `^the developer runs rhino-cli git pre-commit$`
	stepOutputMentionsGitRepositoryNotFound = `^the output mentions that a git repository was not found$`
)

// Env backup step patterns.
const (
	stepRepoWithEnvFilesAtRootAndSubdirs             = `^a git repository containing \.env files at the root and in app subdirectories$`
	stepRepoWithEnvFileAtRoot                        = `^a git repository containing a \.env file at the root$`
	stepDeveloperRunsEnvBackup                       = `^the developer runs rhino-cli env backup$`
	stepDeveloperRunsEnvBackupWithDirOutside         = `^the developer runs rhino-cli env backup with --dir pointing to a directory outside the repository$`
	stepDeveloperRunsEnvBackupWithDirInside          = `^the developer runs rhino-cli env backup with --dir pointing to a path inside the git root$`
	stepEachEnvFileCopiedPreservingRelativePath      = `^each \.env file is copied to the backup directory preserving its relative path$`
	stepOutputListsEachBackedUpFile                  = `^the output lists each backed-up file$`
	stepEnvFileCopiedToSpecifiedDirPreservingPath    = `^the \.env file is copied to the specified directory preserving its relative path$`
	stepOutputWarnsBackupDirMustBeOutside            = `^the output warns that the backup directory must be outside the repository$`
	stepRepoWithSymlinkOversizedAndRegularEnvFile    = `^a git repository containing a symlinked \.env file, a \.env file larger than 1 MB, and a regular \.env file$`
	stepSymlinkedEnvFileSkippedWithWarning           = `^the symlinked \.env file is skipped with a warning$`
	stepOversizedEnvFileSkippedWithWarning           = `^the oversized \.env file is skipped with a warning$`
	stepRegularEnvFileCopiedToBackupDir              = `^the regular \.env file is copied to the backup directory$`
	stepRepoWithNoEnvFiles                           = `^a git repository containing no \.env files$`
	stepOutputReportsZeroFilesBackedUp               = `^the output reports that zero files were backed up$`
	stepDeveloperRunsEnvBackupWithOutputJSON         = `^the developer runs rhino-cli env backup with --output json$`
	stepJSONIncludesDirectionDirFilesCountsBackup    = `^the JSON includes the direction, backup directory, list of files, copied count, and skipped count$`
	stepRepoWithEnvFilesInAutoGeneratedDirs          = `^a git repository containing \.env files inside node_modules, dist, build, \.next, __pycache__, target, vendor, coverage, and generated-contracts directories$`
	stepNoneOfEnvFilesInAutoGeneratedDirsBacked      = `^none of the \.env files inside auto-generated directories are backed up$`
	stepRepoWithNestedNodeModulesEnvAndLocalEnv      = `^a git repository where apps/web/node_modules contains a \.env file and apps/web contains a \.env\.local file$`
	stepOnlyAppsWebEnvLocalCopied                    = `^only apps/web/\.env\.local is copied to the backup directory$`
	stepEnvFileInsideNodeModulesNotBacked            = `^the \.env file inside apps/web/node_modules is not backed up$`
	stepWorktreeWithEnvFileAtRoot                    = `^a git worktree containing a \.env file at its root$`
	stepEnvFileCopiedWithFlatStructure               = `^the \.env file is copied to the backup directory with a flat structure$`
	stepWorktreeNamedFeatureBranchWithEnvFile        = `^a git worktree named "feature-branch" containing a \.env file at its root$`
	stepDeveloperRunsEnvBackupWithWorktreeAware      = `^the developer runs rhino-cli env backup with --worktree-aware$`
	stepEnvFileCopiedUnderFeatureBranchSubdir        = `^the \.env file is copied under a feature-branch subdirectory inside the backup directory$`
	stepMainRepoNamedOpenShariaEnterpriseWithEnv     = `^the main git repository named "open-sharia-enterprise" containing a \.env file at its root$`
	stepEnvFileCopiedUnderOpenShariaEnterpriseSubdir = `^the \.env file is copied under an open-sharia-enterprise subdirectory inside the backup directory$`
)

// Env backup confirm step patterns.
const (
	stepBackupDirAlreadyContainsBackedUpEnvFile    = `^the backup directory already contains a backed-up \.env file$`
	stepBackupDirIsEmpty                           = `^the backup directory is empty$`
	stepDeveloperRunsEnvBackupAndConfirmsOverwrite = `^the developer runs rhino-cli env backup and confirms the overwrite$`
	stepDeveloperRunsEnvBackupAndDeclinesOverwrite = `^the developer runs rhino-cli env backup and declines the overwrite$`
	stepDeveloperRunsEnvBackupWithForce            = `^the developer runs rhino-cli env backup with --force$`
	stepEnvFileOverwrittenInBackupDir              = `^the \.env file is overwritten in the backup directory$`
	stepOutputReportsBackupCancelled               = `^the output reports that backup was cancelled$`
	stepExistingBackupFileUnchanged                = `^the existing backup file is unchanged$`
	stepEnvFileOverwrittenWithoutPrompting         = `^the \.env file is overwritten in the backup directory without prompting$`
	stepNoConfirmationPromptShown                  = `^no confirmation prompt is shown$`
	stepEnvFileCopiedToBackupDir                   = `^the \.env file is copied to the backup directory$`
)

// Env backup config step patterns.
const (
	stepRepoWithEnvFileAndClaudeConfig               = `^a git repository containing a \.env file and a \.claude/settings\.local\.json file$`
	stepRepoWithEnvFileButNoKnownConfigFiles         = `^a git repository containing a \.env file but no known config files$`
	stepDeveloperRunsEnvBackupWithIncludeConfigForce = `^the developer runs rhino-cli env backup with --include-config and --force$`
	stepDeveloperRunsEnvBackupWithForceOnly          = `^the developer runs rhino-cli env backup with --force$`
	stepClaudeConfigCopiedToBackupDir                = `^the \.claude/settings\.local\.json is copied to the backup directory preserving its relative path$`
	stepClaudeConfigNotCopiedToBackupDir             = `^the \.claude/settings\.local\.json is not copied to the backup directory$`
	stepOnlyEnvFileCopiedToBackupDir                 = `^only the \.env file is copied to the backup directory$`
)

// Env restore confirm step patterns.
const (
	stepRepoAlreadyContainsEnvFileAtOriginalPath    = `^the repository already contains a \.env file at the original path$`
	stepRepoDoesNotContainEnvFileAtOriginalPath     = `^the repository does not contain a \.env file at the original path$`
	stepDeveloperRunsEnvRestoreAndConfirmsOverwrite = `^the developer runs rhino-cli env restore and confirms the overwrite$`
	stepDeveloperRunsEnvRestoreAndDeclinesOverwrite = `^the developer runs rhino-cli env restore and declines the overwrite$`
	stepDeveloperRunsEnvRestoreWithForce            = `^the developer runs rhino-cli env restore with --force$`
	stepEnvFileInRepoOverwrittenWithBackup          = `^the \.env file in the repository is overwritten with the backup$`
	stepOutputReportsRestoreCancelled               = `^the output reports that restore was cancelled$`
	stepExistingRepoFileUnchanged                   = `^the existing repository file is unchanged$`
	stepEnvFileInRepoOverwrittenWithoutPrompting    = `^the \.env file in the repository is overwritten without prompting$`
	stepEnvFileRestoredToRepo                       = `^the \.env file is restored to the repository$`
)

// Env restore config step patterns.
const (
	stepBackupDirWithEnvFileAndClaudeConfig           = `^a backup directory containing a \.env file and a \.claude/settings\.local\.json file$`
	stepDeveloperRunsEnvRestoreWithIncludeConfigForce = `^the developer runs rhino-cli env restore with --include-config and --force$`
	stepDeveloperRunsEnvRestoreWithForceOnly          = `^the developer runs rhino-cli env restore with --force$`
	stepClaudeConfigRestoredToRepo                    = `^the \.claude/settings\.local\.json is restored to the repository preserving its relative path$`
	stepClaudeConfigNotRestoredToRepo                 = `^the \.claude/settings\.local\.json is not restored to the repository$`
)

// Env init step patterns.
const (
	stepEnvExamplesExistButNoEnvFiles   = `^\.env\.example files exist in infra/dev but no \.env files$`
	stepEnvExamplesAndSomeEnvFilesExist = `^\.env\.example files exist in infra/dev and some \.env files already exist$`
	stepNoEnvExamplesExist              = `^no \.env\.example files exist in infra/dev$`
	stepDeveloperRunsEnvInit            = `^the developer runs env init$`
	stepDeveloperRunsEnvInitWithForce   = `^the developer runs env init with the force flag$`
	stepEnvFilesCreatedFromExamples     = `^\.env files are created from each \.env\.example$`
	stepOutputListsEachCreatedFile      = `^the output lists each created file$`
	stepExistingEnvFilesNotOverwritten  = `^existing \.env files are not overwritten$`
	stepOutputShowsSkippedFiles         = `^the output shows skipped files$`
	stepAllEnvFilesCreatedOrOverwritten = `^all \.env files are created or overwritten$`
	stepOutputReportsZeroFilesCreated   = `^the output reports zero files created$`
)

// Env restore step patterns.
const (
	stepBackupDirWithPreviouslyBackedUpEnvFiles      = `^a backup directory containing previously backed-up \.env files from the repository$`
	stepDeveloperRunsEnvRestore                      = `^the developer runs rhino-cli env restore$`
	stepEachEnvFileCopiedBackToOriginalPath          = `^each \.env file is copied back to its original path in the repository$`
	stepOutputListsEachRestoredFile                  = `^the output lists each restored file$`
	stepBackupDirAtTmpMyEnvBackup                    = `^a backup directory at /tmp/my-env-backup containing a backed-up \.env file$`
	stepDeveloperRunsEnvRestoreWithDirTmpMyEnvBackup = `^the developer runs rhino-cli env restore with --dir /tmp/my-env-backup$`
	stepEnvFileCopiedBackToOriginalPath              = `^the \.env file is copied back to its original path in the repository$`
	stepNoDirectoryExistsAtNonexistent               = `^no directory exists at /nonexistent$`
	stepDeveloperRunsEnvRestoreWithDirNonexistent    = `^the developer runs rhino-cli env restore with --dir /nonexistent$`
	stepOutputReportsDirDoesNotExist                 = `^the output reports that the directory does not exist$`
	stepBackupDirWithSinglePreviouslyBackedUpEnvFile = `^a backup directory containing a previously backed-up \.env file$`
	stepDeveloperRunsEnvRestoreWithOutputJSON        = `^the developer runs rhino-cli env restore with --output json$`
	stepBackupDirWithEnvFileAndReadme                = `^a backup directory containing a backed-up \.env file and a README\.md file$`
	stepReadmeNotRestored                            = `^README\.md is not restored$`
	stepBackupDirWithNoEnvFiles                      = `^a backup directory containing no \.env files$`
	stepOutputReportsZeroFilesRestored               = `^the output reports that zero files were restored$`
	stepBackupDirWithEnvFileUnderFeatureBranch       = `^a backup directory containing a \.env file backed up under a feature-branch namespace$`
	stepDeveloperRunsEnvRestoreWorktreeAwareFeature  = `^the developer runs rhino-cli env restore with --worktree-aware from a worktree named "feature-branch"$`
	stepEnvFileReadFromFeatureBranchNamespace        = `^the \.env file is read from the feature-branch namespace inside the backup directory$`
	stepEnvFileCopiedBackToOriginalPathInWorktree    = `^the \.env file is copied back to its original path in the worktree$`
)
