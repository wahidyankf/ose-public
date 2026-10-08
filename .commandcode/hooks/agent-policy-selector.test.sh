#!/usr/bin/env bash
# Verify raw native transport and physical destination policy in disposable read-only Git fixtures.
set -euo pipefail
# Git hooks export selectors; discover every native name before any fixture Git operation.
git_local_env_vars=$(git rev-parse --local-env-vars) || exit 1
while IFS= read -r git_local_env_var; do
	unset "$git_local_env_var"
done <<<"$git_local_env_vars"
while IFS= read -r git_config_env_var; do
	case "$git_config_env_var" in GIT_CONFIG_KEY_* | GIT_CONFIG_VALUE_*) unset "$git_config_env_var" ;; esac
done < <(compgen -e)
unset GIT_TEMPLATE_DIR
repo=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)
python3 - "$repo" <<'PY'
import json, os, pathlib, shutil, subprocess, sys, tempfile
source = pathlib.Path(sys.argv[1])
wrapper = source / '.commandcode/hooks/run-policy-hook.sh'
assert wrapper.is_file(), 'required local Command Code selector wrapper is absent'
settings = json.loads((source / '.commandcode/settings.json').read_text())
family = '^(SHELL|READ|READ_MULTI|LIST|WRITE|EDIT|SEARCH|GLOB)$'
bindings = [hook for entry in settings.get('hooks', {}).get('PreToolUse', []) if entry.get('matcher') == family
            for hook in entry.get('hooks', []) if '.commandcode/hooks/run-policy-hook.sh' in hook.get('command', '')
            and hook['command'].endswith(' agent-policy')]
assert len(bindings) == 1, 'current native family registration is missing or duplicated'
assert bindings[0].get('failClosed') is True and bindings[0].get('timeout') == 30
native_command = bindings[0]['command']
# Keep the source project's selected runtime when copied routers enter unpinned fixtures.
node = pathlib.Path(subprocess.run(['node', '-p', 'process.execPath'], cwd=source,
                                  capture_output=True, text=True, check=True).stdout.strip())
with tempfile.TemporaryDirectory(prefix='cc-selector-') as directory:
    base = pathlib.Path(directory).resolve()
    env = dict(os.environ)
    env['PATH'] = str(node.parent) + os.pathsep + env.get('PATH', '')
    selectors = set(subprocess.run(['git', 'rev-parse', '--local-env-vars'], env=env,
                                   text=True, capture_output=True, check=True).stdout.splitlines())
    selectors.add('GIT_TEMPLATE_DIR')
    for key in list(env):
        if key in selectors or key.startswith('GIT_CONFIG_KEY_') or key.startswith('GIT_CONFIG_VALUE_'):
            del env[key]
    env.update(GIT_CEILING_DIRECTORIES=str(base), GIT_CONFIG_GLOBAL='/dev/null',
               GIT_CONFIG_SYSTEM='/dev/null', GIT_CONFIG_NOSYSTEM='1')
    for name in ['A', 'B']:
        root = base / name
        for relative in ['.commandcode/hooks', 'scripts', '.agents', '.git/objects', '.git/refs', 'safe', 'secrets']:
            (root / relative).mkdir(parents=True, exist_ok=True)
        (root / '.git/HEAD').write_text('ref: refs/heads/main\n')
        (root / '.git/config').write_text('[core]\n\tbare = false\n\tworktree = ..\n')
        top = subprocess.run(['git', '--git-dir', str(root / '.git'), '-C', str(root), 'rev-parse', '--show-toplevel'], env=env,
                             text=True, capture_output=True, check=True).stdout.strip()
        assert pathlib.Path(top).resolve() == root
        shutil.copyfile(wrapper, root / '.commandcode/hooks/run-policy-hook.sh')
        (root / '.agents/agent-policy.json').write_text(json.dumps({'protected_paths': ['**/secrets/**'], 'allowed_paths': []}))
        for relative in ['safe/item', 'secrets/item']:
            (root / relative).write_text('synthetic\n')
        (root / '.commandcode/settings.json').write_text(json.dumps(settings))
    a, b = base / 'A', base / 'B'
    router = a / 'scripts/agent-policy-router.sh'
    router.write_text('#!/bin/bash\nset -euo pipefail\nrepo=$(cd "$(dirname "$0")/.." && pwd -P)\nprintf "%s\\n" "$@" > "$repo/argv"\ncat > "$repo/raw"\n')
    raw = b' { "tool_name": "shell_command", "tool_input": {"command":"printf", "args":["a b", "literal$()"], "opaque":true} } \n'
    result = subprocess.run(['/bin/bash', str(a / '.commandcode/hooks/run-policy-hook.sh'), 'agent-policy'], input=raw, cwd=base, env=env, capture_output=True)
    assert result.returncode == 0, f'agent-policy selector failed: exit {result.returncode}, {result.stderr!r}'
    assert (a / 'raw').read_bytes() == raw, 'native JSON bytes changed before router'
    assert (a / 'argv').read_text() == '--scope\nlocal\n--harness\ncommandcode\n', 'trusted routing CLI differs'
    for root in [a, b]:
        for filename in ['agent-policy-router.sh', 'agent-policy-router.mjs', 'agent-policy-endpoint.mjs', 'agent-secret-guard.mjs']:
            shutil.copyfile(source / 'scripts' / filename, root / 'scripts' / filename)
        (root / 'scripts/agent-policy-hook.sh').write_text('#!/bin/bash\nset -euo pipefail\nrepo=$(cd "$(dirname "$0")/.." && pwd -P)\nprintf "EVAL\\n" >> "$repo/evaluations"\nexec /bin/bash "$repo/scripts/agent-policy-router.sh" --endpoint "$@"\n')
    def call(path, root=a, external=False):
        payload = json.dumps({'cwd': str(a), 'tool_name': 'read_file', 'tool_input': {'absolute_path': str(path)}}).encode()
        command = ['/bin/bash', str(a / 'scripts/agent-policy-router.sh'), '--scope', 'external', '--harness', 'commandcode'] if external else ['/bin/bash', '-c', native_command]
        result = subprocess.run(command, input=payload, cwd=root, env=env, capture_output=True)
        assert result.returncode == 0, result.stderr
        return json.loads(result.stdout) if result.stdout.strip() else None
    def count(root):
        p = root / 'evaluations'
        return p.read_text().count('EVAL\n') if p.exists() else 0
    assert call(a / 'safe/item') is None
    assert count(a) == 1 and count(b) == 0
    assert call(a / 'secrets/item')['hookSpecificOutput']['permissionDecision'] == 'deny'
    assert count(a) == 2 and count(b) == 0
    assert call(b / 'secrets/item') is None
    assert count(a) == 2 and count(b) == 0, 'local owner guarded a foreign destination'
    assert call(b / 'secrets/item', external=True)['hookSpecificOutput']['permissionDecision'] == 'deny'
    assert count(a) == 2 and count(b) == 1, 'global route did not guard the physical foreign owner once'
    assert call(a / 'safe/item', external=True) is None
    assert count(a) == 2 and count(b) == 1, 'global route duplicated local owner evaluation'
print('PASS: current native registration; raw selector transport; owned allow/deny; foreign physical owner; global/local single evaluation')
PY
