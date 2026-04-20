package testcoverage

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"
)

// lcovFile holds per-file coverage data from an LCOV file.
type lcovFile struct {
	path     string        // source file path (from SF: record)
	daLines  map[int]int   // line_no -> count
	brdaData map[int][]int // line_no -> branch counts
}

// parseLCOV parses an LCOV file and returns per-file coverage data.
func parseLCOV(filename string) ([]lcovFile, error) {
	f, err := os.Open(filename)
	if err != nil {
		return nil, fmt.Errorf("file not found: %s", filename)
	}
	defer func() { _ = f.Close() }()

	var files []lcovFile
	current := lcovFile{
		daLines:  make(map[int]int),
		brdaData: make(map[int][]int),
	}

	scanner := bufio.NewScanner(f)
	// Use a larger buffer for large LCOV files
	buf := make([]byte, 0, 64*1024)
	scanner.Buffer(buf, 10*1024*1024)

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		switch {
		case strings.HasPrefix(line, "SF:"):
			current.path = line[3:]
		case strings.HasPrefix(line, "DA:"):
			parts := strings.SplitN(line[3:], ",", 3)
			if len(parts) >= 2 {
				ln, err1 := strconv.Atoi(parts[0])
				cnt, err2 := strconv.Atoi(parts[1])
				if err1 == nil && err2 == nil {
					// Duplicate DA lines → take max count
					if existing, ok := current.daLines[ln]; !ok || cnt > existing {
						current.daLines[ln] = cnt
					}
				}
			}
		case strings.HasPrefix(line, "BRDA:"):
			parts := strings.SplitN(line[5:], ",", 4)
			if len(parts) >= 4 {
				ln, err1 := strconv.Atoi(parts[0])
				cntStr := parts[3]
				if err1 == nil {
					var cnt int
					if cntStr != "-" && cntStr != "" {
						cnt, _ = strconv.Atoi(cntStr)
					}
					current.brdaData[ln] = append(current.brdaData[ln], cnt)
				}
			}
		case line == "end_of_record":
			files = append(files, current)
			current = lcovFile{
				daLines:  make(map[int]int),
				brdaData: make(map[int][]int),
			}
		}
	}
	return files, scanner.Err()
}

// ComputeLCOVResult computes line coverage from an LCOV file using a standard line-based algorithm.
func ComputeLCOVResult(filename string, threshold float64) (Result, error) {
	files, err := parseLCOV(filename)
	if err != nil {
		return Result{}, err
	}

	covered, partial, missed := 0, 0, 0
	var perFile []FileResult

	for _, file := range files {
		fc, fp, fm := 0, 0, 0

		// Classify DA lines
		for lineNo, count := range file.daLines {
			branches := file.brdaData[lineNo]
			if count > 0 {
				if len(branches) > 0 && !allPositive(branches) {
					fp++
				} else {
					fc++
				}
			} else {
				fm++
			}
		}

		// Classify BRDA-only lines (in BRDA but not DA)
		for lineNo, branchCounts := range file.brdaData {
			if _, inDA := file.daLines[lineNo]; !inDA {
				if allPositive(branchCounts) {
					fc++
				} else if anyPositive(branchCounts) {
					fp++
				} else {
					fm++
				}
			}
		}

		covered += fc
		partial += fp
		missed += fm

		ft := fc + fp + fm
		fpct := 100.0
		if ft > 0 {
			fpct = 100.0 * float64(fc) / float64(ft)
		}
		perFile = append(perFile, FileResult{
			Path: file.path, Covered: fc, Partial: fp, Missed: fm, Total: ft, Pct: fpct,
		})
	}

	total := covered + partial + missed
	pct := 100.0
	if total > 0 {
		pct = 100.0 * float64(covered) / float64(total)
	}

	return Result{
		File:      filename,
		Format:    FormatLCOV,
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

func allPositive(counts []int) bool {
	for _, c := range counts {
		if c <= 0 {
			return false
		}
	}
	return true
}

func anyPositive(counts []int) bool {
	for _, c := range counts {
		if c > 0 {
			return true
		}
	}
	return false
}
