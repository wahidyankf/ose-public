#!/bin/sh
set -eu

repository_root=$(CDPATH='' cd -- "$(dirname -- "$0")/../.." && pwd)

# The in-tree Doctor route is retired. Keep this package-script adapter only
# for the read-only validation callers that still invoke `npm run doctor`;
# arguments must use an explicit v0.4 toolchain command instead of translation.
if [ "$#" -ne 0 ]; then
	echo "doctor arguments are retired; invoke ./rhino toolchain directly" >&2
	exit 2
fi

cd "$repository_root"
exec ./hippo run --class ephemeral --resource-tier light --disk-path . -- ./rhino toolchain validate
