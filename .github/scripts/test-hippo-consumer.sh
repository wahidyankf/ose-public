#!/bin/sh
set -eu

repository_root=$(CDPATH='' cd -- "$(dirname -- "$0")/../.." && pwd)
temporary_root=$(mktemp -d)
trap 'rm -rf -- "$temporary_root"' EXIT HUP INT TERM
cd "$repository_root"

"$repository_root/.github/scripts/test-hippo-bootstrap.sh"

# OSE owns exactly its Nx and .NET worker mappings. Ecosystem-specific mappings
# from other consumers must never leak into this wrapper.
[ "$(grep -c -- '--concurrency-env' hippo)" -eq 2 ]
[ "$(grep -c -- '--concurrency-env NX_PARALLEL' hippo)" -eq 1 ]
[ "$(grep -c -- '--concurrency-env DOTNET_PROCESSOR_COUNT' hippo)" -eq 1 ]
if grep -q -- '--concurrency-env GOMAXPROCS' hippo; then
	echo "hippo consumer unexpectedly maps GOMAXPROCS" >&2
	exit 1
fi

# A supervised command must leave no detached build daemon behind in the process
# group HIPPO waits on; a daemon that outlives the command turns a finished run
# into an unbounded hang. .NET has two such daemon sources and both are defaulted
# off on the `run` branch, each still deferring to an explicit caller value.
[ "$(grep -c -- 'MSBUILDDISABLENODEREUSE=${MSBUILDDISABLENODEREUSE:-1}' hippo)" -eq 1 ]
[ "$(grep -c -- 'DOTNET_CLI_USE_MSBUILD_SERVER=${DOTNET_CLI_USE_MSBUILD_SERVER:-0}' hippo)" -eq 1 ]
[ "$(grep -c -- 'export MSBUILDDISABLENODEREUSE DOTNET_CLI_USE_MSBUILD_SERVER' hippo)" -eq 1 ]

# The committed file is a safe example; each machine's active policy remains
# ignored and the test never creates it in the real checkout.
git check-ignore --quiet hippo.local.json
node -e '
const fs = require("fs");
const config = JSON.parse(fs.readFileSync("hippo.local.json.example", "utf8"));
if (config.schemaVersion !== 3 || config.defaultProfile !== "local-constrained") process.exit(1);
const coordination = config.coordination;
if (
  coordination?.mode !== "reservation" || coordination.maxCpu !== 8 ||
  coordination.maxMemoryMiB !== 16384 || coordination.baseActiveOwners !== 2 ||
  coordination.maxActiveOwners !== 3 || coordination.emergencyAvailableMemoryMiB !== 6144
) process.exit(1);
const shares = coordination.automaticOwnerShares;
if (shares?.balanced !== 4 || shares?.constrained !== 2 || shares?.minimal !== 1) process.exit(1);
const tiers = coordination.tiers;
if (
  tiers?.light?.minimumCpu !== 1 || tiers.light.maximumCpu !== 2 ||
  tiers?.standard?.minimumCpu !== 2 || tiers.standard.maximumCpu !== 4 ||
  tiers?.heavy?.minimumCpu !== 4 || tiers.heavy.maximumCpu !== 8 ||
  tiers.heavy.minimumMemoryMiB !== 8192 || tiers.heavy.maximumMemoryMiB !== 16384
) process.exit(1);
const promotion = coordination.promotion;
if (
  promotion?.completedRuns !== 25 || promotion.minimumSources !== 3 ||
  promotion.minimumAvailableMemoryMiB !== 10240 || promotion.maximumCpuP95Percent !== 75
) process.exit(1);
const profile = config.profiles?.[config.defaultProfile];
if (
  !profile || profile.strict !== false || profile.fallback !== "minimal" ||
  profile.maxCpuUtilizationPercent !== 90
) process.exit(1);
// A reservation share is what bounds this consumer now. A fixed profile
// concurrency cap would pin every run to one worker and defeat the adaptive
// parallelism the reservation vector exists to provide.
if (profile.maxConcurrency !== undefined) process.exit(1);
'

# The editor schema must identify the same immutable release that the runtime
# wrapper verifies from rhino.lock. A stale modeline masks an accidental
# release-pin mismatch from authoring tools while the executable uses new bytes.
node -e '
const fs = require("fs");
const lock = fs.readFileSync("rhino.lock", "utf8");
const version = /^version=(v[^\n]+)$/m.exec(lock)?.[1];
const config = fs.readFileSync("repo-config.yml", "utf8");
const expected = `https://raw.githubusercontent.com/wahidyankf/rhino/${version}/schemas/repo-config/v2.schema.json`;
if (!version || !config.includes(expected)) {
  console.error(`repo-config modeline must match rhino.lock version ${version ?? "<missing>"}`);
  process.exit(1);
}
'

