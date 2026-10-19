// Package content checks lesson fences against the course files they
// show and repairs anchored fences from those files. The file is the
// source of truth: the check compares fence bodies with file bytes, and
// the rewrite copies file bytes into fences. It reads courses through an
// fs.FS value and writes repairs only through WriteUpdates.
package content

import (
	"bytes"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path"
	"path/filepath"
	"slices"
	"sort"
	"strings"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/anchors"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/layout"
)

// Closed sync finding codes. They live beside the check that reports them;
// the merge may relocate them into the finding package without changing
// their values.
const (
	CodeMismatch           = "ayokoding.sync.mismatch"
	CodeMissingFile        = "ayokoding.sync.missing-file"
	CodeBadRange           = "ayokoding.sync.bad-range"
	CodeAnchorWithoutFence = "ayokoding.sync.anchor-without-fence"
	CodeIndentedFence      = "ayokoding.sync.indented-fence"
	CodeUnanchoredFence    = "ayokoding.sync.unanchored-fence"
	CodeUnanchoredOutput   = "ayokoding.sync.unanchored-output"
	CodeUnreferencedUnit   = "ayokoding.sync.unreferenced-unit"
	CodeCRLF               = "ayokoding.sync.crlf"
)

// Code roots below which Markdown is course code, never a lesson. They
// mirror the layout package; the merge may export one shared source.
const (
	exampleRoot  = "learning/code"
	kataRoot     = "drilling/code"
	capstoneRoot = "learning/capstone/code"
)

// illustrationMarker excuses one code fence from anchoring. outputMarker
// prefixes the fence class that must anchor to an expected-output file.
const (
	illustrationMarker = "<!-- harness: illustration -->"
	outputMarker       = "**Output"
)

// proseInfos are the fence info first words that need no anchor.
var proseInfos = map[string]bool{
	"text": true, "plaintext": true, "mermaid": true, "markdown": true, "md": true,
}

// Static repair failures: the sync contract names the file it refuses, so
// every refused write wraps one of these instead of minting a new error.
var (
	errTargetIsFolder    = errors.New("content: sync target is a folder")
	errLessonNotWritable = errors.New("content: lesson is not writable")
)

// cacheEntry holds one target file read: the bytes or the failure.
type cacheEntry struct {
	data []byte
	err  error
}

// scanner carries one Check walk: the target file cache and every anchor
// target seen, for the unreferenced-unit report.
type scanner struct {
	course  string
	fsys    fs.FS
	cache   map[string]cacheEntry
	targets map[string]bool
}

// fenceSpan is one column-zero fence: the opening and closing line indexes
// with the closing index at len(lines) when the fence never closes.
type fenceSpan struct {
	open     int
	close    int
	char     byte
	length   int
	info     string
	unclosed bool
}

// attachment binds an anchor line to the fence its next non-blank line
// opens: a column-zero fence, an indented one, or nothing.
type attachment struct {
	fence    fenceSpan
	found    bool
	indented bool
}

// Check scans every Markdown file of one course outside its code folders
// and reports every sync finding in lesson and line order.
func Check(course string, fsys fs.FS) []finding.Finding {
	units, _ := layout.Discover(course, fsys)
	scan := &scanner{course: course, fsys: fsys, cache: map[string]cacheEntry{}, targets: map[string]bool{}}
	findings := []finding.Finding{}
	for _, lesson := range lessonPaths(fsys) {
		findings = append(findings, scan.lesson(lesson)...)
	}
	for _, unit := range units {
		if !referenced(unit.Path, scan.targets) {
			findings = append(findings, finding.Finding{
				Code:    CodeUnreferencedUnit,
				Course:  course,
				Path:    unit.Path,
				Line:    0,
				Message: "no lesson anchor targets a file inside unit " + unit.Path,
			})
		}
	}
	return findings
}

// referenced reports whether any anchor path sits inside the unit folder.
func referenced(unit string, targets map[string]bool) bool {
	for target := range targets {
		if target == unit || strings.HasPrefix(target, unit+"/") {
			return true
		}
	}
	return false
}

