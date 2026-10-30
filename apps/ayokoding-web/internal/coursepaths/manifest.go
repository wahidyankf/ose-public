package coursepaths

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

// Manifest parsing and validation for P2-Courses (AC-06).
//
// The file-backed manifest set mirrors the merged transitional source under
// apps/ayokoding-www/src/features/course-paths/manifests: variable-depth
// careers/... and skills/... IDs, phase order with core/extension kinds,
// string-or-framed course refs, and the temporary plan-06/plan-07
// restructure markers on the four allowlisted skills paths. Malformed files
// are skipped with developer diagnostics; a missing manifest root yields the
// intentional empty state, never an error page.

// CourseRef is one courseOrder entry: a bare course ID or an object carrying
// authored framing.
type CourseRef struct {
	ID         string
	Intro      string
	Outro      string
	HasFraming bool
}

// ManifestPhase is one ordered syllabus phase.
type ManifestPhase struct {
	ID               string
	Title            string
	Kind             string
	OutcomeCan       string
	OutcomeCannotYet string
	HasOutcome       bool
	Courses          []CourseRef
}

// Manifest is one parsed path file plus its derived flattened order.
type Manifest struct {
	PathID               string
	Arc                  string
	Title                string
	Description          string
	RestructurePendingIn string
	HasMarker            bool
	Assumes              []string
	Goals                []string
	Phases               []ManifestPhase
	CourseOrder          []string
}

// OrderingViolation is one course placed before a declared in-manifest
// prerequisite it depends on.
type OrderingViolation struct {
	CourseID              string
	MissingPrerequisiteID string
	CourseIndex           int
	PrerequisiteIndex     int
}

// restructureAllowlist is the closed transitional set (plan-06 accounting,
// plan-07 ERP): the only manifests that may carry a restructure marker, each
// with exactly its owning plan.
var restructureAllowlist = map[string]string{
	"skills/conventional-accounting": "plan-06",
	"skills/sharia-accounting":       "plan-06",
	"skills/conventional-erp":        "plan-07",
	"skills/sharia-erp":              "plan-07",
}

// isKebabSegment reports whether s is one lowercase alphanumeric segment
// joined by single internal hyphens.
func isKebabSegment(s string) bool {
	if s == "" {
		return false
	}
	leadingHyphen := s[0] == '-'
	trailingHyphen := s[len(s)-1] == '-'
	if leadingHyphen || trailingHyphen {
		return false
	}
	previousHyphen := false
	for i := 0; i < len(s); i++ {
		c := s[i]
		switch {
		case c >= 'a' && c <= 'z', c >= '0' && c <= '9':
			previousHyphen = false
		case c == '-':
			if previousHyphen {
				return false
			}
			previousHyphen = true
		default:
			return false
		}
	}
	return true
}

// isUnsafeID reports whether id carries traversal, separator, or control
// characters. This is the single unsafe-ID check: manifest loading and path
// context resolution both route through it.
func isUnsafeID(id string) bool {
	if id == "" || id == "." || id == ".." {
		return true
	}
	if strings.Contains(id, "..") || strings.ContainsAny(id, "/\\\x00") {
		return true
	}
	return false
}

// ValidatePathID reports whether id is a variable-depth manifest identity:
// a careers/ or skills/ category followed by one or more kebab-case
// segments. It rejects traversal, separators outside the segment structure,
// empty or doubled slashes, uppercase, whitespace, and any non-kebab
// character so an ID can never escape its manifest directory or corrupt a
// ?path= query round-trip.
func ValidatePathID(id string) error {
	segments := strings.Split(id, "/")
	if len(segments) < 2 {
		return fmt.Errorf("path id %q must start with careers/ or skills/ and name a path", id)
	}
	if segments[0] != "careers" && segments[0] != "skills" {
		return fmt.Errorf("path id %q must start with careers/ or skills/", id)
	}
	for _, segment := range segments[1:] {
		if !isKebabSegment(segment) {
			return fmt.Errorf("path id %q has an invalid segment %q", id, segment)
		}
	}
	return nil
}

// validateCourseID reports whether id is a single kebab-case course identity.
func validateCourseID(id string) error {
	if !isKebabSegment(id) {
		return fmt.Errorf("course id %q must be kebab-case without slashes", id)
	}
	return nil
}

// fileManifest is the on-disk JSON shape of one manifest file.
type fileManifest struct {
	PathID               string      `json:"pathId"`
	Arc                  string      `json:"arc"`
	Title                string      `json:"title"`
	Description          string      `json:"description"`
	RestructurePendingIn string      `json:"restructurePendingIn,omitempty"`
	Goals                []string    `json:"goals,omitempty"`
	Assumes              []string    `json:"assumes,omitempty"`
	Phases               []filePhase `json:"phases"`
}

