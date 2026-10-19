// Package anchors parses the lesson anchors that tie each lesson code
// block to the course file it shows, following the anchor grammar in the
// run contract: a path label or a labelled path, with an optional line
// range. It reads lesson lines only, never the filesystem.
package anchors

import (
	"regexp"
	"strconv"
	"strings"
)

// The two anchor expressions from the run contract. The path label matches
// a bold code span at the start of the line; the labelled path matches a
// bold label followed by a parenthesized code span, with an optional
// trailing colon.
var (
	pathLabel   = regexp.MustCompile("^\\*\\*`([^`]+)`\\*\\*")
	labelled    = regexp.MustCompile("^\\*\\*[^*`]+\\*\\*\\s*\\(`([^`]+)`\\):?\\s*$")
	labelText   = regexp.MustCompile("^\\*\\*([^*`]+)\\*\\*")
	rangeSuffix = regexp.MustCompile("^(.*)#L([0-9]+)-L([0-9]+)$")
)

// Anchor is one parsed lesson anchor line.
type Anchor struct {
	// Line is the 1-based lesson line carrying the anchor.
	Line int
	// Path is the course-relative target path without any range suffix.
	Path string
	// HasRange reports whether a #Lstart-Lend suffix was present.
	HasRange bool
	// Start and End bound the selected lines, 1-based inclusive.
	Start int
	End   int
	// Malformed reports a range suffix that does not parse.
	Malformed bool
	// Labelled reports the **Label** (`path`) form.
	Labelled bool
	// Label carries the label text of the labelled form.
	Label string
}

// ParseLine parses one lesson line as an anchor. It reports ok=false for
// every line that is not an anchor.
func ParseLine(text string, line int) (Anchor, bool) {
	if match := pathLabel.FindStringSubmatch(text); match != nil {
		return splitRange(Anchor{Line: line, Path: match[1]}, match[1]), true
	}
	if match := labelled.FindStringSubmatch(text); match != nil {
		anchor := Anchor{Line: line, Path: match[1], Labelled: true}
		if label := labelText.FindStringSubmatch(text); label != nil {
			anchor.Label = label[1]
		}
		return splitRange(anchor, match[1]), true
	}
	return Anchor{}, false
}

// splitRange separates an optional #Lstart-Lend suffix from the raw path.
// A hash that does not parse as a range marks the anchor malformed, so the
// sync check reports a bad range instead of a missing file.
func splitRange(anchor Anchor, raw string) Anchor {
	if match := rangeSuffix.FindStringSubmatch(raw); match != nil {
		start, startErr := strconv.Atoi(match[2])
		end, endErr := strconv.Atoi(match[3])
		if startErr != nil || endErr != nil {
			anchor.Malformed = true
			return anchor
		}
		anchor.Path = match[1]
		anchor.HasRange = true
		anchor.Start = start
		anchor.End = end
		return anchor
	}
	if strings.Contains(raw, "#") {
		anchor.Malformed = true
	}
	return anchor
}

// NextNonBlank returns the index of the next non-blank line after index
// after. It reports ok=false when no such line exists.
func NextNonBlank(lines []string, after int) (int, bool) {
	if lines == nil {
		return 0, false
	}
	for index := after + 1; index < len(lines); index++ {
		if strings.TrimSpace(lines[index]) != "" {
			return index, true
		}
	}
	return 0, false
}

// Select returns the anchor's lines: the whole file without a range, or
// the selected lines with one. It reports ok=false for a malformed,
// reversed, or out-of-bounds range.
func (anchor Anchor) Select(lines []string) ([]string, bool) {
	if lines == nil {
		return nil, false
	}
	if anchor.Malformed {
		return nil, false
	}
	if !anchor.HasRange {
		return lines, true
	}
	if anchor.Start < 1 || anchor.End < anchor.Start || anchor.End > len(lines) {
		return nil, false
	}
	return lines[anchor.Start-1 : anchor.End], true
}
