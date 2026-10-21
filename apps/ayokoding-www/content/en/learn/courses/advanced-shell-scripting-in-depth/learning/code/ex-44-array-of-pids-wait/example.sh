# => Example 44: jobs write files, wait syncs, ordered reads follow.
set -euo pipefail # => strict header first, as in every example
# => WHY files: shared stdout interleaves; separate files order cleanly.
out="$(mktemp -d)"                   # => private dir under /tmp for the job outputs
cleanup() {                          # => remove the job outputs on every exit path
	rm -rf "${out}"                     # => the job-output dir vanishes with the script
}                                    # => closes the job-output cleaner
trap cleanup EXIT                    # => removal runs on success, error, or signal exits
(printf "alpha\n" >"${out}/a.txt") & # => job one writes only its file
(printf "beta\n" >"${out}/b.txt") &  # => job two writes only its file
wait                                 # => block until EVERY background job has finished
cat "${out}/a.txt" "${out}/b.txt"    # => fixed order: a then b, always
echo "all jobs done"                 # => fixed marker after every job finished
