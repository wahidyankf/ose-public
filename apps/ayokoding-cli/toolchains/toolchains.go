// Package toolchains embeds the toolchain catalog and each derived image
// Dockerfile, so a built binary carries the exact catalog it was tested
// with.
package toolchains

import (
	"embed"
	"io/fs"
)

//go:embed catalog.yaml */Dockerfile
var embedded embed.FS

// Files returns the embedded toolchain catalog files, so tests can inject a
// pinned test catalog through the same catalog.Load call the CLI uses.
func Files() fs.FS {
	return embedded
}

// Bytes returns the embedded catalog.yaml bytes for the --version hash.
func Bytes() []byte {
	data, err := embedded.ReadFile("catalog.yaml")
	if err != nil {
		return nil
	}
	return data
}
