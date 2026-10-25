# => Example 54: & fans out, wait joins, ordered reads follow.
set -euo pipefail # => strict header first, as in every example
# => WHY files per job: shared stdout interleaves nondeterministically.
out="$(mktemp -d)" # => private dir under /tmp for the job outputs
cleanup() {        # => remove the job outputs on every exit path
	rm -rf "${out}"   # => the job-output dir vanishes with the script
}                  # => closes the job-output cleaner
trap cleanup EXIT  # => removal runs on success, error, or signal exits
(
	sleep 0.1
	printf "alpha\n" >"${out}/a.txt"
) &                                 # => job one: slow writer
(printf "beta\n" >"${out}/b.txt") & # => job two: instant writer
wait                                # => block until EVERY background job has finished
cat "${out}/a.txt" "${out}/b.txt"   # => fixed order: a then b, always
echo "all jobs done"                # => fixed marker after every job finished
