// Package layout discovers course units over an fs.FS and reports placement
// findings: flat examples, unplaced code, and run specs outside unit folders.
// Only lexical placement is checked here; run.yaml contents are validated by
// the runspec package.
package layout

import (
	"io/fs"
	"path"
	"regexp"
	"sort"
	"strings"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// Unit kinds in the closed vocabulary.
const (
	KindExample  = "example"
	KindKata     = "kata"
	KindCapstone = "capstone"
)

// Canonical code roots and the capstone unit folder, course-relative.
const (
	exampleRoot  = "learning/code"
	kataRoot     = "drilling/code"
	capstoneRoot = "learning/capstone/code"
)

// Unit directory names: a two- or three-digit number plus a kebab-case slug.
var (
	examplePattern = regexp.MustCompile(`^ex-[0-9]{2,3}-[a-z0-9]+(-[a-z0-9]+)*$`)
	kataPattern    = regexp.MustCompile(`^kata-[0-9]{2,3}-[a-z0-9]+(-[a-z0-9]+)*$`)
	flatPattern    = regexp.MustCompile(`^(ex|kata)-[0-9]{2,3}-`)
)

// Unit is one discovered canonical unit folder.
type Unit struct {
	Course string
	Path   string
	Kind   string
}

// Discover returns the canonical units and the placement findings, both in
// path order.
func Discover(course string, fsys fs.FS) ([]Unit, []finding.Finding) {
	found := &discovery{course: course}
	_ = fs.WalkDir(fsys, ".", found.visit)
	found.reportStrayCodeDirs(fsys)
	return found.units, found.findings
}

// MissingSpecs reports every discovered unit without a run spec.
func MissingSpecs(course string, fsys fs.FS, units []Unit) []finding.Finding {
	var findings []finding.Finding
	for _, unit := range units {
		info, err := fs.Stat(fsys, path.Join(unit.Path, "run.yaml"))
		if err != nil || info.IsDir() {
			findings = append(findings, finding.Finding{
				Code:    finding.LayoutMissingRunspec,
				Course:  course,
				Path:    unit.Path,
				Line:    0,
				Message: "unit " + unit.Path + " has no run.yaml",
			})
		}
	}
	return findings
}

// IsOptedIn reports whether any run.yaml exists anywhere in the course.
// Unreadable paths report nothing: layout describes what it can read.
func IsOptedIn(fsys fs.FS) bool {
	optedIn := false
	_ = fs.WalkDir(fsys, ".", func(_ string, entry fs.DirEntry, err error) error {
		if err == nil && !entry.IsDir() && !optedIn && entry.Name() == "run.yaml" {
			optedIn = true
		}
		return nil
	})
	return optedIn
}

// IsApplicable reports whether the course has a code dir with files or a
// code fence in Markdown outside the code roots. Unreadable paths report
// nothing: layout describes what it can read.
func IsApplicable(fsys fs.FS) bool {
	applicable := false
	_ = fs.WalkDir(fsys, ".", func(route string, entry fs.DirEntry, err error) error {
		if err == nil && !entry.IsDir() && !applicable {
			if underRoot(route, exampleRoot) || underRoot(route, kataRoot) || underRoot(route, capstoneRoot) {
				applicable = true
			} else if strings.HasSuffix(entry.Name(), ".md") && hasFence(fsys, route) {
				applicable = true
			}
		}
		return nil
	})
	return applicable
}

// hasFence reports whether a Markdown file opens a code fence.
func hasFence(fsys fs.FS, route string) bool {
	data, err := fs.ReadFile(fsys, route)
	if err != nil {
		return false
	}
	for line := range strings.SplitSeq(string(data), "\n") {
		if strings.HasPrefix(line, "```") || strings.HasPrefix(line, "~~~") {
			return true
		}
	}
	return false
}

// underRoot reports whether a course-relative path sits below a root.
func underRoot(route, root string) bool {
	return route == root || strings.HasPrefix(route, root+"/")
}

// discovery accumulates one Discover walk.
type discovery struct {
	course   string
	units    []Unit
	unitDirs map[string]bool
	findings []finding.Finding
	stray    map[string]bool
}

// visit classifies one walked path. WalkDir visits parents before children,
// so units are known before their contents. Unreadable paths report nothing:
// layout describes what it can read.
func (d *discovery) visit(route string, entry fs.DirEntry, err error) error {
	if err == nil {
		d.visitPath(route, entry)
	}
	return nil
}

// visitPath classifies one readable path.
func (d *discovery) visitPath(route string, entry fs.DirEntry) {
	if route == "." {
		return
	}
	if route == capstoneRoot {
		if entry.IsDir() {
			d.addUnit(route, KindCapstone)
		}
		return
	}
	if d.insideUnit(route) {
		return
	}
	if !entry.IsDir() && entry.Name() == "run.yaml" {
		d.findings = append(d.findings, finding.Finding{
			Code:    finding.LayoutMisplacedSpec,
			Course:  d.course,
			Path:    route,
			Line:    1,
			Message: "run spec " + route + " sits outside a canonical unit folder",
		})
		return
	}
	parent, name := path.Split(route)
	switch {
	case entry.IsDir() && (parent == exampleRoot+"/" || parent == kataRoot+"/") && unitPattern(parent).MatchString(name):
		d.addUnit(route, unitKind(parent))
	case entry.IsDir() && (parent == exampleRoot+"/" || parent == kataRoot+"/"):
		d.unplaced(route, "code folder "+route+" is not a canonical unit")
	case !entry.IsDir() && (parent == exampleRoot+"/" || parent == kataRoot+"/") && flatPattern.MatchString(name):
		d.findings = append(d.findings, finding.Finding{
			Code:    finding.LayoutFlatExample,
			Course:  d.course,
			Path:    route,
			Line:    1,
			Message: "flat example file " + route + " must become a unit folder",
		})
	case entry.IsDir() && name == "code":
		d.noteStrayCodeDir(route)
	default:
		// Anything else is not code placement: shared files directly under
		// a code root, lessons, and their folders. Every run reads shared
		// files; they are never findings.
	}
}

// unitPattern returns the unit directory pattern for a code root.
func unitPattern(parent string) *regexp.Regexp {
	if parent == kataRoot+"/" {
		return kataPattern
	}
	return examplePattern
}

// unitKind returns the unit kind for a code root.
func unitKind(parent string) string {
	if parent == kataRoot+"/" {
		return KindKata
	}
	return KindExample
}

// addUnit records one canonical unit folder.
func (d *discovery) addUnit(route, kind string) {
	if d.unitDirs == nil {
		d.unitDirs = map[string]bool{}
	}
	d.unitDirs[route] = true
	d.units = append(d.units, Unit{Course: d.course, Path: route, Kind: kind})
}

// unplaced records one non-unit code folder.
func (d *discovery) unplaced(route, message string) {
	d.findings = append(d.findings, finding.Finding{
		Code:    finding.LayoutUnplacedCode,
		Course:  d.course,
		Path:    route,
		Line:    0,
		Message: message,
	})
}

// insideUnit reports whether a path sits strictly inside a discovered unit.
func (d *discovery) insideUnit(route string) bool {
	for dir := range d.unitDirs {
		if route != dir && underRoot(route, dir) {
			return true
		}
	}
	return false
}

// noteStrayCodeDir remembers a code folder outside the canonical roots for
// the files check. Canonical roots never count as stray.
func (d *discovery) noteStrayCodeDir(route string) {
	if route == exampleRoot || route == kataRoot || route == capstoneRoot {
		return
	}
	if d.stray == nil {
		d.stray = map[string]bool{}
	}
	d.stray[route] = true
}

// reportStrayCodeDirs reports every stray code folder holding files, then
// sorts units and findings into path order.
func (d *discovery) reportStrayCodeDirs(fsys fs.FS) {
	dirs := make([]string, 0, len(d.stray))
	for dir := range d.stray {
		dirs = append(dirs, dir)
	}
	sort.Strings(dirs)
	for _, dir := range dirs {
		if !d.insideUnit(dir) && dirHasFiles(fsys, dir) {
			d.unplaced(dir, "code folder "+dir+" is not a canonical unit")
		}
	}
	sort.Slice(d.units, func(i, j int) bool { return d.units[i].Path < d.units[j].Path })
	sort.Slice(d.findings, func(i, j int) bool {
		if d.findings[i].Path != d.findings[j].Path {
			return d.findings[i].Path < d.findings[j].Path
		}
		return d.findings[i].Code < d.findings[j].Code
	})
}

// dirHasFiles reports whether a folder holds any file at any depth.
func dirHasFiles(fsys fs.FS, dir string) bool {
	found := false
	_ = fs.WalkDir(fsys, dir, func(_ string, entry fs.DirEntry, err error) error {
		if err == nil && !entry.IsDir() && !found {
			found = true
		}
		return nil
	})
	return found
}
