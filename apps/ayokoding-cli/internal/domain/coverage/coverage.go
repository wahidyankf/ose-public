// Package coverage assesses static harness coverage per course: every
// unit covered, validation and sync clean, fences counted.
package coverage

import (
	"fmt"
	"strings"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/anchors"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// illustrationMarker excuses one code fence from anchoring. It repeats the
// sync contract literal: the sync check owns the rule, coverage only
// counts what it excuses.
const illustrationMarker = "<!-- harness: illustration -->"

// proseInfos are the fence info first words that need no anchor. They
// repeat the sync contract set: the sync check owns the rule, coverage
// only counts what it excuses.
var proseInfos = map[string]bool{
	"text": true, "plaintext": true, "mermaid": true, "markdown": true, "md": true,
}

// CodeBelowMinimum reports coverage below the required minimum.
const CodeBelowMinimum = "ayokoding.coverage.below-minimum"

// FenceCounts holds one lesson's fence census: code fences with anchored
// and illustration subsets.
type FenceCounts struct {
	Code         int
	Anchored     int
	Illustration int
}

// Course is one assessed course: the static inputs with the assessed
// Covered flag.
type Course struct {
	Slug               string
	OptedIn            bool
	Applicable         bool
	Units              int
	CoveredUnits       int
	CodeFences         int
	AnchoredFences     int
	IllustrationFences int
	StaticUnits        int
	Clean              bool
	Covered            bool
}

// Report is the assessed coverage: every course with the covered and
// applicable totals and the covered percentage over applicable only.
type Report struct {
	Courses    []Course
	Applicable int
	Covered    int
	Percent    int
}

// CountFences counts one lesson's fences: column-zero spans whose info
// names code, with the anchored and illustration subsets.
func CountFences(lesson string) FenceCounts {
	counts := FenceCounts{}
	lines := strings.Split(lesson, "\n")
	for index := 0; index < len(lines); index++ {
		info, ok := fenceInfo(lines[index])
		if !ok {
			continue
		}
		if isProseInfo(info) {
			index = fenceClose(lines, index)
			continue
		}
		counts.Code++
		switch classOf(lines, index) {
		case fenceAnchored:
			counts.Anchored++
		case fenceIllustration:
			counts.Illustration++
		case fenceBare:
			// Unanchored code fences count toward the code total only.
		}
		index = fenceClose(lines, index)
	}
	return counts
}

// Assess marks every opted-in, applicable, fully covered, clean course
// covered and reports the covered percentage over applicable courses
// only.
func Assess(courses []Course) Report {
	report := Report{Courses: append([]Course(nil), courses...)}
	for index := range report.Courses {
		course := &report.Courses[index]
		course.Covered = course.OptedIn && course.Applicable && course.Clean &&
			course.CoveredUnits == course.Units
		if course.Applicable {
			report.Applicable++
		}
		if course.Covered {
			report.Covered++
		}
	}
	if report.Applicable != 0 {
		report.Percent = report.Covered * 100 / report.Applicable
	}
	return report
}

// BelowMinimum reports the below-minimum finding when the covered
// percentage is below the minimum.
func (report Report) BelowMinimum(minimum int) (finding.Finding, bool) {
	if report.Percent >= minimum {
		return finding.Finding{Code: "", Course: "", Path: "", Line: 0, Message: ""}, false
	}
	return finding.Finding{
		Code:    CodeBelowMinimum,
		Course:  "",
		Path:    "",
		Line:    0,
		Message: fmt.Sprintf("coverage %d%% is below the minimum %d%%", report.Percent, minimum),
	}, true
}

// fenceClass names what the previous non-blank line says about one code
// fence.
type fenceClass int

// Fence classes: claimed by an anchor, excused as an illustration, or
// neither.
const (
	fenceBare fenceClass = iota
	fenceAnchored
	fenceIllustration
)

// classOf classes one code fence by its previous non-blank line: an
// anchor claims it, the illustration marker excuses it.
func classOf(lines []string, open int) fenceClass {
	for above := open - 1; above >= 0; above-- {
		if strings.TrimSpace(lines[above]) == "" {
			continue
		}
		if lines[above] == illustrationMarker {
			return fenceIllustration
		}
		if _, ok := anchors.ParseLine(lines[above], above+1); ok {
			return fenceAnchored
		}
		return fenceBare
	}
	return fenceBare
}

// fenceInfo returns the info string of a column-zero fence opening.
func fenceInfo(line string) (string, bool) {
	trimmed := strings.TrimLeft(line, " \t")
	if len(trimmed) != len(line) {
		return "", false
	}
	if len(trimmed) < 3 {
		return "", false
	}
	char := trimmed[0]
	if char != '`' && char != '~' {
		return "", false
	}
	length := 0
	for length < len(trimmed) && trimmed[length] == char {
		length++
	}
	if length < 3 {
		return "", false
	}
	return strings.TrimSpace(trimmed[length:]), true
}

// fenceClose returns the closing line of the fence opening at index, or
// the last line when it never closes, so inner fences never double
// count.
func fenceClose(lines []string, open int) int {
	char := lines[open][0]
	length := fenceRun(lines[open])
	for end := open + 1; end < len(lines); end++ {
		trimmed := strings.Trim(lines[end], " \t")
		if len(trimmed) >= length && isFenceRun(trimmed, char) {
			return end
		}
	}
	return len(lines) - 1
}

// fenceRun measures the opening fence character run.
func fenceRun(line string) int {
	length := 0
	for length < len(line) && line[length] == line[0] {
		length++
	}
	return length
}

// isFenceRun reports whether trimmed holds only the fence character.
func isFenceRun(trimmed string, char byte) bool {
	return strings.Trim(trimmed, string([]byte{char})) == ""
}

// isProseInfo reports whether a fence info string opens a prose fence.
func isProseInfo(info string) bool {
	first, _, _ := strings.Cut(info, " ")
	return proseInfos[strings.ToLower(first)]
}
