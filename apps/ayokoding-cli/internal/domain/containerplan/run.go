package containerplan

import (
	"maps"
	"sort"
	"strconv"
	"strings"
)

// Link is one symlink the harness places in the run's working copy before
// the bind mount, for runtimes that only resolve dependencies next to the
// code. The plan carries them sorted by link path.
type Link struct {
	Name   string
	Target string
}

// EnvVar is one sorted environment variable the container sees.
type EnvVar struct {
	Key   string
	Value string
}

// RunConfig carries everything PlanRun needs: the unit and run identity,
// the image and command, the resource limits, and every environment layer.
// Nothing is read from the host process, so the same config plans the same
// bytes and no host variable can leak into the container.
//
// Seq is the per-run execution index and drives the CPU quota; Exec is the
// command-scoped execution ordinal naming the container, so a still-running
// container never collides with a later execution reusing run and seq.
type RunConfig struct {
	CLI          string
	RunID        string
	Seq          int
	Exec         int
	Image        string
	Platform     string
	Command      []string
	Unit         string
	Workdir      string
	HostDir      string
	Stdin        bool
	CPUs         int
	MemoryBytes  int64
	UID          int
	GID          int
	ToolchainEnv map[string]string
	ServiceEnv   map[string]string
	RunEnv       map[string]string
	Network      string
	Seed         string
	Links        []Link
	// KeepID maps the host user onto the same UID inside the namespace
	// (--userns=keep-id), so /work keeps host ownership. The application
	// sets it only where the rootless Linux mapping applies.
	KeepID bool
}

// RunPlan is one planned execution: the container invocation and the
// working-copy symlinks in link-path order.
type RunPlan struct {
	Invoke Invocation
	Links  []Link
}

// fixedRunEnv holds the harness-pinned variables every run sees, per the
// determinism convention: a fixed environment with no host inheritance.
var fixedRunEnv = map[string]string{
	"HOME":              "/tmp/home",
	"LANG":              "C.UTF-8",
	"PYTHONHASHSEED":    "0",
	"SOURCE_DATE_EPOCH": "0",
	"TZ":                "UTC",
}

// seedVariable carries the replayed seed into simulations.
const seedVariable = "AYOKODING_SEED"

// labelFlag marks every container and network with the run identity, so
// the leftover sweep finds them.
const labelFlag = "--label"

// unitVariable names the unit under test inside the container.
const unitVariable = "AYOKODING_UNIT"

// RunName names one execution container from the run identity and the
// command-scoped execution ordinal: the same name PlanRun plans, so the
// application tracks exactly the container the invocation starts.
func RunName(runID string, exec int) string {
	return "ayokoding-" + runID + "-" + strconv.Itoa(exec)
}

// localImageNamespaces names the harness-local image namespaces no
// registry serves: the derived tags catalog.DerivedTag builds and the
// environment tags EnvironmentTag builds. Both always run from the local
// store.
var localImageNamespaces = []string{"ayokoding-toolchain/", "ayokoding-env/"}

// IsLocalImage reports whether the reference names a harness-local image,
// which always runs from the local store.
func IsLocalImage(image string) bool {
	image = strings.TrimPrefix(image, "localhost/")
	for _, namespace := range localImageNamespaces {
		if strings.HasPrefix(image, namespace) {
			return true
		}
	}
	return false
}

// RunRef resolves the image reference one execution runs: harness-local
// derived refs carry a digest suffix the local daemon cannot resolve
// (locally-built images have no RepoDigest), so they run by bare tag.
// Official pinned-digest refs keep their digest.
func RunRef(image string) string {
	if !IsLocalImage(image) {
		return image
	}
	if bare, _, found := strings.Cut(image, "@sha256:"); found {
		return bare
	}
	return image
}

