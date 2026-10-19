// Package containerplan turns catalog entries into container build plans:
// exact docker argv, content-hash tags, and context files. It never runs
// anything; the containers adapter executes the plans.
package containerplan

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/catalog"
)

// Invocation is one planned container CLI call: the binary and its argv.
type Invocation struct {
	Binary string
	Args   []string
}

// Build is one planned image build: the tag it produces, the invocation
// that builds it, and the files the adapter places in the build context.
type Build struct {
	Tag        string
	Invoke     Invocation
	Files      map[string][]byte
	ContextDir string
}

// Settings carries the container CLI, the optional buildx cache dir, and
// the optional target platform one x64-only recipe builds for.
type Settings struct {
	ContainerCLI string
	CacheDir     string
	Platform     string
}

// defaultContainerCLI is the Docker command-line interface (decision D4);
// AYOKODING_CONTAINER_CLI overrides it, for example with podman.
const defaultContainerCLI = "docker"

// pinnedPattern requires a repository tag pinned by a full SHA-256.
var pinnedPattern = regexp.MustCompile(`^.+@sha256:[0-9a-f]{64}$`)

// ErrUnpinnedBase reports a base image reference without a digest.
var ErrUnpinnedBase = errors.New("base image is not digest-pinned")

// CLI resolves the container binary, defaulting to docker.
func (settings Settings) CLI() string {
	if settings.ContainerCLI != "" {
		return settings.ContainerCLI
	}
	return defaultContainerCLI
}

// Derived plans a derived image build from an embedded Dockerfile: docker
// buildx build --load --tag ayokoding-toolchain/<id>:<hash>, with local
// cache flags when AYOKODING_BUILDX_CACHE names a directory and --platform
// when the settings name a target platform. The tag hashes the base digest,
// the Dockerfile bytes, and the build arguments, so any recipe byte moves
// it; the platform selects the architecture, never the tag.
func Derived(settings Settings, contextDir, toolID, baseRef string, dockerfile []byte, args []string) (Build, error) {
	digest, err := pinnedDigest(baseRef)
	if err != nil {
		return Build{}, fmt.Errorf("containerplan: plan derived build for %s: %w", toolID, err)
	}
	tag := catalog.DerivedTag(toolID, digest, dockerfile, args)
	return Build{
		Tag: tag,
		Invoke: Invocation{
			Binary: settings.CLI(),
			Args:   buildArgv(settings, args, tag, contextDir),
		},
		Files:      map[string][]byte{"Dockerfile": dockerfile},
		ContextDir: contextDir,
	}, nil
}

// Environment plans an environment image build for one toolchain lockfile
// (decision D9): the lockfile is copied to /deps/lock/ and the catalog
// install argv runs at build time, when the build alone may use the
// network. The tag hashes the toolchain image id, the lockfile bytes, and
// the install argv.
func Environment(settings Settings, contextDir, toolchain, imageRef, lockfileName string, lockfile []byte, install catalog.Install) Build {
	tag := EnvironmentTag(toolchain, imageRef, lockfile, install.Command)
	return Build{
		Tag: tag,
		Invoke: Invocation{
			Binary: settings.CLI(),
			Args:   buildArgv(settings, nil, tag, contextDir),
		},
		Files: map[string][]byte{
			"Dockerfile": EnvironmentDockerfile(imageRef, lockfileName, install),
			lockfileName: lockfile,
		},
		ContextDir: contextDir,
	}
}

// EnvironmentDockerfile renders the environment Dockerfile: the toolchain
// image, the lockfile copy, the install argv as a JSON-form RUN, and the
// install variables as sorted ENV lines.
func EnvironmentDockerfile(imageRef, lockfileName string, install catalog.Install) []byte {
	var rendered strings.Builder
	_, _ = rendered.WriteString("FROM " + imageRef + "\n")
	_, _ = rendered.WriteString("COPY " + lockfileName + " /deps/lock/" + lockfileName + "\n")
	if len(install.Command) != 0 {
		encoded, err := json.Marshal(install.Command)
		if err == nil {
			_, _ = rendered.WriteString("RUN " + string(encoded) + "\n")
		}
	}
	for _, key := range sortedKeys(install.Env) {
		_, _ = rendered.WriteString("ENV " + key + "=" + strconv.Quote(install.Env[key]) + "\n")
	}
	return []byte(rendered.String())
}

// EnvironmentTag hashes the toolchain image id, the lockfile bytes, and the
// install argv into an ayokoding-env tag.
func EnvironmentTag(toolchain, imageRef string, lockfile []byte, install []string) string {
	sum := sha256.New()
	_, _ = sum.Write([]byte(imageRef))
	_, _ = sum.Write([]byte{0})
	_, _ = sum.Write(lockfile)
	for _, arg := range install {
		_, _ = sum.Write([]byte{0})
		_, _ = sum.Write([]byte(arg))
	}
	return "ayokoding-env/" + toolchain + ":" + hex.EncodeToString(sum.Sum(nil))
}

// Inspect plans the image presence probe.
func Inspect(cli, ref string) Invocation {
	return Invocation{
		Binary: cli,
		Args:   []string{"image", "inspect", ref},
	}
}

// pinnedDigest returns the digest of a pinned image reference.
func pinnedDigest(ref string) (string, error) {
	if !pinnedPattern.MatchString(ref) {
		return "", fmt.Errorf("%w: %q", ErrUnpinnedBase, ref)
	}
	return ref[strings.LastIndex(ref, "@")+1:], nil
}

// buildArgv renders the shared buildx shape: load, then the local cache
// flags, build arguments, tag, Dockerfile, and context. The Dockerfile
// travels with the context directory: buildkit resolves a bare filename
// against the caller working directory, so a relative name only builds
// when the caller happens to stand beside it.
func buildArgv(settings Settings, args []string, tag, contextDir string) []string {
	argv := make([]string, 0, 10+2*len(args))
	argv = append(argv, "buildx", "build")
	if settings.Platform != "" {
		argv = append(argv, "--platform", settings.Platform)
	}
	argv = append(argv, "--load")
	argv = append(argv, cacheFlags(settings.CacheDir)...)
	for _, arg := range args {
		argv = append(argv, "--build-arg", arg)
	}
	context := contextOrDefault(contextDir)
	return append(argv, "--tag", tag, "--file", filepath.Join(context, "Dockerfile"), context)
}

// cacheFlags adds the local buildx cache flags when AYOKODING_BUILDX_CACHE
// names a directory. The fresh cache lands beside the warmed one, so CI can
// rotate it after the build.
func cacheFlags(dir string) []string {
	if dir == "" {
		return nil
	}
	return []string{
		"--cache-from", "type=local,src=" + dir,
		"--cache-to", "type=local,dest=" + dir + "-new,mode=max",
	}
}

// contextOrDefault keeps an explicit build context and falls back to the
// working directory.
func contextOrDefault(dir string) string {
	if dir != "" {
		return dir
	}
	return "."
}

// sortedKeys orders environment names so the rendered file is stable.
func sortedKeys(env map[string]string) []string {
	keys := make([]string, 0, len(env))
	for key := range env {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	return keys
}
