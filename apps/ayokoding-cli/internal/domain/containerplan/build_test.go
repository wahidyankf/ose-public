package containerplan_test

import (
	"io/fs"
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/catalog"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/containerplan"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/toolchains"
)

// baseRef pins the node base the typescript recipe builds from.
const baseRef = "docker.io/library/node:24@sha256:14078204b6bb268c107ceff6d3c43f45a888105e5c2b18b14c32b3409d93a1b0"

// dockerfile is the smallest recipe under test.
const dockerfile = "FROM docker.io/library/node:24@sha256:14078204b6bb268c107ceff6d3c43f45a888105e5c2b18b14c32b3409d93a1b0\nRUN npm install\n"

// wantTag recomputes the derived tag the plan must carry.
func wantTag(dockerfile []byte) string {
	return catalog.DerivedTag("typescript", "sha256:14078204b6bb268c107ceff6d3c43f45a888105e5c2b18b14c32b3409d93a1b0", dockerfile, nil)
}

// join renders argv for failure messages.
func join(argv []string) string {
	return strings.Join(argv, " ")
}

// TestDerived_fileTravelsWithContext pins the buildkit fix: the --file
// flag names the Dockerfile beside the context directory, because buildkit
// resolves a bare "Dockerfile" against the caller working directory and
// fails with "failed to read dockerfile" anywhere else.
func TestDerived_fileTravelsWithContext(t *testing.T) {
	settings := containerplan.Settings{ContainerCLI: "docker", CacheDir: ""}
	got, err := containerplan.Derived(settings, "/ctx", "typescript", baseRef, []byte(dockerfile), nil)
	if err != nil {
		t.Fatalf("plan derived build: %v", err)
	}
	want := join([]string{
		"buildx", "build", "--load",
		"--tag", wantTag([]byte(dockerfile)),
		"--file", "/ctx/Dockerfile", "/ctx",
	})
	if join(got.Invoke.Args) != want {
		t.Fatalf("argv=%q, want %q", join(got.Invoke.Args), want)
	}
}

// TestDerived_argvWithoutCache pins the exact derived build argv.
func TestDerived_argvWithoutCache(t *testing.T) {
	settings := containerplan.Settings{ContainerCLI: "docker", CacheDir: ""}
	got, err := containerplan.Derived(settings, "/ctx", "typescript", baseRef, []byte(dockerfile), nil)
	if err != nil {
		t.Fatalf("plan derived build: %v", err)
	}
	want := []string{
		"buildx", "build", "--load",
		"--tag", wantTag([]byte(dockerfile)),
		"--file", "/ctx/Dockerfile", "/ctx",
	}
	if join(got.Invoke.Args) != join(want) || got.Invoke.Binary != "docker" {
		t.Fatalf("argv=%q, want %q", join(got.Invoke.Args), join(want))
	}
	if got.Tag != wantTag([]byte(dockerfile)) {
		t.Fatalf("tag=%q, want %q", got.Tag, wantTag([]byte(dockerfile)))
	}
	if string(got.Files["Dockerfile"]) != dockerfile {
		t.Fatalf("context Dockerfile not carried")
	}
}

// TestDerived_argvWithCache pins the local cache flags.
func TestDerived_argvWithCache(t *testing.T) {
	settings := containerplan.Settings{ContainerCLI: "docker", CacheDir: "/tmp/.buildx-cache"}
	got, err := containerplan.Derived(settings, "/ctx", "typescript", baseRef, []byte(dockerfile), nil)
	if err != nil {
		t.Fatalf("plan derived build: %v", err)
	}
	want := []string{
		"buildx", "build", "--load",
		"--cache-from", "type=local,src=/tmp/.buildx-cache",
		"--cache-to", "type=local,dest=/tmp/.buildx-cache-new,mode=max",
		"--tag", wantTag([]byte(dockerfile)),
		"--file", "/ctx/Dockerfile", "/ctx",
	}
	if join(got.Invoke.Args) != join(want) {
		t.Fatalf("argv=%q, want %q", join(got.Invoke.Args), join(want))
	}
}

