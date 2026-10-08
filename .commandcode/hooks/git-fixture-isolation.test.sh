#!/usr/bin/env bash
# Prove fixture initialization cannot follow an inherited Git selector into a disposable parent.
set -euo pipefail
repo=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)
python3 - "$repo" <<'PY'
import hashlib, json, os, pathlib, re, shutil, subprocess, sys, tempfile

source = pathlib.Path(sys.argv[1])
# Discovery needs no repository context; never let inherited selectors affect even this query.
discovery_env = {key: value for key, value in os.environ.items() if not key.startswith('GIT_')}
local_names = subprocess.run(['git', 'rev-parse', '--local-env-vars'], cwd=source,
                             env=discovery_env, capture_output=True, text=True, check=True).stdout.splitlines()
clean = dict(os.environ)
for key in list(clean):
    if key in local_names or key.startswith('GIT_CONFIG_KEY_') or key.startswith('GIT_CONFIG_VALUE_'):
        del clean[key]
clean.update(GIT_CONFIG_GLOBAL='/dev/null', GIT_CONFIG_SYSTEM='/dev/null', GIT_CONFIG_NOSYSTEM='1')
assets = ['.commandcode/settings.json', '.commandcode/hooks/run-policy-hook.sh', '.commandcode/hooks/agent-policy-selector.test.sh', 'scripts/agent-policy-router.sh', 'scripts/agent-policy-router.mjs', 'scripts/agent-policy-endpoint.mjs', 'scripts/agent-secret-guard.mjs', '.claude/hooks/require-hippo-boundary.sh']
failures = []
with tempfile.TemporaryDirectory(prefix='git-fixture-isolation-') as directory:
    base = pathlib.Path(directory).resolve()
    template = base / 'empty-template'
    template.mkdir()
    clean['GIT_CEILING_DIRECTORIES'] = str(base)
    for name, relative in [('selector', '.commandcode/hooks/agent-policy-selector.test.sh'), ('safe-dot-policy-metadata', '.commandcode/hooks/policy-hooks.test.sh'), ('dot-Claude', '.claude/hooks/require-hippo-boundary.test.sh')]:
        case = base / name
        parent, clone, temp = case / 'parent', case / 'clone', case / 'temporary'
        for path in [parent, clone, temp]:
            path.mkdir(parents=True)

        def git(*args):
            return subprocess.run(['git', '--git-dir', str(parent / '.git'), '-C', str(parent), *args],
                                  env=clean, capture_output=True, check=True)

        subprocess.run(['git', '--git-dir', str(parent / '.git'), '--work-tree', str(parent),
                        '-C', str(parent), 'init', '-q', '--template', str(template)],
                       env=clean, capture_output=True, check=True)
        assert pathlib.Path(git('rev-parse', '--show-toplevel').stdout.decode().strip()).resolve() == parent
        (parent / 'sentinel').write_text('owned disposable parent\n')
        git('add', 'sentinel')
        watched = [parent / '.git' / filename for filename in ['config', 'index', 'HEAD']]
        before = {path.name: hashlib.sha256(path.read_bytes()).hexdigest() for path in watched}
        linked = parent / '.git/worktrees/owned-clone'
        linked.mkdir(parents=True)
        (linked / 'commondir').write_text('../..\n')
        (linked / 'gitdir').write_text(str(clone / '.git') + '\n')
        (linked / 'HEAD').write_bytes((parent / '.git/HEAD').read_bytes())
        (clone / '.git').write_text('gitdir: ' + str(linked) + '\n')
        for asset in assets:
            destination = clone / asset
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source / asset, destination)
        (clone / 'hippo').write_text('#!/bin/sh\n')
        (clone / 'hippo').chmod(0o755)
        (clone / 'hippo.lock').touch()
        target = clone / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        body = (source / relative).read_text()
        if name not in ['selector', 'bounded-git-fixture-helper', 'safe-dot-policy-metadata']:
            # Exercise the actual startup and first init boundary, without re-entering this driver.
            lines = body.splitlines(keepends=True)
            boundary = next(index for index, line in enumerate(lines) if re.search(r'\binit -q\b', line))
            if name in ['dot-policy', 'non-dot-policy-helper']:
                body = ''.join(lines[:boundary + 1])
            else:
                prologue = next(index for index, line in enumerate(lines) if line.startswith('pass=0'))
                scratch_start = next(index for index, line in enumerate(lines) if line.startswith('scratch='))
                # Leave unrelated guard assertions out; retain actual sanitation/scratch/init statements.
                body = ''.join(lines[:prologue]) + ''.join(
                    line for line in lines[scratch_start:boundary + 1] if not line.startswith('consumer_case '))
            fixture_name = 'fixture' if name in ['dot-policy', 'non-dot-policy-helper'] else 'scratch'
            body += f'\nexport ISOLATION_FIXTURE="${fixture_name}"\n'
        elif name == 'safe-dot-policy-metadata':
            lines = body.splitlines(keepends=True)
            boundary = next(index for index, line in enumerate(lines) if line.startswith('resolved_git=')) + 1
            body = ''.join(lines[:boundary + 1])
            body += '\nexport ISOLATION_FIXTURE="$fixture"\n'
        elif name == 'bounded-git-fixture-helper':
            body = 'set -euo pipefail\nsource "$(dirname "$0")/git-fixture.sh"\nscratch=$(mktemp -d)\nscratch=$(cd "$scratch" && pwd -P)\ntrap \'rm -rf "$scratch"\' EXIT\nmkdir "$scratch/repository"\nfixture_git "$scratch" "$scratch/repository" init -q\nexport ISOLATION_FIXTURE="$scratch/repository"\n'
            target = clone / 'scripts/helper-boundary.sh'
        else:
            body += '\nexport ISOLATION_FIXTURE=""\n'
        helper_case = name in ['non-dot-policy-helper', 'bounded-git-fixture-helper']
        if helper_case:
            # Observe the actual helper's Git child environment without changing its source.
            bin_dir = case / 'bin'
            bin_dir.mkdir()
            native_git = shutil.which('git', path=clean['PATH'])
            observer = bin_dir / 'git'
            observer.write_text('#!' + sys.executable + '\n' +
                'import json,os,sys\n' +
                'names=' + repr(local_names) + '\n' +
                'if sys.argv[1:] != ["rev-parse","--local-env-vars"] and os.environ.get("GIT_DIR"):\n' +
                '    purged=not any(k in os.environ for k in names if k != "GIT_DIR")\n' +
                '    owned=os.environ.get("GIT_DIR","").startswith(' + repr(str(temp)) + ')\n' +
                '    with open(' + repr(str(case / 'git-child.jsonl')) + ',"a") as out: out.write(json.dumps({"purged":purged,"git_dir":os.environ.get("GIT_DIR","")})+"\\n")\n' +
                'os.execv(' + repr(native_git) + ',[' + repr(native_git) + ']+sys.argv[1:])\n')
            observer.chmod(0o755)
        check_prefix = '\n"${fixture_environment[@]}" ISOLATION_FIXTURE="$fixture" ' if name == 'safe-dot-policy-metadata' else '\n'
        body += check_prefix + '''python3 - <<'CHECK'
import json, os, pathlib, subprocess
query = {key: value for key, value in os.environ.items() if not key.startswith('GIT_')}
names = subprocess.run(['git', 'rev-parse', '--local-env-vars'], env=query,
                       capture_output=True, text=True, check=True).stdout.splitlines()
purged = not any(key in os.environ for key in names if key != 'GIT_DIR')
if 'GIT_DIR' in os.environ:
    purged = purged and os.environ['GIT_DIR'] == str(pathlib.Path(os.environ['ISOLATION_FIXTURE']).resolve() / '.git')
physical = True
if os.environ['ISOLATION_FIXTURE']:
    fixture = pathlib.Path(os.environ['ISOLATION_FIXTURE']).resolve()
    query.update(GIT_CONFIG_GLOBAL='/dev/null', GIT_CONFIG_SYSTEM='/dev/null', GIT_CONFIG_NOSYSTEM='1')
    result = subprocess.run(['git', '--git-dir', str(fixture / '.git'), '-C', str(fixture),
                             'rev-parse', '--show-toplevel'], env=query, capture_output=True, text=True)
    physical = result.returncode == 0 and pathlib.Path(result.stdout.strip()).resolve() == fixture
print(json.dumps({'purged': purged, 'physical': physical, 'fixture': os.environ['ISOLATION_FIXTURE']}))
CHECK
'''
        target.write_text(body)
        inherited = dict(clean, TMPDIR=str(temp), GIT_DIR=str(linked),
                         GIT_COMMON_DIR=str(parent / '.git'), GIT_INDEX_FILE=str(parent / '.git/index'))
        # This native-recognized name was absent from the selector's original manual denylist.
        extra = next(key for key in ['GIT_SHALLOW_FILE', 'GIT_IMPLICIT_WORK_TREE'] if key in local_names)
        inherited[extra] = str(parent / '.git/shallow') if extra == 'GIT_SHALLOW_FILE' else '1'
        if 'GIT_IMPLICIT_WORK_TREE' in local_names:
            inherited['GIT_IMPLICIT_WORK_TREE'] = '0'
        inherited.update(GIT_CONFIG_COUNT='1', GIT_CONFIG_KEY_0='core.bare', GIT_CONFIG_VALUE_0='true')
        if helper_case:
            inherited['PATH'] = str(bin_dir) + os.pathsep + inherited['PATH']
        result = subprocess.run(['/bin/bash', str(target)], cwd=clone, env=inherited,
                                capture_output=True, text=True, timeout=30)
        after = {path.name: hashlib.sha256(path.read_bytes()).hexdigest() for path in watched}
        checks = [json.loads(line) for line in result.stdout.splitlines() if line.startswith('{"purged":')]
        unchanged = before == after
        if helper_case:
            observed = [json.loads(line) for line in (case / 'git-child.jsonl').read_text().splitlines()]
            checks = [{'purged': bool(observed) and all(row['purged'] and pathlib.Path(row['git_dir']).resolve() == pathlib.Path(checks[0]['fixture']).resolve() / '.git' for row in observed), 'physical': checks[0]['physical'] if checks else False}]
        checks = [{key: row[key] for key in ['purged', 'physical']} for row in checks]
        complete = result.returncode == 0 and checks == [{'purged': True, 'physical': True}]
        if not (unchanged and complete):
            failures.append(name)
            print(f'FAIL: Git fixture isolation {name}; parent_unchanged={unchanged}; boundary_isolated={complete}; exit={result.returncode}')
assert not failures, 'Git fixture inherited-selector regression failed'
print('PASS: 3 fixture boundaries clear native Git local environment; physical roots and parent config/index/HEAD unchanged')
PY
