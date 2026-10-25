package containerplan_test

import (
	"slices"
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/containerplan"
)

// baseRunConfig carries the common plan inputs every argv row reuses.
func baseRunConfig() containerplan.RunConfig {
	return containerplan.RunConfig{
		CLI:         "docker",
		RunID:       "abc123",
		Seq:         0,
		Image:       "docker.io/library/python:3.15.0@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		Command:     []string{"python3", "example.py"},
		Unit:        "learning/code/ex-01-hello",
		Workdir:     ".",
		HostDir:     "/tmp/ayokoding-work-abc",
		CPUs:        2,
		MemoryBytes: 1073741824,
		UID:         501,
		GID:         20,
	}
}

// argvString joins planned args for containment assertions.
func argvString(t *testing.T, cfg containerplan.RunConfig) string {
	t.Helper()
	planned := containerplan.PlanRun(cfg)
	return strings.Join(planned.Invoke.Args, " ")
}

// requireExactArgv asserts the planned argv byte for byte.
func requireExactArgv(t *testing.T, cfg containerplan.RunConfig, want []string) {
	t.Helper()
	planned := containerplan.PlanRun(cfg)
	if planned.Invoke.Binary != "docker" {
		t.Fatalf("binary=%q, want docker", planned.Invoke.Binary)
	}
	if !slices.Equal(planned.Invoke.Args, want) {
		t.Fatalf("argv=\n%q\nwant\n%q", planned.Invoke.Args, want)
	}
}

// TestPlanRunIsolationFlags requires the exact docker run shape: remove on
// exit, name and run label, no network, read-only root with tmpfs,
// dropped capabilities, process and memory limits, user mapping, the fixed
// environment, the work bind mount, the workdir, the image, and the run
// command.
func TestPlanRunIsolationFlags(t *testing.T) {
	cfg := baseRunConfig()
	requireExactArgv(t, cfg, []string{
		"run", "--rm",
		"--name", "ayokoding-abc123-0",
		"--label", "ayokoding.run=abc123",
		"--network", "none",
		"--read-only", "--tmpfs", "/tmp:rw,nosuid,size=512m",
		"--cap-drop", "ALL", "--security-opt", "no-new-privileges",
		"--pids-limit", "256",
		"--memory", "1073741824", "--memory-swap", "1073741824",
		"--cpus", "2",
		"--user", "501:20",
		"--env", "AYOKODING_UNIT=learning/code/ex-01-hello",
		"--env", "HOME=/tmp/home",
		"--env", "LANG=C.UTF-8",
		"--env", "PYTHONHASHSEED=0",
		"--env", "SOURCE_DATE_EPOCH=0",
		"--env", "TZ=UTC",
		"--mount", "type=bind,source=/tmp/ayokoding-work-abc,target=/work",
		"--workdir", "/work/learning/code/ex-01-hello",
		"docker.io/library/python:3.15.0@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		"python3", "example.py",
	})
}

// TestPlanRunMergesEnvironmentsSorted requires one --env pair per variable
// in name order: the harness-fixed variables, the toolchain catalog
// variables, the service connection variables, and the run's own env.
func TestPlanRunMergesEnvironmentsSorted(t *testing.T) {
	cfg := baseRunConfig()
	cfg.ToolchainEnv = map[string]string{"PYTHONDONTWRITEBYTECODE": "1", "PYTHONPATH": "/deps/python"}
	cfg.ServiceEnv = map[string]string{"PGHOST": "postgres", "PGDATABASE": "postgres"}
	cfg.RunEnv = map[string]string{"ZEBRA": "stripe", "APPLE": "fruit"}
	argv := argvString(t, cfg)
	for _, want := range []string{
		"--env APPLE=fruit",
		"--env AYOKODING_UNIT=learning/code/ex-01-hello",
		"--env HOME=/tmp/home",
		"--env LANG=C.UTF-8",
		"--env PGDATABASE=postgres",
		"--env PGHOST=postgres",
		"--env PYTHONDONTWRITEBYTECODE=1",
		"--env PYTHONHASHSEED=0",
		"--env PYTHONPATH=/deps/python",
		"--env SOURCE_DATE_EPOCH=0",
		"--env TZ=UTC",
		"--env ZEBRA=stripe",
	} {
		if !strings.Contains(argv, want) {
			t.Fatalf("argv missing %q (argv=%q)", want, argv)
		}
	}
	names := []string{}
	for arg := range strings.SplitSeq(argv, " --env ") {
		name, _, _ := strings.Cut(arg, "=")
		names = append(names, strings.TrimSpace(name))
	}
	ordered := slices.Sorted(slices.Values(names[1:]))
	if !slices.Equal(names[1:], ordered) {
		t.Fatalf("env names not sorted: %q", names[1:])
	}
}