// TestDerived_buildArgsBecomeFlags carries build arguments into argv and tag.
func TestDerived_buildArgsBecomeFlags(t *testing.T) {
	settings := containerplan.Settings{ContainerCLI: "docker", CacheDir: ""}
	plain, err := containerplan.Derived(settings, "/ctx", "typescript", baseRef, []byte(dockerfile), nil)
	if err != nil {
		t.Fatalf("plan derived build: %v", err)
	}
	withArgs, err := containerplan.Derived(settings, "/ctx", "typescript", baseRef, []byte(dockerfile), []string{"SNAPSHOT=20261017T204620Z"})
	if err != nil {
		t.Fatalf("plan derived build with args: %v", err)
	}
	if plain.Tag == withArgs.Tag {
		t.Fatalf("build args left the tag unchanged: %q", plain.Tag)
	}
	want := join([]string{
		"buildx", "build", "--load",
		"--build-arg", "SNAPSHOT=20261017T204620Z",
		"--tag", withArgs.Tag,
		"--file", "/ctx/Dockerfile", "/ctx",
	})
	if join(withArgs.Invoke.Args) != want {
		t.Fatalf("argv=%q, want %q", join(withArgs.Invoke.Args), want)
	}
}

// TestDerived_tagMovesWithOneDockerfileByte proves the content-hash tag.
func TestDerived_tagMovesWithOneDockerfileByte(t *testing.T) {
	settings := containerplan.Settings{ContainerCLI: "docker", CacheDir: ""}
	first, err := containerplan.Derived(settings, "/ctx", "typescript", baseRef, []byte(dockerfile), nil)
	if err != nil {
		t.Fatalf("plan derived build: %v", err)
	}
	changed := []byte(dockerfile)
	changed[len(changed)-1] = '\n' + 1
	second, err := containerplan.Derived(settings, "/ctx", "typescript", baseRef, changed, nil)
	if err != nil {
		t.Fatalf("plan derived build: %v", err)
	}
	if first.Tag == second.Tag {
		t.Fatalf("one Dockerfile byte left the tag unchanged: %q", first.Tag)
	}
	if !strings.HasPrefix(first.Tag, "ayokoding-toolchain/typescript:") {
		t.Fatalf("tag=%q, want the derived repository prefix", first.Tag)
	}
}

// TestDerived_platformFlag pins --platform for x64-only SDKs: the flutter
// recipe builds amd64 even on arm64 hosts, and the platform leaves the
// content-hash tag alone, so the recipe bytes still name the tag.
func TestDerived_platformFlag(t *testing.T) {
	plain, err := containerplan.Derived(
		containerplan.Settings{ContainerCLI: "docker", CacheDir: ""},
		"/ctx", "flutter", baseRef, []byte(dockerfile), nil,
	)
	if err != nil {
		t.Fatalf("plan derived build: %v", err)
	}
	if join(plain.Invoke.Args) != join([]string{
		"buildx", "build", "--load",
		"--tag", plain.Tag,
		"--file", "/ctx/Dockerfile", "/ctx",
	}) {
		t.Fatalf("platform-less argv moved (argv=%q)", join(plain.Invoke.Args))
	}
	pinned, err := containerplan.Derived(
		containerplan.Settings{ContainerCLI: "docker", Platform: "linux/amd64"},
		"/ctx", "flutter", baseRef, []byte(dockerfile), nil,
	)
	if err != nil {
		t.Fatalf("plan derived build with platform: %v", err)
	}
	if join(pinned.Invoke.Args) != join([]string{
		"buildx", "build", "--platform", "linux/amd64", "--load",
		"--tag", pinned.Tag,
		"--file", "/ctx/Dockerfile", "/ctx",
	}) {
		t.Fatalf("argv=%q, want the --platform flag after build", join(pinned.Invoke.Args))
	}
	if pinned.Tag != plain.Tag {
		t.Fatalf("platform moved the tag: %q vs %q", pinned.Tag, plain.Tag)
	}
}

