package testcoverage

import (
	"encoding/xml"
	"fmt"
	"os"
	"strconv"
	"strings"
)

// coberturaReport represents the top-level <coverage> element in a Cobertura XML file.
type coberturaReport struct {
	XMLName  xml.Name           `xml:"coverage"`
	Packages []coberturaPackage `xml:"packages>package"`
}

// coberturaPackage represents a <package> element.
type coberturaPackage struct {
	Name    string           `xml:"name,attr"`
	Classes []coberturaClass `xml:"classes>class"`
}

// coberturaClass represents a <class> element.
type coberturaClass struct {
	Name     string          `xml:"name,attr"`
	Filename string          `xml:"filename,attr"`
	Lines    []coberturaLine `xml:"lines>line"`
}

// coberturaLine represents a <line> element with hit count and optional branch coverage.
type coberturaLine struct {
	Number            int    `xml:"number,attr"`
	Hits              int    `xml:"hits,attr"`
	Branch            bool   `xml:"branch,attr"`
	ConditionCoverage string `xml:"condition-coverage,attr"`
}

// parseCobertura parses a Cobertura XML report file.
func parseCobertura(filename string) (coberturaReport, error) {
	data, err := os.ReadFile(filename)
	if err != nil {
		return coberturaReport{}, fmt.Errorf("file not found: %s", filename)
	}

	var report coberturaReport
	if err := xml.Unmarshal(data, &report); err != nil {
		return coberturaReport{}, fmt.Errorf("invalid Cobertura XML: %w", err)
	}
	return report, nil
}

// parseBranchCoverage extracts the fraction from a condition-coverage attribute.
// Format: "50% (1/2)" → covered=1, total=2.
func parseBranchCoverage(condCov string) (covered, total int) {
	// Find the parenthesized fraction "(n/m)"
	start := strings.Index(condCov, "(")
	end := strings.Index(condCov, ")")
	if start < 0 || end < 0 || end <= start {
		return 0, 0
	}
	fraction := condCov[start+1 : end]
	parts := strings.SplitN(fraction, "/", 2)
	if len(parts) != 2 {
		return 0, 0
	}
	c, err1 := strconv.Atoi(parts[0])
	t, err2 := strconv.Atoi(parts[1])
	if err1 != nil || err2 != nil {
		return 0, 0
	}
	return c, t
}

// ComputeCoberturaResult computes line coverage from a Cobertura XML report using a standard line-based algorithm.
//
// For each <line> element:
//   - hits > 0 AND (not a branch OR all branches covered) → Covered
//   - hits > 0 AND branch with some branches not covered   → Partial
//   - hits == 0                                             → Missed
//
// Coverage % = covered / (covered + partial + missed)
func ComputeCoberturaResult(filename string, threshold float64) (Result, error) {
	report, err := parseCobertura(filename)
	if err != nil {
		return Result{}, err
	}

	covered, partial, missed := 0, 0, 0
	// Group by filename for per-file reporting
	type fileCounts struct{ c, p, m int }
	fileMap := make(map[string]*fileCounts)

	for _, pkg := range report.Packages {
		for _, cls := range pkg.Classes {
			fc := fileMap[cls.Filename]
			if fc == nil {
				fc = &fileCounts{}
				fileMap[cls.Filename] = fc
			}
			for _, line := range cls.Lines {
				if line.Hits > 0 {
					if line.Branch {
						brCov, brTotal := parseBranchCoverage(line.ConditionCoverage)
						if brTotal > 0 && brCov < brTotal {
							fc.p++
						} else {
							fc.c++
						}
					} else {
						fc.c++
					}
				} else {
					fc.m++
				}
			}
		}
	}

	var perFile []FileResult
	for path, fc := range fileMap {
		covered += fc.c
		partial += fc.p
		missed += fc.m
		ft := fc.c + fc.p + fc.m
		fpct := 100.0
		if ft > 0 {
			fpct = 100.0 * float64(fc.c) / float64(ft)
		}
		perFile = append(perFile, FileResult{
			Path: path, Covered: fc.c, Partial: fc.p, Missed: fc.m, Total: ft, Pct: fpct,
		})
	}

	total := covered + partial + missed
	pct := 100.0
	if total > 0 {
		pct = 100.0 * float64(covered) / float64(total)
	}

	return Result{
		File:      filename,
		Format:    FormatCobertura,
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
