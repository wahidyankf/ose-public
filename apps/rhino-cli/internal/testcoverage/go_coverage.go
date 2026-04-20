package testcoverage

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
)

var coverBlockRe = regexp.MustCompile(`^(.+):(\d+)\.\d+,(\d+)\.\d+ \d+ (\d+)$`)

// getModuleNameFrom reads go.mod in the given directory to get the module path.
func getModuleNameFrom(dir string) string {
	f, err := os.Open(filepath.Join(dir, "go.mod"))
	if err != nil {
		return ""
	}
	defer func() { _ = f.Close() }()

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		parts := strings.Fields(strings.TrimSpace(scanner.Text()))
		if len(parts) >= 2 && parts[0] == "module" {
			return parts[1]
		}
	}
	return ""
}

// getSourceLinesFrom returns a map of line_no -> content for a source file
// resolved relative to the given base directory.
func getSourceLinesFrom(baseDir, relPath string) map[int]string {
	f, err := os.Open(filepath.Join(baseDir, relPath))
	if err != nil {
		return nil
	}
	defer func() { _ = f.Close() }()

	lines := make(map[int]string)
	scanner := bufio.NewScanner(f)
	lineNo := 1
	for scanner.Scan() {
		lines[lineNo] = scanner.Text()
		lineNo++
	}
	return lines
}

// isGoCodeLine returns true if the line contains executable Go code.
// Standard Go executable-line filtering:
//   - Blank lines → excluded
//   - Comment-only lines (//) → excluded
//   - Brace-only lines ({ or }) → excluded
//
// Note: ( and ) are NOT excluded (only { and } are filtered).
func isGoCodeLine(content string) bool {
	s := strings.TrimSpace(content)
	if s == "" {
		return false
	}
	if strings.HasPrefix(s, "//") {
		return false
	}
	if s == "{" || s == "}" {
		return false
	}
	return true
}

// coverBlock holds a single coverage block from a cover.out file.
type coverBlock struct {
	filepath  string
	startLine int
	endLine   int
	count     int
}

// parseCoverOut parses a Go cover.out file and returns all coverage blocks.
func parseCoverOut(filename string) ([]coverBlock, error) {
	f, err := os.Open(filename)
	if err != nil {
		return nil, fmt.Errorf("file not found: %s", filename)
	}
	defer func() { _ = f.Close() }()

	var blocks []coverBlock
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if strings.HasPrefix(line, "mode:") || line == "" {
			continue
		}
		m := coverBlockRe.FindStringSubmatch(line)
		if m == nil {
			continue
		}
		sl, _ := strconv.Atoi(m[2])
		el, _ := strconv.Atoi(m[3])
		count, _ := strconv.Atoi(m[4])
		blocks = append(blocks, coverBlock{
			filepath:  m[1],
			startLine: sl,
			endLine:   el,
			count:     count,
		})
	}
	return blocks, scanner.Err()
}

// ComputeGoResult computes line coverage from a Go cover.out file using a standard line-based algorithm.
// Source files are resolved relative to the cover.out's directory (matching the Python script
// behaviour where the script ran from the project's own working directory).
func ComputeGoResult(filename string, threshold float64) (Result, error) {
	blocks, err := parseCoverOut(filename)
	if err != nil {
		return Result{}, err
	}

	// Derive project dir from the cover.out path (mirrors Python cwd behaviour)
	projectDir := filepath.Dir(filename)
	moduleName := getModuleNameFrom(projectDir)

	// Group blocks by file
	fileBlocks := make(map[string][]coverBlock)
	for _, b := range blocks {
		fileBlocks[b.filepath] = append(fileBlocks[b.filepath], b)
	}

	covered, partial, missed := 0, 0, 0
	var perFile []FileResult

	for fp, fblocks := range fileBlocks {
		// Strip module prefix to get a path relative to the project directory
		relPath := fp
		if moduleName != "" && strings.HasPrefix(fp, moduleName+"/") {
			relPath = fp[len(moduleName)+1:]
		}

		source := getSourceLinesFrom(projectDir, relPath)

		// Collect all block counts per line
		lineCounts := make(map[int][]int)
		for _, b := range fblocks {
			for lineNo := b.startLine; lineNo <= b.endLine; lineNo++ {
				lineCounts[lineNo] = append(lineCounts[lineNo], b.count)
			}
		}

		fc, fp2, fm := 0, 0, 0
		for lineNo, counts := range lineCounts {
			// Skip non-code lines when source is available
			if source != nil {
				content, ok := source[lineNo]
				if !ok || !isGoCodeLine(content) {
					continue
				}
			}

			hasCovered := false
			hasMissed := false
			for _, c := range counts {
				if c > 0 {
					hasCovered = true
				} else {
					hasMissed = true
				}
			}

			if hasCovered && !hasMissed {
				fc++
			} else if hasCovered && hasMissed {
				fp2++
			} else {
				fm++
			}
		}

		covered += fc
		partial += fp2
		missed += fm

		ft := fc + fp2 + fm
		fpct := 100.0
		if ft > 0 {
			fpct = 100.0 * float64(fc) / float64(ft)
		}
		perFile = append(perFile, FileResult{
			Path: fp, Covered: fc, Partial: fp2, Missed: fm, Total: ft, Pct: fpct,
		})
	}

	total := covered + partial + missed
	pct := 100.0
	if total > 0 {
		pct = 100.0 * float64(covered) / float64(total)
	}

	return Result{
		File:      filename,
		Format:    FormatGo,
		Covered:   covered,
		Partial:   partial,
		Missed:    missed,
		Total:     total,
		Pct:       pct,
		Threshold: threshold,
		Passed:    pct >= threshold,
		Files:     perFile,
	}, nil
}
