#!/bin/sh
set -eu

repository_root=$(CDPATH='' cd -- "$(dirname -- "$0")/../.." && pwd)
workload_class=ephemeral

# Doctor is normally a read-only check. Its --fix mode installs tools and
# replaces managed directories, so that invocation needs transactional
# admission even when callers append the flag through npm.
for argument in "$@"; do
	if [ "$argument" = --fix ]; then
		workload_class=transactional
	fi
done

exec "$repository_root/hippo" run --class "$workload_class" --resource-tier standard \
	--disk-path "$repository_root" -- \
	dotnet run --project apps/rhino-cli/src/RhinoCli.Program/RhinoCli.Program.fsproj -- doctor "$@"
