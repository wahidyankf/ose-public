package runspec

import (
	"regexp"
	"slices"
	"strconv"
	"strings"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/catalog"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// ignoreWord is the expected-output value skipping comparison.
const ignoreWord = "ignore"

// Closed vocabularies for static reasons, run kinds, and stderr values.
var (
	staticReasons = map[string]bool{
		"cloud": true, "cluster": true, "ios": true, "android": true, "windows": true,
	}
	runKinds = map[string]bool{
		kindExample: true, kindTest: true, kindCheck: true,
	}
	stderrWords = map[string]bool{"empty": true, ignoreWord: true}

	runNamePattern = regexp.MustCompile(`^[a-z0-9][a-z0-9-]*$`)
	envNamePattern = regexp.MustCompile(`^[A-Z][A-Z0-9_]*$`)
	memoryPattern  = regexp.MustCompile(`^([0-9]+)([mMgG])$`)

	// reservedEnv holds the seven fixed names; every AYOKODING_ name is
	// reserved by prefix.
	reservedEnv = map[string]bool{
		"PATH": true, "HOME": true, "TZ": true, "LANG": true, "LC_ALL": true,
		"SOURCE_DATE_EPOCH": true, "PYTHONHASHSEED": true,
		"AYOKODING_UNIT": true, "AYOKODING_SEED": true,
	}
)

// lineAt returns the first known key line, defaulting to the spec start.
func lineAt(positions map[string]int, paths ...string) int {
	for _, path := range paths {
		if line, ok := positions[path]; ok && line > 0 {
			return line
		}
	}
	return 1
}

// checkCoursePath reports whether a course-relative path stays inside the
// course: never absolute, never climbing with a dot-dot segment.
func checkCoursePath(value string) bool {
	if value == "" || strings.HasPrefix(value, "/") {
		return value == ""
	}
	return !slices.Contains(strings.Split(value, "/"), "..")
}

// isReservedEnv reports whether an env key is reserved for the harness.
func isReservedEnv(key string) bool {
	return reservedEnv[key] || strings.HasPrefix(key, "AYOKODING_")
}

// check runs the semantic rules in field order and builds the Spec.
func (check *checker) check(raw *specYAML, positions map[string]int) (Spec, bool) {
	var spec Spec
	spec.Mode = modeReal
	spec.MemoryBytes = defaultMemoryBytes
	spec.CPUs = defaultCPUs
	check.checkSchema(raw, positions)
	toolchain := check.checkToolchain(raw, positions)
	spec.Toolchain = toolchain
	static := check.checkMode(raw, positions)
	check.checkServices(raw, positions)
	check.checkLockfile(raw, positions)
	check.checkResources(raw, positions, &spec)
	runs := check.checkRuns(raw, positions)
	if len(check.findings) != 0 {
		var empty Spec
		return empty, false
	}
	spec.Schema = schemaV1
	spec.StaticReason, spec.StaticNote = staticReasonNote(raw, static)
	spec.Services = append([]string(nil), raw.Services...)
	if raw.Dependencies != nil {
		spec.Lockfile = raw.Dependencies.Lockfile
	}
	spec.Runs = runs
	return spec, true
}

// checkSchema checks the required schema value.
func (check *checker) checkSchema(raw *specYAML, positions map[string]int) {
	switch {
	case raw.Schema == "":
		check.failf(finding.RunspecMissingSchema, 1, "schema is required")
	case raw.Schema != schemaV1:
		check.failf(finding.RunspecInvalidSchema, lineAt(positions, "schema"),
			"schema %q must be %q", raw.Schema, schemaV1)
	}
}

// checkToolchain checks the required toolchain against the catalog: the id
// must name a language or validator toolchain.
func (check *checker) checkToolchain(raw *specYAML, positions map[string]int) string {
	if raw.Toolchain == "" {
		check.failf(finding.RunspecMissingToolchain, 1, "toolchain is required")
		return ""
	}
	entry, ok := check.catalog.Lookup(raw.Toolchain)
	if !ok || (entry.Kind != catalog.KindLanguage && entry.Kind != catalog.KindValidator) {
		check.failf(finding.RunspecUnknownToolchain, lineAt(positions, "toolchain"),
			"toolchain %q is not a language or validator in the catalog", raw.Toolchain)
		return ""
	}
	return raw.Toolchain
}

// checkMode checks the mode and, for static units, the reason, the note, and
// the services ban. It reports whether the unit is static.
func (check *checker) checkMode(raw *specYAML, positions map[string]int) bool {
	switch raw.Mode {
	case "", modeReal:
		return false
	case modeStatic:
		check.checkStatic(raw, positions)
		return true
	default:
		check.failf(finding.RunspecUnknownMode, lineAt(positions, "mode"),
			"mode %q must be %q or %q", raw.Mode, modeReal, modeStatic)
		return false
	}
}

// checkStatic checks the static reason, note, and services ban.
func (check *checker) checkStatic(raw *specYAML, positions map[string]int) {
	reason := ""
	note := ""
	if raw.Static != nil {
		reason, note = raw.Static.Reason, raw.Static.Note
	}
	if !staticReasons[reason] {
		check.failf(finding.RunspecUnknownStatic, lineAt(positions, "static.reason", "static", "mode"),
			"static reason %q must be one of cloud, cluster, ios, android, windows", reason)
	}
	if strings.TrimSpace(note) == "" {
		check.failf(finding.RunspecMissingStaticNote, lineAt(positions, "static.note", "static", "mode"),
			"static mode needs a note stating what the static run proves")
	}
	if len(raw.Services) != 0 {
		check.failf(finding.RunspecStaticWithServices, lineAt(positions, "services"),
			"static mode allows no services")
	}
}

// staticReasonNote resolves the checked static reason and note.
func staticReasonNote(raw *specYAML, static bool) (string, string) {
	if !static || raw.Static == nil {
		return "", ""
	}
	return raw.Static.Reason, raw.Static.Note
}

// checkServices checks every service id against the catalog.
func (check *checker) checkServices(raw *specYAML, positions map[string]int) {
	for _, id := range raw.Services {
		entry, ok := check.catalog.Lookup(id)
		if !ok || entry.Kind != catalog.KindService {
			check.failf(finding.RunspecUnknownService, lineAt(positions, "services"),
				"service %q is not a service in the catalog", id)
		}
	}
}

// checkLockfile checks the course-relative lockfile path.
func (check *checker) checkLockfile(raw *specYAML, positions map[string]int) {
	if raw.Dependencies == nil {
		return
	}
	if !checkCoursePath(raw.Dependencies.Lockfile) {
		check.failf(finding.RunspecPathEscape, lineAt(positions, "dependencies.lockfile", "dependencies"),
			"lockfile %q leaves the course", raw.Dependencies.Lockfile)
	}
}

// checkResources checks the memory and CPU limits.
func (check *checker) checkResources(raw *specYAML, positions map[string]int, spec *Spec) {
	if raw.Resources == nil {
		return
	}
	if raw.Resources.Memory != "" {
		parsed, ok := parseMemory(raw.Resources.Memory)
		switch {
		case !ok:
			check.failf(finding.RunspecMemoryOutOfRange, lineAt(positions, "resources.memory", "resources"),
				"memory %q must look like 256m to 4g", raw.Resources.Memory)
		case parsed < minMemoryBytes || parsed > maxMemoryBytes:
			check.failf(finding.RunspecMemoryOutOfRange, lineAt(positions, "resources.memory", "resources"),
				"memory %q is outside 256m to 4g", raw.Resources.Memory)
		default:
			spec.MemoryBytes = parsed
		}
	}
	if raw.Resources.CPUs != nil {
		if *raw.Resources.CPUs != 1 && *raw.Resources.CPUs != 2 {
			check.failf(finding.RunspecCpusOutOfRange, lineAt(positions, "resources.cpus", "resources"),
				"cpus %d must be 1 or 2", *raw.Resources.CPUs)
		} else {
			spec.CPUs = *raw.Resources.CPUs
		}
	}
}

// parseMemory reads a memory limit like 256m or 1g into bytes.
func parseMemory(value string) (int64, bool) {
	match := memoryPattern.FindStringSubmatch(value)
	if match == nil {
		return 0, false
	}
	count, err := strconv.ParseInt(match[1], 10, 64)
	if err != nil {
		return 0, false
	}
	if strings.EqualFold(match[2], "g") {
		return count * 1073741824, true
	}
	return count * 1048576, true
}
