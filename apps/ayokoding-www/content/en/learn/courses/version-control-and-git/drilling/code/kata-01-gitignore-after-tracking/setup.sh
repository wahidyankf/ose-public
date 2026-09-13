#!/bin/bash
# kata-01-gitignore-after-tracking: adding a pattern to .gitignore does NOT untrack a file already tracked
set -e
WORKDIR=$(mktemp -d) && cd "$WORKDIR"
export GIT_AUTHOR_NAME="Dev" GIT_AUTHOR_EMAIL="dev@example.com"
export GIT_COMMITTER_NAME="Dev" GIT_COMMITTER_EMAIL="dev@example.com"
git -c init.defaultBranch=main init -q
echo "secret=123" >config.local.ini
git add config.local.ini
git commit -q -m "accidentally track config.local.ini"

echo "=== BUGGY: add the ignore pattern AFTER the file is already tracked ==="
echo "config.local.ini" >.gitignore
git add .gitignore
git commit -q -m "add gitignore (too late)"
echo "secret=456" >config.local.ini # => edit the already-tracked file again
git status                          # => BUG: config.local.ini STILL shows as modified -- .gitignore
#    only affects UNTRACKED files, never files already in the index

echo "=== FIX: git rm --cached removes it from tracking WITHOUT deleting it from disk ==="
git rm --cached -q config.local.ini
git commit -q -m "stop tracking config.local.ini"
echo "secret=789" >config.local.ini # => edit again
git status                          # => FIXED: config.local.ini no longer appears at all -- now
#    genuinely untracked AND ignored, exactly as .gitignore intended
cat config.local.ini # => the file itself is untouched on disk the whole time