type filePhase struct {
	ID      string            `json:"id"`
	Title   string            `json:"title"`
	Kind    string            `json:"kind"`
	Outcome *fileOutcome      `json:"outcome,omitempty"`
	Courses []json.RawMessage `json:"courses"`
}

type fileOutcome struct {
	Can       string `json:"can"`
	CannotYet string `json:"cannotYet,omitempty"`
}

type fileCourseObject struct {
	ID      string       `json:"id"`
	Framing *fileFraming `json:"framing,omitempty"`
}

type fileFraming struct {
	Intro string `json:"intro,omitempty"`
	Outro string `json:"outro,omitempty"`
}

// parseCourseRef normalizes one courseOrder entry: a bare course-ID string
// or an {id, framing?} object, preserving framing when present.
func parseCourseRef(raw json.RawMessage) (CourseRef, error) {
	var id string
	if err := json.Unmarshal(raw, &id); err == nil {
		if err := validateCourseID(id); err != nil {
			return CourseRef{}, err
		}
		return CourseRef{ID: id}, nil
	}
	var object fileCourseObject
	decoder := json.NewDecoder(strings.NewReader(string(raw)))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&object); err != nil {
		return CourseRef{}, fmt.Errorf("course ref %s must be an id string or {id, framing?}: %w", raw, err)
	}
	if err := validateCourseID(object.ID); err != nil {
		return CourseRef{}, err
	}
	ref := CourseRef{ID: object.ID}
	if object.Framing != nil {
		ref.HasFraming = true
		ref.Intro = object.Framing.Intro
		ref.Outro = object.Framing.Outro
	}
	return ref, nil
}

// ParseManifest parses and validates one manifest file, deriving
// courseOrder as the concatenation of every phase's courses in order.
// Unknown fields fail the parse so authored typos surface as diagnostics
// instead of silent defaults. Errors name the reason and the manifest
// identity, never a filesystem location.
func ParseManifest(raw []byte) (Manifest, error) {
	var file fileManifest
	decoder := json.NewDecoder(strings.NewReader(string(raw)))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&file); err != nil {
		return Manifest{}, fmt.Errorf("invalid manifest JSON: %w", err)
	}
	if err := ValidatePathID(file.PathID); err != nil {
		return Manifest{}, err
	}
	if file.Arc == "" {
		return Manifest{}, fmt.Errorf("path %q must declare an arc", file.PathID)
	}
	if file.Title == "" || file.Description == "" {
		return Manifest{}, fmt.Errorf("path %q must declare a title and description", file.PathID)
	}
	if file.RestructurePendingIn != "" && file.RestructurePendingIn != "plan-06" && file.RestructurePendingIn != "plan-07" {
		return Manifest{}, fmt.Errorf("path %q carries an unknown restructure marker", file.PathID)
	}
	marked := file.RestructurePendingIn != ""
	if marked {
		want, ok := restructureAllowlist[file.PathID]
		if !ok || want != file.RestructurePendingIn {
			return Manifest{}, fmt.Errorf("path %q carries a restructure marker it is not allowed", file.PathID)
		}
		if !isMarkedShape(file) {
			return Manifest{}, fmt.Errorf("path %q must keep its single all-courses phase until its restructure", file.PathID)
		}
	}
	for _, id := range file.Assumes {
		if err := validateCourseID(id); err != nil {
			return Manifest{}, fmt.Errorf("path %q assumes an invalid course: %w", file.PathID, err)
		}
	}
	for _, id := range file.Goals {
		if err := validateCourseID(id); err != nil {
			return Manifest{}, fmt.Errorf("path %q goals an invalid course: %w", file.PathID, err)
		}
	}
	if len(file.Phases) == 0 {
		return Manifest{}, fmt.Errorf("path %q must declare at least one phase", file.PathID)
	}
	manifest := Manifest{
		PathID:               file.PathID,
		Arc:                  file.Arc,
		Title:                file.Title,
		Description:          file.Description,
		RestructurePendingIn: file.RestructurePendingIn,
		HasMarker:            marked,
		Assumes:              append([]string{}, file.Assumes...),
		Goals:                append([]string{}, file.Goals...),
	}
	for _, phase := range file.Phases {
		parsed, err := parsePhase(file.PathID, phase, marked)
		if err != nil {
			return Manifest{}, err
		}
		manifest.Phases = append(manifest.Phases, parsed)
		for _, ref := range parsed.Courses {
			manifest.CourseOrder = append(manifest.CourseOrder, ref.ID)
		}
	}
	return manifest, nil
}

