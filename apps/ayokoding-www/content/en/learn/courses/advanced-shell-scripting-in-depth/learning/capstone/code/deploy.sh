# => Capstone: a deployment-helper CLI with strict flags and a verified transcript.
set -euo pipefail # => strict header first, as in every script
# => WHY this shape: parse, validate, stage, deploy, verify, report.
env="staging"                                                # => default one: staging unless --env says otherwise
version="1.2.3"                                              # => default two: pinned unless --version says otherwise
dry_run="no"                                                 # => default three: real run unless --dry-run is passed
usage() {                                                    # => one function owns the whole usage contract
	echo "usage: deploy [--env NAME] [--version V] [--dry-run]" # => synopsis line
}                                                            # => closes the usage contract
while [ "$#" -gt 0 ]; do                                     # => loop while words remain
	case "$1" in                                                # => match the head word against the three flags
	--env)
		env="$2"
		shift 2 # => value flag consumes its word
		;;      # => ends the env branch
	--version)
		version="$2"
		shift 2 # => value flag consumes its word
		;;      # => ends the version branch
	--dry-run)
		dry_run="yes"
		shift # => bare flag flips its default on
		;;    # => ends the dry-run branch
	--help)
		usage
		exit 0 # => help prints the contract and succeeds
		;;     # => ends the help branch
	*)
		usage >&2
		exit 2                                              # => unknown words are usage errors
		;;                                                  # => ends the misuse branch
	esac                                                 # => closes the per-word branch
done                                                  # => flags parsed; defaults stand where flags were absent
if [ -z "${env}" ] || [ -z "${version}" ]; then       # => empty values are misuse
	usage >&2                                            # => usage belongs on stderr, always
	exit 2                                               # => missing values are usage errors
fi                                                    # => closes the value guard
echo "deploying ${version} to ${env}"                 # => the plan, stated up front
stage="$(mktemp -d)"                                  # => private staging dir under /tmp
cleanup() {                                           # => remove the staging dir on every exit path
	rm -rf "${stage}"                                    # => the staging dir vanishes with the script
}                                                     # => closes the staging cleaner
trap cleanup EXIT                                     # => removal runs on success, error, or signal exits
on_term() {                                           # => the TERM handler: finish the step, then report
	echo "received TERM: finishing current step"         # => fixed drain report
}                                                     # => closes the TERM handler
trap on_term TERM                                     # => SIGTERM drains instead of dying mid-deploy
while IFS= read -r pkg; do                            # => read each manifest line exactly
	echo "staging: ${pkg}"                               # => stage one package per manifest line
	printf "%s\n" "${pkg}" >>"${stage}/staged.txt"       # => record the staged package
done <manifest.txt                                    # => the manifest fixture drives the staging
kill -TERM $$                                         # => self-signal: the deterministic drain demonstration
if [ "${dry_run}" = "yes" ]; then                     # => dry runs verify without acting
	echo "dry run: no changes made"                      # => fixed marker for dry-run mode
else                                                  # => real run: verify the staged set, then report
	staged="$(wc -l <"${stage}/staged.txt" | tr -d " ")" # => count staged packages
	echo "verified: ${staged} packages staged"           # => the self-verification line
fi                                                    # => closes the dry-run branch
echo "deploy complete"                                # => fixed closing marker of the transcript
