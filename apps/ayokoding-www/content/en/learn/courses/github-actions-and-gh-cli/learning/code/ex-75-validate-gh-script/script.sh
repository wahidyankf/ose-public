set -euo pipefail
gh pr list --state open --json number,title --jq '.[].number'
gh issue list --state open --json number,title --jq 'length'