// lessonPaths lists every course Markdown file outside the code folders.
func lessonPaths(fsys fs.FS) []string {
	var lessons []string
	_ = fs.WalkDir(fsys, ".", func(route string, entry fs.DirEntry, err error) error {
		if err == nil && !entry.IsDir() && strings.HasSuffix(entry.Name(), ".md") {
			if !underRoot(route, exampleRoot) && !underRoot(route, kataRoot) && !underRoot(route, capstoneRoot) {
				lessons = append(lessons, route)
			}
		}
		return nil
	})
	return lessons
}

// underRoot reports whether a course-relative path sits below a root.
func underRoot(route, root string) bool {
	return route == root || strings.HasPrefix(route, root+"/")
}

// lesson scans one lesson file: anchored fences against their targets,
// then every fence no anchor claimed. Findings leave in line order.
func (scan *scanner) lesson(lesson string) []finding.Finding {
	data, err := fs.ReadFile(scan.fsys, lesson)
	if err != nil {
		return []finding.Finding{}
	}
	lines, trailing := splitLines(string(data))
	if lines == nil {
		return []finding.Finding{}
	}
	fences := findFences(lines)
	attached := map[int]bool{}
	findings := []finding.Finding{}
	for index, line := range lines {
		anchor, ok := anchors.ParseLine(line, index+1)
		if !ok {
			continue
		}
		scan.targets[anchor.Path] = true
		attachedTo := attachFence(lines, fences, index)
		switch {
		case !attachedTo.found:
			findings = append(findings, finding.Finding{
				Code:    CodeAnchorWithoutFence,
				Course:  scan.course,
				Path:    lesson,
				Line:    anchor.Line,
				Message: "anchor to " + anchor.Path + " has no fence on its next non-blank line",
			})
		case attachedTo.indented:
			findings = append(findings, finding.Finding{
				Code:    CodeIndentedFence,
				Course:  scan.course,
				Path:    lesson,
				Line:    anchor.Line,
				Message: "anchored fence to " + anchor.Path + " must start at column 0",
			})
		default:
			attached[attachedTo.fence.open] = true
			findings = append(findings, scan.compare(lesson, lines, trailing, attachedTo.fence, anchor)...)
		}
	}
	for _, open := range sortedOpens(fences) {
		if attached[open] {
			continue
		}
		if found := classifyUnattached(scan.course, lesson, lines, fences[open]); found != nil {
			findings = append(findings, *found)
		}
	}
	sort.SliceStable(findings, func(i, j int) bool {
		if findings[i].Line != findings[j].Line {
			return findings[i].Line < findings[j].Line
		}
		return findings[i].Code < findings[j].Code
	})
	return findings
}

// sortedOpens lists fence openings in line order.
func sortedOpens(fences map[int]fenceSpan) []int {
	opens := make([]int, 0, len(fences))
	for open := range fences {
		opens = append(opens, open)
	}
	sort.Ints(opens)
	return opens
}

// attachFence binds an anchor line to the fence its next non-blank line
// opens: a column-zero span, an indented opening, or nothing at all.
func attachFence(lines []string, fences map[int]fenceSpan, index int) attachment {
	next, hasNext := anchors.NextNonBlank(lines, index)
	if !hasNext || !isFenceOpening(lines[next]) {
		return attachment{}
	}
	if isIndented(lines[next]) {
		return attachment{found: true, indented: true}
	}
	fence, claimed := fences[next]
	if !claimed {
		return attachment{}
	}
	return attachment{fence: fence, found: true}
}

// read returns one target file: the bytes, or an error when the target is
// missing or a folder.
func (scan *scanner) read(target string) ([]byte, error) {
	if entry, ok := scan.cache[target]; ok {
		return entry.data, entry.err
	}
	data, err := readTarget(scan.fsys, target)
	scan.cache[target] = cacheEntry{data: data, err: err}
	return data, err
}

// readTarget reads one course-relative target file.
func readTarget(fsys fs.FS, target string) ([]byte, error) {
	info, err := fs.Stat(fsys, target)
	if err != nil {
		return nil, fmt.Errorf("content: read target %s: %w", target, err)
	}
	if info.IsDir() {
		return nil, fmt.Errorf("%w: %s", errTargetIsFolder, target)
	}
	data, err := fs.ReadFile(fsys, target)
	if err != nil {
		return nil, fmt.Errorf("content: read target %s: %w", target, err)
	}
	return data, nil
}

// single builds one finding on a lesson line.
func (scan *scanner) single(lesson string, line int, code, message string) []finding.Finding {
	return []finding.Finding{{Code: code, Course: scan.course, Path: lesson, Line: line, Message: message}}
}