// TestDerived_rejectsUnpinnedBase refuses a base reference without a digest.
func TestDerived_rejectsUnpinnedBase(t *testing.T) {
	settings := containerplan.Settings{ContainerCLI: "docker", CacheDir: ""}
	for _, row := range []struct {
		name string
		base string
	}{
		{"empty base", ""},
		{"tag without digest", "docker.io/library/node:24"},
		{"short digest", "docker.io/library/node:24@sha256:abc"},
	} {
		t.Run(row.name, func(t *testing.T) {
			if _, err := containerplan.Derived(settings, "/ctx", "typescript", row.base, []byte(dockerfile), nil); err == nil {
				t.Fatalf("unpinned base %q planned without an error", row.base)
			}
		})
	}
}

// TestDerived_defaultContext pins the context fallback.
func TestDerived_defaultContext(t *testing.T) {
	settings := containerplan.Settings{ContainerCLI: "docker", CacheDir: ""}
	got, err := containerplan.Derived(settings, "", "typescript", baseRef, []byte(dockerfile), nil)
	if err != nil {
		t.Fatalf("plan derived build: %v", err)
	}
	if len(got.Invoke.Args) == 0 {
		t.Fatalf("argv is empty")
	}
	last := got.Invoke.Args[len(got.Invoke.Args)-1]
	if last != "." {
		t.Fatalf("context=%q, want .", last)
	}
}

// TestSettings_defaultCLI resolves the Docker default.
func TestSettings_defaultCLI(t *testing.T) {
	if got := (containerplan.Settings{}).CLI(); got != "docker" {
		t.Fatalf("default CLI=%q, want docker", got)
	}
	if got := (containerplan.Settings{ContainerCLI: "podman"}).CLI(); got != "podman" {
		t.Fatalf("custom CLI=%q, want podman", got)
	}
}

// installRecipe is the python dependency recipe from the catalog.
func installRecipe() catalog.Install {
	return catalog.Install{
		Lockfiles: []string{"requirements.lock"},
		Command:   []string{"pip", "install", "--require-hashes", "--target", "/deps/python", "-r", "/deps/lock/requirements.lock"},
		Env:       map[string]string{"PYTHONPATH": "/deps/python"},
	}
}

// TestEnvironment_argvAndFiles pins the environment build plan.
func TestEnvironment_argvAndFiles(t *testing.T) {
	settings := containerplan.Settings{ContainerCLI: "docker", CacheDir: ""}
	lockfile := []byte("psycopg==3.2.1 \\\n    --hash=sha256:0000000000000000000000000000000000000000000000000000000000000000\n")
	image := "docker.io/library/python:3.15@sha256:e748956ccf3f50c9555f236753bbcd5f430d3937e665d3bd6922dd0e6e591a24"
	got := containerplan.Environment(settings, "/ctx", "python", image, "requirements.lock", lockfile, installRecipe())
	if !strings.HasPrefix(got.Tag, "ayokoding-env/python:") {
		t.Fatalf("tag=%q, want the environment repository prefix", got.Tag)
	}
	if len(got.Tag) != len("ayokoding-env/python:")+64 {
		t.Fatalf("tag=%q, want a full SHA-256 suffix", got.Tag)
	}
	want := []string{
		"buildx", "build", "--load",
		"--tag", got.Tag,
		"--file", "/ctx/Dockerfile", "/ctx",
	}
	if join(got.Invoke.Args) != join(want) {
		t.Fatalf("argv=%q, want %q", join(got.Invoke.Args), join(want))
	}
	if string(got.Files["requirements.lock"]) != string(lockfile) {
		t.Fatalf("context lockfile not carried")
	}
	rendered := string(got.Files["Dockerfile"])
	for _, line := range []string{
		"FROM " + image,
		"COPY requirements.lock /deps/lock/requirements.lock",
		`RUN ["pip","install","--require-hashes","--target","/deps/python","-r","/deps/lock/requirements.lock"]`,
		`ENV PYTHONPATH="/deps/python"`,
	} {
		if !strings.Contains(rendered, line) {
			t.Fatalf("Dockerfile misses %q:\n%s", line, rendered)
		}
	}
}