// TestPlanRunInteractiveOnlyWithStdin requires --interactive exactly when
// the run feeds standard input.
func TestPlanRunInteractiveOnlyWithStdin(t *testing.T) {
	plain := argvString(t, baseRunConfig())
	if strings.Contains(plain, "--interactive") {
		t.Fatalf("argv carries --interactive without stdin (argv=%q)", plain)
	}
	withStdin := baseRunConfig()
	withStdin.Stdin = true
	interactive := argvString(t, withStdin)
	if !strings.Contains(interactive, "--interactive") {
		t.Fatalf("argv misses --interactive with stdin (argv=%q)", interactive)
	}
}

// TestPlanRunCPUQuotas requires the full quota on the first execution and
// half on the second, so thread scheduling differs between the two.
func TestPlanRunCPUQuotas(t *testing.T) {
	first := argvString(t, baseRunConfig())
	if !strings.Contains(first, "--cpus 2") {
		t.Fatalf("first execution misses --cpus 2 (argv=%q)", first)
	}
	second := baseRunConfig()
	second.Seq = 1
	retry := argvString(t, second)
	if !strings.Contains(retry, "--cpus 1") {
		t.Fatalf("second execution misses --cpus 1 (argv=%q)", retry)
	}
	if strings.Contains(retry, "--cpus 2") {
		t.Fatalf("second execution keeps the full quota (argv=%q)", retry)
	}
	one := baseRunConfig()
	one.CPUs = 1
	one.Seq = 1
	half := argvString(t, one)
	if !strings.Contains(half, "--cpus 0.5") {
		t.Fatalf("single-CPU second execution misses --cpus 0.5 (argv=%q)", half)
	}
}

// TestPlanRunSecondSequenceNames requires the command-scoped execution
// ordinal in the container name while the per-run sequence keeps driving
// the CPU quota.
func TestPlanRunSecondSequenceNames(t *testing.T) {
	second := baseRunConfig()
	second.Exec = 1
	argv := argvString(t, second)
	if !strings.Contains(argv, "--name ayokoding-abc123-1") {
		t.Fatalf("argv misses the sequenced name (argv=%q)", argv)
	}
	split := baseRunConfig()
	split.Seq = 1
	split.Exec = 5
	mixed := argvString(t, split)
	if !strings.Contains(mixed, "--name ayokoding-abc123-5") {
		t.Fatalf("name follows the ordinal, not the quota sequence (argv=%q)", mixed)
	}
	if !strings.Contains(mixed, "--cpus 1") {
		t.Fatalf("quota follows the per-run sequence (argv=%q)", mixed)
	}
}

// TestPlanRunSeedOnlyInReplay requires AYOKODING_SEED exactly when the run
// replays one seed.
func TestPlanRunSeedOnlyInReplay(t *testing.T) {
	plain := argvString(t, baseRunConfig())
	if strings.Contains(plain, "AYOKODING_SEED") {
		t.Fatalf("argv carries AYOKODING_SEED outside replay (argv=%q)", plain)
	}
	replay := baseRunConfig()
	replay.Seed = "17"
	seeded := argvString(t, replay)
	if !strings.Contains(seeded, "--env AYOKODING_SEED=17") {
		t.Fatalf("replay misses AYOKODING_SEED=17 (argv=%q)", seeded)
	}
}

// TestPlanRunServiceNetwork requires the shared internal network when the
// unit declares services.
func TestPlanRunServiceNetwork(t *testing.T) {
	cfg := baseRunConfig()
	cfg.Network = "ayokoding-abc123-a1b2c3"
	argv := argvString(t, cfg)
	if !strings.Contains(argv, "--network ayokoding-abc123-a1b2c3") {
		t.Fatalf("argv misses the service network (argv=%q)", argv)
	}
	if strings.Contains(argv, "--network none") {
		t.Fatalf("argv keeps --network none with services (argv=%q)", argv)
	}
}

// TestPlanRunWorkdir requires the unit-relative workdir under /work.
func TestPlanRunWorkdir(t *testing.T) {
	cfg := baseRunConfig()
	cfg.Workdir = "src"
	argv := argvString(t, cfg)
	if !strings.Contains(argv, "--workdir /work/learning/code/ex-01-hello/src") {
		t.Fatalf("argv misses the nested workdir (argv=%q)", argv)
	}
}