// compare checks one anchored fence against its target. The order is
// fixed: a malformed or reversed range first, then the file's existence,
// its line endings, the range bounds, the output-file rule, and finally
// the body bytes.
func (scan *scanner) compare(lesson string, lines []string, trailing bool, fence fenceSpan, anchor anchors.Anchor) []finding.Finding {
	if anchor.Malformed {
		return scan.single(lesson, anchor.Line, CodeBadRange, "anchor range to "+anchor.Path+" is malformed")
	}
	if anchor.HasRange && (anchor.Start < 1 || anchor.End < anchor.Start) {
		return scan.single(lesson, anchor.Line, CodeBadRange, "anchor range to "+anchor.Path+" is reversed")
	}
	data, err := scan.read(anchor.Path)
	if err != nil {
		return scan.single(lesson, anchor.Line, CodeMissingFile,
			"anchor path "+anchor.Path+" does not resolve inside the course")
	}
	if bytes.Contains(data, []byte("\r\n")) {
		return scan.single(lesson, anchor.Line, CodeCRLF, "target file "+anchor.Path+" uses CRLF line endings")
	}
	fileLines, fileNL := splitLines(string(data))
	selected, ok := anchor.Select(fileLines)
	if !ok {
		return scan.single(lesson, anchor.Line, CodeBadRange,
			fmt.Sprintf("anchor range to %s selects outside its %d lines", anchor.Path, len(fileLines)))
	}
	if anchor.Labelled && isOutputLabel(anchor.Label) && !isExpectedFile(anchor.Path) {
		return scan.single(lesson, anchor.Line, CodeUnanchoredOutput,
			"output block must be anchored to an expected-output file, not "+anchor.Path)
	}
	expected := strings.Join(selected, "\n")
	if fileNL {
		expected += "\n"
	}
	body := fenceBody(lines, fence, trailing)
	if body == expected {
		return []finding.Finding{}
	}
	number, want, got := firstDifference(body, expected)
	return scan.single(lesson, anchor.Line, CodeMismatch,
		fmt.Sprintf("fence body line %d differs: expected %q found %q", number, want, got))
}

// classifyUnattached classes one fence no anchor claimed: output blocks
// must anchor to an expected file, illustrations and prose pass, and every
// other code fence is reported.
func classifyUnattached(course, lesson string, lines []string, fence fenceSpan) *finding.Finding {
	if above, hasAbove := prevNonBlank(lines, fence.open); hasAbove {
		if strings.HasPrefix(lines[above], outputMarker) {
			return &finding.Finding{
				Code: CodeUnanchoredOutput, Course: course, Path: lesson, Line: fence.open + 1,
				Message: "output block must be anchored to an expected-output file",
			}
		}
		if lines[above] == illustrationMarker {
			return nil
		}
	}
	if isProseInfo(fence.info) {
		return nil
	}
	return &finding.Finding{
		Code: CodeUnanchoredFence, Course: course, Path: lesson, Line: fence.open + 1,
		Message: "code fence is neither anchored nor marked as an illustration",
	}
}

// isOutputLabel reports whether a labelled anchor carries an output label.
func isOutputLabel(label string) bool {
	return strings.HasPrefix(label, "Output")
}

// isExpectedFile reports whether a target is an expected-output file: a
// .txt file below an expected folder.
func isExpectedFile(target string) bool {
	if !strings.HasSuffix(target, ".txt") {
		return false
	}
	return slices.Contains(strings.Split(path.Dir(target), "/"), "expected")
}

// isProseInfo reports whether a fence info string opens a prose fence.
func isProseInfo(info string) bool {
	first, _, _ := strings.Cut(info, " ")
	return proseInfos[strings.ToLower(first)]
}

// splitLines splits text into lines, reporting whether it ended with a
// line feed.
func splitLines(text string) ([]string, bool) {
	trailing := strings.HasSuffix(text, "\n")
	lines := strings.Split(text, "\n")
	if trailing {
		lines = lines[:len(lines)-1]
	}
	return lines, trailing
}

// fenceBody renders the compared body: the lines between the fences joined
// with line feeds, plus one final line feed when the lesson provides one.
func fenceBody(lines []string, fence fenceSpan, trailing bool) string {
	body := strings.Join(lines[fence.open+1:fence.close], "\n")
	if fence.close < len(lines) || trailing {
		body += "\n"
	}
	return body
}