// TestEnvironment_tagSensitivity proves the environment content hash.
func TestEnvironment_tagSensitivity(t *testing.T) {
	image := "docker.io/library/python:3.15@sha256:e748956ccf3f50c9555f236753bbcd5f430d3937e665d3bd6922dd0e6e591a24"
	first := containerplan.EnvironmentTag("python", image, []byte("a"), []string{"pip", "install"})
	if first == containerplan.EnvironmentTag("python", image, []byte("b"), []string{"pip", "install"}) {
		t.Fatalf("one lockfile byte left the tag unchanged: %q", first)
	}
	if first == containerplan.EnvironmentTag("python", image, []byte("a"), []string{"pip", "update"}) {
		t.Fatalf("one install byte left the tag unchanged: %q", first)
	}
	if first != containerplan.EnvironmentTag("python", image, []byte("a"), []string{"pip", "install"}) {
		t.Fatalf("same inputs moved the tag: %q", first)
	}
}

// TestEnvironmentDockerfile_sortsEnvKeys keeps the rendered file stable.
func TestEnvironmentDockerfile_sortsEnvKeys(t *testing.T) {
	got := string(containerplan.EnvironmentDockerfile("img", "req.lock", catalog.Install{
		Command: []string{"pip", "install"},
		Env:     map[string]string{"ZED": "1", "ALPHA": "a b"},
	}))
	want := "FROM img\nCOPY req.lock /deps/lock/req.lock\nRUN [\"pip\",\"install\"]\nENV ALPHA=\"a b\"\nENV ZED=\"1\"\n"
	if got != want {
		t.Fatalf("Dockerfile:\n%s\nwant:\n%s", got, want)
	}
}

// TestEnvironmentDockerfile_withoutRecipe renders the bare base.
func TestEnvironmentDockerfile_withoutRecipe(t *testing.T) {
	got := string(containerplan.EnvironmentDockerfile("img", "req.lock", catalog.Install{}))
	if got != "FROM img\nCOPY req.lock /deps/lock/req.lock\n" {
		t.Fatalf("Dockerfile=%q", got)
	}
}

// TestInspect_argv pins the presence probe.
func TestInspect_argv(t *testing.T) {
	got := containerplan.Inspect("docker", "img:tag@sha256:abc")
	if got.Binary != "docker" {
		t.Fatalf("binary=%q, want docker", got.Binary)
	}
	if join(got.Args) != "image inspect img:tag@sha256:abc" {
		t.Fatalf("argv=%q", join(got.Args))
	}
}

// TestCatalogDerivedTagsMatchRecipes recomputes every derived tag from the
// embedded Dockerfile and requires catalog.yaml to carry it, so a recipe
// edit without a re-pin fails here instead of shipping a stale image. The
// tag hashes the final stage base: every FROM line already joins the hash
// through the Dockerfile bytes.
func TestCatalogDerivedTagsMatchRecipes(t *testing.T) {
	cat, err := catalog.Load(toolchains.Files())
	if err != nil {
		t.Fatalf("load embedded catalog: %v", err)
	}
	for _, entry := range cat.Toolchains {
		if entry.Build == "" {
			continue
		}
		recipe, err := fs.ReadFile(toolchains.Files(), entry.Build)
		if err != nil {
			t.Fatalf("read %s: %v", entry.Build, err)
		}
		digest, ok := finalBaseDigest(string(recipe))
		if !ok {
			t.Fatalf("%s pins no base digest", entry.Build)
		}
		tag := catalog.DerivedTag(entry.ID, digest, recipe, nil)
		hash := strings.TrimPrefix(tag, "ayokoding-toolchain/"+entry.ID+":")
		want := "ayokoding-toolchain/" + entry.ID + ":" + hash + "@sha256:" + hash
		if entry.Image != want {
			t.Fatalf("%s image=%q, want %q", entry.ID, entry.Image, want)
		}
	}
}

// finalBaseDigest returns the digest of the last pinned FROM reference,
// skipping stageless bases such as scratch.
func finalBaseDigest(recipe string) (string, bool) {
	var digest string
	var found bool
	for line := range strings.SplitSeq(recipe, "\n") {
		fields := strings.Fields(line)
		if len(fields) < 2 || fields[0] != "FROM" {
			continue
		}
		reference := fields[1]
		at := strings.LastIndex(reference, "@")
		if at < 0 {
			continue
		}
		digest, found = reference[at+1:], true
	}
	return digest, found
}