# Direct compute leaves carry one outer admission. Composite and lifecycle
# aliases delegate to those leaves, so they must not add a nested admission.
# The removed Rhino-CLI package aliases must stay absent rather than acquiring
# a local compatibility implementation.
node -e '
const scripts = require("./package.json").scripts;
const guarded = [
  "build", "test", "lint", "lint:md", "lint:md:fix", "format:md", "format:md:check",
  "affected:build", "affected:test", "affected:lint", "graph", "nx", "nx:show",
  "organiclever:dev", "organiclever:dev:reset", "dev:ayokoding-www", "dev:ose-www",
  "dev:organiclever", "test:validators"
];
for (const name of guarded) {
  const command = scripts[name];
  if (typeof command !== "string" || !command.startsWith("./hippo run ")) process.exit(1);
  if ((command.match(/\.\/hippo run /g) || []).length !== 1) process.exit(1);
}
for (const name of ["prepare", "postinstall", "organiclever:dev:restart"]) {
  if (scripts[name].includes("./hippo run ")) process.exit(1);
}
for (const name of [
  "generate:bindings", "sync:agents", "sync:skills", "sync:dry-run",
  "validate:sync", "validate:claude", "validate:opencode", "validate:config",
  "harness:bindings-validation"
]) {
  if (Object.hasOwn(scripts, name)) process.exit(1);
}
if (!scripts.nx.includes("--class transactional")) process.exit(1);
if (!scripts["nx:show"].includes("--class ephemeral")) process.exit(1);
for (const name of ["build", "test", "lint", "affected:build", "affected:test", "affected:lint"]) {
  if (!scripts[name].includes("--class ephemeral")) process.exit(1);
}
if (!scripts["organiclever:dev:reset"].includes("--class transactional")) process.exit(1);
if (!scripts["organiclever:dev"].includes("--class service")) process.exit(1);
if (scripts["organiclever:dev:restart"] !== "npm run organiclever:dev:reset && npm run organiclever:dev --") process.exit(1);
if (scripts.doctor !== ".github/scripts/run-doctor.sh") process.exit(1);
'

# The composite restart must reset transactionally, then start the service,
# while forwarding every appended npm argument to the service leaf.
real_npm=$(command -v npm)
restart_fixture="$temporary_root/restart-fixture"
mkdir -p "$restart_fixture/node_modules/.bin"
cat >"$restart_fixture/package.json" <<'EOF'
{
  "private": true,
  "scripts": {
    "organiclever:dev:restart": "npm run organiclever:dev:reset && npm run organiclever:dev --"
  }
}
EOF
cat >"$restart_fixture/node_modules/.bin/npm" <<'EOF'
#!/bin/sh
set -eu
printf '%s\n' --call-- >>"$HIPPO_TEST_NPM_ARGUMENTS"
for argument in "$@"; do
  printf '%s\n' "$argument" >>"$HIPPO_TEST_NPM_ARGUMENTS"
done
EOF
chmod 755 "$restart_fixture/node_modules/.bin/npm"
restart_arguments="$temporary_root/restart-arguments"
(
	cd "$restart_fixture"
	HIPPO_TEST_NPM_ARGUMENTS="$restart_arguments" \
		"$real_npm" run --silent organiclever:dev:restart -- sentinel-one 'sentinel two'
)
expected_restart_arguments='--call--
run
organiclever:dev:reset
--call--
run
organiclever:dev
--
sentinel-one
sentinel two'
[ "$(sed -n '1,$p' "$restart_arguments")" = "$expected_restart_arguments" ]

# The retained package-script adapter is read-only and maps only to the direct
# v0.4 toolchain validation. It must not translate former Doctor arguments.
doctor_fixture="$temporary_root/doctor-fixture"
mkdir -p "$doctor_fixture/.github/scripts"
cp .github/scripts/run-doctor.sh "$doctor_fixture/.github/scripts/run-doctor.sh"
chmod 755 "$doctor_fixture/.github/scripts/run-doctor.sh"
cat >"$doctor_fixture/hippo" <<'EOF'
#!/bin/sh
set -eu
: >"$HIPPO_TEST_DOCTOR_ARGUMENTS"
for argument in "$@"; do
  printf '%s\n' "$argument" >>"$HIPPO_TEST_DOCTOR_ARGUMENTS"
done
EOF
chmod 755 "$doctor_fixture/hippo"
doctor_arguments="$temporary_root/doctor-arguments"
HIPPO_TEST_DOCTOR_ARGUMENTS="$doctor_arguments" "$doctor_fixture/.github/scripts/run-doctor.sh"
[ "$(sed -n '3p' "$doctor_arguments")" = ephemeral ]
[ "$(sed -n '5p' "$doctor_arguments")" = light ]
expected_doctor_arguments='./rhino
toolchain
validate'
[ "$(sed -n '9,11p' "$doctor_arguments")" = "$expected_doctor_arguments" ]
if HIPPO_TEST_DOCTOR_ARGUMENTS="$doctor_arguments" "$doctor_fixture/.github/scripts/run-doctor.sh" --fix --dry-run >/dev/null 2>&1; then
	echo "retired doctor arguments unexpectedly reached a toolchain command" >&2
	exit 1
