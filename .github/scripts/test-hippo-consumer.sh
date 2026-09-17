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

# Direct compute leaves carry one outer admission. Composite and lifecycle
# aliases delegate to those leaves, so they must not add a nested admission.
node -e '
const scripts = require("./package.json").scripts;
const guarded = [
  "build", "test", "lint", "lint:md", "lint:md:fix", "format:md", "format:md:check",
  "affected:build", "affected:test", "affected:lint", "graph", "nx", "nx:show",
  "organiclever:dev", "organiclever:dev:reset", "dev:ayokoding-www", "dev:ose-www",
  "dev:organiclever", "generate:bindings", "sync:agents", "sync:skills", "sync:dry-run",
  "validate:sync", "validate:claude", "harness:bindings-validation", "test:validators"
];
for (const name of guarded) {
  const command = scripts[name];
  if (typeof command !== "string" || !command.startsWith("./hippo run ")) process.exit(1);
  if ((command.match(/\.\/hippo run /g) || []).length !== 1) process.exit(1);
}
for (const name of ["prepare", "postinstall", "organiclever:dev:restart", "validate:opencode", "validate:config"]) {
  if (scripts[name].includes("./hippo run ")) process.exit(1);
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

# Doctor selects its class from the actual forwarded argv. Read-only checks
# remain ephemeral; any --fix invocation is admitted transactionally.
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
HIPPO_TEST_DOCTOR_ARGUMENTS="$doctor_arguments" "$doctor_fixture/.github/scripts/run-doctor.sh" --verbose
[ "$(sed -n '3p' "$doctor_arguments")" = ephemeral ]
[ "$(sed -n '5p' "$doctor_arguments")" = standard ]
[ "$(tail -n 1 "$doctor_arguments")" = --verbose ]
HIPPO_TEST_DOCTOR_ARGUMENTS="$doctor_arguments" "$doctor_fixture/.github/scripts/run-doctor.sh" --fix --dry-run
[ "$(sed -n '3p' "$doctor_arguments")" = transactional ]
[ "$(sed -n '5p' "$doctor_arguments")" = standard ]
[ "$(tail -n 2 "$doctor_arguments")" = '--fix
--dry-run' ]

# Validate the real declaration, then intercept only its `env` process to prove
# the consumer-specific fixed argv and recursion marker without running gates
# or touching the real HIPPO cache/state root.
apps/rhino-cli/scripts/rhino-bin.sh repo-config validate
mkdir -p "$temporary_root/fake-bin"
cat >"$temporary_root/fake-bin/env" <<'EOF'
#!/bin/sh
set -eu
: > "$HIPPO_TEST_GUARD_ARGUMENTS"
for argument in "$@"; do
  printf '%s\n' "$argument" >> "$HIPPO_TEST_GUARD_ARGUMENTS"
done
EOF
chmod 755 "$temporary_root/fake-bin/env"

guard_arguments="$temporary_root/guard-arguments"
PATH="$temporary_root/fake-bin:$PATH" \
	HIPPO_TEST_GUARD_ARGUMENTS="$guard_arguments" \
	apps/rhino-cli/scripts/rhino-bin.sh gate run --surface=pre-push --only=env-validate

fixed_arguments='OSE_HIPPO_PRE_PUSH_ACTIVE=1
./hippo
run
--class
ephemeral
--disk-path
.
--'
[ "$(sed -n '1,8p' "$guard_arguments")" = "$fixed_arguments" ]
[ -n "$(sed -n '9p' "$guard_arguments")" ]
tail_arguments='gate
run
--surface=pre-push
--only=env-validate'
[ "$(sed -n '10,13p' "$guard_arguments")" = "$tail_arguments" ]
[ "$(wc -l <"$guard_arguments" | tr -d ' ')" -eq 13 ]

echo "hippo consumer contract tests passed"