// firstDifference names the first differing line of two bodies.
func firstDifference(body, expected string) (int, string, string) {
	bodyLines := strings.Split(body, "\n")
	expectedLines := strings.Split(expected, "\n")
	for index := range max(len(bodyLines), len(expectedLines)) {
		var bodyLine, expectedLine string
		if index < len(bodyLines) {
			bodyLine = bodyLines[index]
		}
		if index < len(expectedLines) {
			expectedLine = expectedLines[index]
		}
		if bodyLine != expectedLine {
			return index + 1, expectedLine, bodyLine
		}
	}
	return len(expectedLines) + 1, "", ""
}

// prevNonBlank returns the index of the nearest non-blank line before
// index before.
func prevNonBlank(lines []string, before int) (int, bool) {
	for index := before - 1; index >= 0; index-- {
		if strings.TrimSpace(lines[index]) != "" {
			return index, true
		}
	}
	return 0, false
}

// isFenceOpening reports whether a line opens a fence at any indent.
func isFenceOpening(line string) bool {
	length, _, _, opened := fenceOpening(line)
	return opened && length >= 3
}

// isIndented reports whether a line carries leading spaces or tabs.
func isIndented(line string) bool {
	trimmed := strings.TrimLeft(line, " \t")
	return len(trimmed) != len(line)
}

// fenceOpening parses a fence opening into its run length, character, and
// info string, reporting whether the line opens a fence.
func fenceOpening(line string) (int, byte, string, bool) {
	trimmed := strings.TrimLeft(line, " \t")
	if len(trimmed) < 3 {
		return 0, 0, "", false
	}
	char := trimmed[0]
	if char != '`' && char != '~' {
		return 0, 0, "", false
	}
	length := 0
	for range len(trimmed) {
		if trimmed[length] != char {
			break
		}
		length++
	}
	if length < 3 {
		return 0, 0, "", false
	}
	return length, char, strings.TrimSpace(trimmed[length:]), true
}

// fenceClosing reports whether a line closes a fence of the character and
// length: a run of at least length with nothing else on the line.
func fenceClosing(line string, char byte, length int) bool {
	trimmed := strings.Trim(line, " \t")
	if len(trimmed) < length {
		return false
	}
	for index := range len(trimmed) {
		if trimmed[index] != char {
			return false
		}
	}
	return true
}

// findFences collects every column-zero fence span in a lesson, keyed by
// opening line index.
func findFences(lines []string) map[int]fenceSpan {
	fences := map[int]fenceSpan{}
	for index := 0; index < len(lines); index++ {
		if isIndented(lines[index]) {
			continue
		}
		length, char, info, ok := fenceOpening(lines[index])
		if !ok {
			continue
		}
		fence := fenceSpan{open: index, close: len(lines), char: char, length: length, info: info, unclosed: true}
		for end := index + 1; end < len(lines); end++ {
			if fenceClosing(lines[end], char, length) {
				fence.close = end
				fence.unclosed = false
				break
			}
		}
		fences[index] = fence
		// A closing line never reopens: resume past it.
		index = fence.close
	}
	return fences
}

// RewriteLesson returns the lesson with every resolvable anchored fence
// body replaced by its target bytes. Resolve maps a course-relative target
// path to its file bytes and reports false when the target is missing. It
// lengthens a fence past an inner fence of the same character, never
// touches unanchored fences, and reports changed=false when the lesson
// already matches its files.
func RewriteLesson(lesson string, resolve func(string) ([]byte, bool)) (string, bool) {
	lines, trailing := splitLines(lesson)
	if lines == nil {
		return lesson, false
	}
	fences := findFences(lines)
	opens := sortedOpens(fences)
	changed := false
	for _, open := range slices.Backward(opens) {
		var fenceChanged bool
		lines, fenceChanged = rewriteFence(lines, fences[open], resolve)
		changed = changed || fenceChanged
	}
	out := strings.Join(lines, "\n")
	if trailing {
		out += "\n"
	}
	return out, changed
}