// TestPlanRunLinksSorted requires the working-copy symlinks sorted by link
// path.
func TestPlanRunLinksSorted(t *testing.T) {
	cfg := baseRunConfig()
	cfg.Links = []containerplan.Link{
		{Name: "node_modules", Target: "/deps/node_modules"},
		{Name: "assets", Target: "/deps/assets"},
	}
	planned := containerplan.PlanRun(cfg)
	want := []containerplan.Link{
		{Name: "assets", Target: "/deps/assets"},
		{Name: "node_modules", Target: "/deps/node_modules"},
	}
	if !slices.Equal(planned.Links, want) {
		t.Fatalf("links=%v, want %v", planned.Links, want)
	}
}

// TestPlanRunNeverLeaksHostEnvironment requires that a host variable never
// reaches the container: the plan only carries explicitly passed variables.
func TestPlanRunNeverLeaksHostEnvironment(t *testing.T) {
	t.Setenv("SECRET_TOKEN", "hunter2")
	cfg := baseRunConfig()
	cfg.RunEnv = map[string]string{"FOO": "bar"}
	argv := argvString(t, cfg)
	if strings.Contains(argv, "SECRET_TOKEN") {
		t.Fatalf("argv leaks SECRET_TOKEN (argv=%q)", argv)
	}
	if strings.Contains(argv, "PATH=") {
		t.Fatalf("argv leaks host PATH (argv=%q)", argv)
	}
}

// TestPlanRunPlatformOnlyWhenSet requires --platform exactly when the
// toolchain names one: the x64-only flutter SDK runs under emulation on
// arm64 hosts, while official multi-arch images plan no flag.
func TestPlanRunPlatformOnlyWhenSet(t *testing.T) {
	plain := argvString(t, baseRunConfig())
	if strings.Contains(plain, "--platform") {
		t.Fatalf("argv carries --platform without a toolchain platform (argv=%q)", plain)
	}
	cfg := baseRunConfig()
	cfg.Platform = "linux/amd64"
	requireExactArgv(t, cfg, []string{
		"run", "--platform", "linux/amd64", "--rm",
		"--name", "ayokoding-abc123-0",
		"--label", "ayokoding.run=abc123",
		"--network", "none",
		"--read-only", "--tmpfs", "/tmp:rw,nosuid,size=512m",
		"--cap-drop", "ALL", "--security-opt", "no-new-privileges",
		"--pids-limit", "256",
		"--memory", "1073741824", "--memory-swap", "1073741824",
		"--cpus", "2",
		"--user", "501:20",
		"--env", "AYOKODING_UNIT=learning/code/ex-01-hello",
		"--env", "HOME=/tmp/home",
		"--env", "LANG=C.UTF-8",
		"--env", "PYTHONHASHSEED=0",
		"--env", "SOURCE_DATE_EPOCH=0",
		"--env", "TZ=UTC",
		"--mount", "type=bind,source=/tmp/ayokoding-work-abc,target=/work",
		"--workdir", "/work/learning/code/ex-01-hello",
		"docker.io/library/python:3.15.0@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		"python3", "example.py",
	})
}

// TestPlanRunResolvesLocalDigestToBareTag requires harness-local derived
// refs to plan the bare tag: locally-built images carry no RepoDigest, so
// the daemon answers "Unable to find image locally" plus "pull access
// denied" (exit 125) for the digest-suffixed ref while the bare tag
// resolves. Official pinned-digest refs keep their digest.
func TestPlanRunResolvesLocalDigestToBareTag(t *testing.T) {
	const hash = "a38a2617a7a24c957aaaac635fb3fd727f7e89b549789ab91eb0028feb20ee1b"
	rows := []struct {
		name      string
		image     string
		wantImage string
	}{
		{
			name:      "derived local",
			image:     "ayokoding-toolchain/shell:" + hash + "@sha256:" + hash,
			wantImage: "ayokoding-toolchain/shell:" + hash,
		},
		{
			name:      "environment local",
			image:     "ayokoding-env/python:abc123",
			wantImage: "ayokoding-env/python:abc123",
		},
		{
			name:      "official pinned",
			image:     "docker.io/library/python:3.15.0@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
			wantImage: "docker.io/library/python:3.15.0@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		},
	}
	for _, row := range rows {
		t.Run(row.name, func(t *testing.T) {
			cfg := baseRunConfig()
			cfg.Image = row.image
			planned := containerplan.PlanRun(cfg)
			if !slices.Contains(planned.Invoke.Args, row.wantImage) {
				t.Fatalf("argv misses image %q (argv=%q)", row.wantImage, planned.Invoke.Args)
			}
			if row.image != row.wantImage && slices.Contains(planned.Invoke.Args, row.image) {
				t.Fatalf("argv keeps unresolvable digest ref %q (argv=%q)", row.image, planned.Invoke.Args)
			}
		})
	}
}