// PlanRun turns one run execution into its exact container invocation,
// following tech-docs/005: isolated flags, the sorted merged environment,
// user mapping, the /work bind mount, the unit workdir, --interactive only
// with stdin, halved CPU on the second execution, the run label, and the
// replay seed only in replay. Harness-local refs run by bare tag through
// RunRef; official pinned-digest refs keep their digest. A toolchain
// platform plans --platform right after run; empty plans no flag.
func PlanRun(cfg RunConfig) RunPlan {
	network := cfg.Network
	if network == "" {
		network = "none"
	}
	argv := []string{"run"}
	if cfg.Platform != "" {
		argv = append(argv, "--platform", cfg.Platform)
	}
	argv = append(argv,
		"--rm",
		"--name", RunName(cfg.RunID, cfg.Exec),
		labelFlag, "ayokoding.run="+cfg.RunID,
		"--network", network,
		"--read-only", "--tmpfs", "/tmp:rw,nosuid,size=512m",
		"--cap-drop", "ALL", "--security-opt", "no-new-privileges",
		"--pids-limit", "256",
		"--memory", strconv.FormatInt(cfg.MemoryBytes, 10),
		"--memory-swap", strconv.FormatInt(cfg.MemoryBytes, 10),
		"--cpus", cpuQuota(cfg.CPUs, cfg.Seq),
	)
	if cfg.KeepID {
		argv = append(argv, "--userns=keep-id")
	}
	argv = append(argv, "--user", strconv.Itoa(cfg.UID)+":"+strconv.Itoa(cfg.GID))
	for _, variable := range runEnv(cfg) {
		argv = append(argv, "--env", variable.Key+"="+variable.Value)
	}
	argv = append(argv,
		"--mount", "type=bind,source="+cfg.HostDir+",target=/work",
		"--workdir", runWorkdir(cfg.Unit, cfg.Workdir),
	)
	if cfg.Stdin {
		argv = append(argv, "--interactive")
	}
	if IsLocalImage(cfg.Image) {
		argv = append(argv, "--pull", "never")
	}
	argv = append(argv, RunRef(cfg.Image))
	argv = append(argv, cfg.Command...)
	return RunPlan{
		Invoke: Invocation{Binary: cfg.CLI, Args: argv},
		Links:  sortedLinks(cfg.Links),
	}
}

// runWorkdir joins the unit path with the unit-relative workdir, keeping
// the unit folder itself when the run works at its root.
func runWorkdir(unit, workdir string) string {
	if workdir == "" || workdir == "." {
		return "/work/" + unit
	}
	return "/work/" + unit + "/" + workdir
}

// cpuQuota renders the CPU quota: the full quota on the first execution,
// half on the second, so thread scheduling differs between the two.
func cpuQuota(cpus, seq int) string {
	if seq == 0 {
		return strconv.Itoa(cpus)
	}
	return strconv.FormatFloat(float64(cpus)/2, 'f', -1, 64)
}

// runEnv merges the environment layers into one sorted mapping: the fixed
// harness variables, the unit variable, the toolchain catalog variables,
// the service connection variables, the run's own env, and the replay seed
// only in replay. Only these variables reach the container.
func runEnv(cfg RunConfig) []EnvVar {
	merged := map[string]string{}
	maps.Copy(merged, fixedRunEnv)
	merged[unitVariable] = cfg.Unit
	maps.Copy(merged, cfg.ToolchainEnv)
	maps.Copy(merged, cfg.ServiceEnv)
	maps.Copy(merged, cfg.RunEnv)
	if cfg.Seed != "" {
		merged[seedVariable] = cfg.Seed
	}
	keys := make([]string, 0, len(merged))
	for key := range merged {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	ordered := make([]EnvVar, 0, len(keys))
	for _, key := range keys {
		ordered = append(ordered, EnvVar{Key: key, Value: merged[key]})
	}
	return ordered
}

// sortedLinks orders the working-copy symlinks by link path.
func sortedLinks(links []Link) []Link {
	ordered := append([]Link(nil), links...)
	sort.Slice(ordered, func(i, j int) bool { return ordered[i].Name < ordered[j].Name })
	return ordered
}