fi

# The pinned configuration accepts the direct environment policy and declares
# the shared pre-push route once, rather than delegating to the removed F# CLI.
./rhino repo-config validate
./rhino env validate
gate_inventory="$temporary_root/gates.json"
./rhino gate list --output json >"$gate_inventory"
node -e '
const inventory = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
const expectedSafety = {
  "pre-commit": "public-safety-tree",
  "commit-msg": "public-safety-commit-message",
  "pre-push": "public-safety-tree",
  "pull-request": "public-safety-tree"
};
for (const [surface, gate] of Object.entries(expectedSafety)) {
  const entry = inventory.surfaces?.find((candidate) => candidate.surface === surface);
  if (!Array.isArray(entry?.gates) || entry.gates[0] !== gate) process.exit(1);
}
const prePush = inventory.surfaces?.find((entry) => entry.surface === "pre-push");
if (!prePush.gates.includes("env-validate")) process.exit(1);
const pullRequest = inventory.surfaces?.find((entry) => entry.surface === "pull-request");
if (!pullRequest.gates.includes("public-safety-commit-message")) process.exit(1);
if (inventory.surfaces?.some((entry) => entry.gates?.includes("public-safety"))) process.exit(1);
' "$gate_inventory"

# The adapters own their public-safety vocabulary. Rhino provides only its
# product-scoped surface marker to declared children.
grep -Fx 'export RHINO_GATE_SURFACE=pre-commit' .husky/pre-commit
grep -Fx 'export RHINO_GATE_SURFACE=pre-push' .husky/pre-push
grep -Fx '          RHINO_GATE_SURFACE: pull-request' .github/workflows/pr-quality-gate.yml
test -x scripts/public-safety/check-commit-message

# The pull-request formatter runs in Rhino's disposable snapshot but resolves
# the installed project formatters through the caller's relative Husky-style
# prefix. An absolute source-root prefix would widen the snapshot boundary.
# The entry list grows with the languages this repository ships, so the property
# is asserted rather than one literal prefix: the node prefix stays, every entry
# is relative, and the caller's own PATH is still appended last.
formatter_path=$(grep -o 'PATH="[^"]*"' .github/workflows/pr-quality-gate.yml | head -1 | sed 's/^PATH="//; s/"$//')
if [ -z "$formatter_path" ]; then
	echo "the pull-request formatter PATH prefix is missing" >&2
	exit 1
fi
case ":$formatter_path:" in
*:node_modules/.bin:*) ;;
*)
	echo "the pull-request formatter PATH must keep the node_modules/.bin prefix" >&2
	exit 1
	;;
esac
case ":$formatter_path" in
*:/*)
	echo "the pull-request formatter PATH must carry no absolute prefix: $formatter_path" >&2
	exit 1
	;;
esac
case "$formatter_path" in
*:'$PATH') ;;
*)
	echo "the pull-request formatter PATH must append the caller's own PATH last" >&2
	exit 1
	;;
esac

# The retired F# CLI owned the former reusable-workflow job. Leaving its name in
# any `needs` list makes GitHub reject the whole workflow before it starts.
if grep -R -Fq 'specs-gate' .github/workflows; then
	echo "retired specs-gate remains in a workflow dependency" >&2
	exit 1
fi

# A snapshot mutation may format a changed Go file, but Go type-aware linting
# belongs to the dedicated quality job after its ignored contracts are generated.
if grep -Fq 'lint-golangci' scripts/format-staged; then
	echo "format-staged must not invoke the Go quality linter" >&2
	exit 1
fi

# Shell files reach the declared staged formatter too. The GitHub-hosted
# Ubuntu image does not ship shfmt, so the shared Go setup must provision the
# pinned formatter rather than relying on an image-specific tool.
grep -F 'shfmt-version:' .github/actions/setup-go/action.yml
grep -F 'mvdan.cc/sh/v3/cmd/shfmt@v${want}' .github/actions/setup-go/action.yml
grep -F '"$gobin/shfmt" --version' .github/actions/setup-go/action.yml

# A retained F# path can require Fantomas under the actual Husky environment.
# Discover its .NET runtime from the installed toolchain; a machine-specific
# root would make the hook pass only on the authoring workstation.
grep -F 'dotnet --list-runtimes' scripts/format-staged
if grep -Eq 'DOTNET_ROOT=["'"'"']?/' scripts/format-staged; then
	echo "format-staged must not hardcode DOTNET_ROOT" >&2
	exit 1
fi

echo "hippo consumer contract tests passed"