// parsePhase validates one syllabus phase, preserving manifest order.
func parsePhase(pathID string, phase filePhase, marked bool) (ManifestPhase, error) {
	if !isKebabSegment(phase.ID) {
		return ManifestPhase{}, fmt.Errorf("path %q has a phase with an invalid id", pathID)
	}
	if phase.Title == "" {
		return ManifestPhase{}, fmt.Errorf("path %q has a phase without a title", pathID)
	}
	if phase.Kind != "core" && phase.Kind != "extension" {
		return ManifestPhase{}, fmt.Errorf("path %q has a phase with kind %q, want core or extension", pathID, phase.Kind)
	}
	parsed := ManifestPhase{ID: phase.ID, Title: phase.Title, Kind: phase.Kind}
	if phase.Outcome != nil {
		if phase.Outcome.Can == "" {
			return ManifestPhase{}, fmt.Errorf("path %q has a phase outcome without a can statement", pathID)
		}
		parsed.HasOutcome = true
		parsed.OutcomeCan = phase.Outcome.Can
		parsed.OutcomeCannotYet = phase.Outcome.CannotYet
	} else if phase.Kind == "core" && !marked {
		return ManifestPhase{}, fmt.Errorf("path %q has a core phase without an outcome", pathID)
	}
	if len(phase.Courses) == 0 {
		return ManifestPhase{}, fmt.Errorf("path %q has a phase without courses", pathID)
	}
	for _, raw := range phase.Courses {
		ref, err := parseCourseRef(raw)
		if err != nil {
			return ManifestPhase{}, fmt.Errorf("path %q: %w", pathID, err)
		}
		parsed.Courses = append(parsed.Courses, ref)
	}
	return parsed, nil
}

// isMarkedShape reports whether file keeps the mechanical shape a marked
// manifest must hold until its owning plan restructures it: one all-courses
// core phase with no outcome, no goals, and empty assumes.
func isMarkedShape(file fileManifest) bool {
	if len(file.Phases) != 1 || len(file.Goals) > 0 || len(file.Assumes) > 0 {
		return false
	}
	phase := file.Phases[0]
	return phase.ID == "all-courses" && phase.Kind == "core" && phase.Outcome == nil
}

// LoadManifestDir loads every *.json manifest below root in deterministic order,
// skipping malformed files with developer diagnostics. A missing root yields
// the intentional empty state with one diagnostic, never an error, so the
// path category page renders its empty state and the rest of navigation
// stays usable.
func LoadManifestDir(root string) (paths []Manifest, diagnostics []string) {
	entries, err := collectManifestFiles(root)
	if err != nil {
		return nil, []string{"manifests: no manifest root: showing the empty state"}
	}
	for _, entry := range entries {
		raw, err := os.ReadFile(entry)
		if err != nil {
			diagnostics = append(diagnostics, fmt.Sprintf("manifests: skipping %s: unreadable file", filepath.Base(entry)))
			continue
		}
		manifest, err := ParseManifest(raw)
		if err != nil {
			diagnostics = append(diagnostics, fmt.Sprintf("manifests: skipping %s: %s", filepath.Base(entry), err))
			continue
		}
		paths = append(paths, manifest)
	}
	sort.Slice(paths, func(i, j int) bool { return paths[i].PathID < paths[j].PathID })
	return paths, diagnostics
}

// collectManifestFiles lists manifest files below root in sorted order.
func collectManifestFiles(root string) ([]string, error) {
	var files []string
	err := filepath.WalkDir(root, func(path string, entry os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if entry.IsDir() {
			return nil
		}
		if strings.HasSuffix(entry.Name(), ".json") {
			files = append(files, path)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	sort.Strings(files)
	return files, nil
}

// CheckPrerequisiteOrder reports the ordering-only violations in courseOrder:
// a course placed before a declared prerequisite that is also present in the
// manifest. A declared prerequisite the manifest omits entirely is a
// link-don't-walk case, never a violation; an ID outside the manifest is a
// resolver miss, never a crash.
func CheckPrerequisiteOrder(order []string, prereqs map[string][]string) []OrderingViolation {
	indexByID := make(map[string]int, len(order))
	for index, id := range order {
		if _, exists := indexByID[id]; !exists {
			indexByID[id] = index
		}
	}
	var violations []OrderingViolation
	for courseIndex, courseID := range order {
		for _, prerequisiteID := range prereqs[courseID] {
			prerequisiteIndex, present := indexByID[prerequisiteID]
			if !present {
				continue
			}
			if prerequisiteIndex > courseIndex {
				violations = append(violations, OrderingViolation{
					CourseID:              courseID,
					MissingPrerequisiteID: prerequisiteID,
					CourseIndex:           courseIndex,
					PrerequisiteIndex:     prerequisiteIndex,
				})
			}
		}
	}
	return violations
}

// ResolvePathFallback resolves the path context for a course URL: it returns
// the path identifier only when it names a known path containing the course,
// and the canonical fallback otherwise. Unsafe identifiers fall back too, so
// validation happens once at this boundary.
func (s *FakeStore) ResolvePathFallback(pathID, courseID string) (string, bool) {
	if isUnsafeID(pathID) {
		return "", false
	}
	if !s.PathContains(pathID, courseID) {
		return "", false
	}
	return pathID, true
}