// rewriteFence rewrites one fence body, reporting the working lines and
// whether they changed. Later fences rewrite first, so earlier line
// indexes stay valid.
func rewriteFence(lines []string, fence fenceSpan, resolve func(string) ([]byte, bool)) ([]string, bool) {
	if lines == nil {
		return nil, false
	}
	above, hasAbove := prevNonBlank(lines, fence.open)
	if !hasAbove {
		return lines, false
	}
	anchor, parsed := anchors.ParseLine(lines[above], above+1)
	if !parsed || anchor.Malformed {
		return lines, false
	}
	if next, hasNext := anchors.NextNonBlank(lines, above); !hasNext || next != fence.open {
		return lines, false
	}
	data, resolved := resolve(anchor.Path)
	if !resolved || bytes.Contains(data, []byte("\r\n")) {
		return lines, false
	}
	fileLines, _ := splitLines(string(data))
	selected, selectedOK := anchor.Select(fileLines)
	if !selectedOK {
		return lines, false
	}
	body := rewriteBody(selected)
	current := lines[fence.open+1 : fence.close]
	length := rewriteLength(body, fence)
	if slices.Equal(current, body) && length == fence.length {
		return lines, false
	}
	out := make([]string, 0, len(lines)-len(current)+len(body)+1)
	out = append(out, lines[:fence.open+1]...)
	if length > fence.length {
		out[len(out)-1] = lengthenedOpen(lines[fence.open], fence, length)
	}
	out = append(out, body...)
	if fence.unclosed {
		return out, true
	}
	closing := lines[fence.close]
	if length > fence.length {
		closing = strings.Repeat(string(fence.char), length)
	}
	out = append(out, closing)
	return append(out, lines[fence.close+1:]...), true
}

// rewriteBody renders selected target lines as lesson body lines.
func rewriteBody(selected []string) []string {
	text := strings.Join(selected, "\n")
	if text == "" {
		return nil
	}
	return strings.Split(text, "\n")
}

// rewriteLength grows the fence past any inner fence of the same
// character: a body line holding only a run of at least length would close
// the fence early.
func rewriteLength(body []string, fence fenceSpan) int {
	length := fence.length
	for _, line := range body {
		if run, ok := closingRun(line, fence.char); ok && run >= length {
			length = run + 1
		}
	}
	return length
}

// closingRun reports the run length when a line holds only fence
// characters with surrounding blanks.
func closingRun(line string, char byte) (int, bool) {
	trimmed := strings.Trim(line, " \t")
	if trimmed == "" || strings.Trim(trimmed, string(char)) != "" {
		return 0, false
	}
	return len(trimmed), true
}

// lengthenedOpen extends a fence opening past its body, keeping the info
// string it carried.
func lengthenedOpen(open string, fence fenceSpan, length int) string {
	trimmed := strings.TrimLeft(open, " \t")
	leading := open[:len(open)-len(trimmed)]
	return leading + strings.Repeat(string(fence.char), length) + trimmed[fence.length:]
}

// WriteUpdates writes updated lesson bytes into the course directory. It
// rewrites listed lessons only, creates no files, and leaves every written
// file with mode 0644.
func WriteUpdates(courseDir string, updates map[string][]byte) error {
	names := make([]string, 0, len(updates))
	for name := range updates {
		names = append(names, name)
	}
	sort.Strings(names)
	for _, name := range names {
		if err := writeLesson(courseDir, name, updates[name]); err != nil {
			return err
		}
	}
	return nil
}

// writeLesson writes one lesson update, refusing to create files or leave
// the course directory.
func writeLesson(courseDir, name string, data []byte) error {
	if name == "" || path.IsAbs(name) || path.Clean(name) != name {
		return fmt.Errorf("%w: %q", errLessonNotWritable, name)
	}
	target := filepath.Join(courseDir, filepath.FromSlash(name))
	info, err := os.Stat(target)
	if err != nil {
		return fmt.Errorf("content: write lesson %s: %w", name, err)
	}
	if info.IsDir() {
		return fmt.Errorf("%w: %s", errLessonNotWritable, name)
	}
	if err := os.WriteFile(target, data, 0o644); err != nil {
		return fmt.Errorf("content: write lesson %s: %w", name, err)
	}
	//nolint:gosec // repaired lessons are committed course text: readers and formatters expect 0644.
	if err := os.Chmod(target, 0o644); err != nil {
		return fmt.Errorf("content: write lesson %s: %w", name, err)
	}
	return nil
}
