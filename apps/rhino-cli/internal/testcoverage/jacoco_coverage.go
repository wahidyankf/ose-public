package testcoverage

import (
	"encoding/xml"
	"fmt"
	"os"
)

// jacocoReport represents the top-level <report> element in a JaCoCo XML file.
type jacocoReport struct {
	XMLName  xml.Name        `xml:"report"`
	Packages []jacocoPackage `xml:"package"`
}

// jacocoPackage represents a <package> element.
type jacocoPackage struct {
	Name        string             `xml:"name,attr"`
	SourceFiles []jacocoSourceFile `xml:"sourcefile"`
}

// jacocoSourceFile represents a <sourcefile> element containing line data.
type jacocoSourceFile struct {
	Name  string       `xml:"name,attr"`
	Lines []jacocoLine `xml:"line"`
}

// jacocoLine represents a <line> element with instruction and branch counters.
type jacocoLine struct {
	Nr int `xml:"nr,attr"`
	Mi int `xml:"mi,attr"` // missed instructions
	Ci int `xml:"ci,attr"` // covered instructions
	Mb int `xml:"mb,attr"` // missed branches
	Cb int `xml:"cb,attr"` // covered branches
}

// parseJaCoCo parses a JaCoCo XML report file.
func parseJaCoCo(filename string) (jacocoReport, error) {
	data, err := os.ReadFile(filename)
	if err != nil {
		return jacocoReport{}, fmt.Errorf("file not found: %s", filename)
	}

	var report jacocoReport
	if err := xml.Unmarshal(data, &report); err != nil {
		return jacocoReport{}, fmt.Errorf("invalid JaCoCo XML: %w", err)
	}
	return report, nil
}

// ComputeJaCoCoResult computes line coverage from a JaCoCo XML report using a standard line-based algorithm.
//
// For each <line> element:
//   - ci > 0 AND mb == 0 → Covered
//   - ci > 0 AND mb > 0  → Partial
//   - ci == 0             → Missed
//
// Coverage % = covered / (covered + partial + missed)
func ComputeJaCoCoResult(filename string, threshold float64) (Result, error) {
	report, err := parseJaCoCo(filename)
	if err != nil {
		return Result{}, err
	}

	covered, partial, missed := 0, 0, 0
	var perFile []FileResult

	for _, pkg := range report.Packages {
		for _, sf := range pkg.SourceFiles {
			fc, fp, fm := 0, 0, 0
			for _, line := range sf.Lines {
				if line.Ci > 0 {
					if line.Mb > 0 {
						fp++
					} else {
						fc++
					}
				} else {
					fm++
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
			filePath := pkg.Name + "/" + sf.Name
			perFile = append(perFile, FileResult{
				Path: filePath, Covered: fc, Partial: fp, Missed: fm, Total: ft, Pct: fpct,
			})
		}
	}

	total := covered + partial + missed
	pct := 100.0
	if total > 0 {
		pct = 100.0 * float64(covered) / float64(total)
	}

	return Result{
		File:      filename,
		Format:    FormatJaCoCo,
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
