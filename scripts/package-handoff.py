#!/usr/bin/env python3
"""Package tracked source/history and explicit optional data. No network access."""
import argparse
import datetime as dt
import hashlib
import json
import pathlib
import re
import subprocess
import tempfile
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
PATTERNS = [
    re.compile(rb"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    re.compile(rb"\bgh[pousr]_[A-Za-z0-9]{30,}\b"),
    re.compile(rb"\bgithub_pat_[A-Za-z0-9_]{40,}\b"),
    re.compile(rb"\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{32,}\b"),
    re.compile(rb"\bAKIA[0-9A-Z]{16}\b"),
    re.compile(rb"\bxox[baprs]-[A-Za-z0-9-]{20,}\b"),
]

def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args])

def audit(label, data):
    if any(pattern.search(data) for pattern in PATTERNS):
        raise SystemExit('Recognizable secret pattern found in ' + label + '; package cancelled. Values were not printed.')

def credential_path(name):
    parts = pathlib.PurePosixPath(name).parts
    return any((p.startswith('.env') and p != '.env.example') or p.startswith('.dev.vars') for p in parts) or name.startswith('.openai/local') or '.git' in parts or 'node_modules' in parts

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True, type=pathlib.Path)
    parser.add_argument('--data', type=pathlib.Path)
    parser.add_argument('--verification', type=pathlib.Path)
    parser.add_argument('--with-build', action='store_true')
    args = parser.parse_args()
    output = args.output.resolve()
    if output.exists():
        raise SystemExit('Choose a new output path; an archive already exists there.')
    if git('status', '--porcelain').strip():
        raise SystemExit('Commit intended source/doc changes before packaging. Worktree must be clean.')
    commit = git('rev-parse', 'HEAD').decode().strip()
    branch = git('branch', '--show-current').decode().strip()
    tracked = [p.decode() for p in git('ls-files', '-z').split(b'\0') if p]
    # Check reachable Git object payloads without copying .git configuration.
    objects = git('rev-list', '--objects', '--all').splitlines()
    object_names = {line.split(b' ', 1)[0]: line.split(b' ', 1)[-1].decode(errors='replace') for line in objects}
    for name in object_names.values():
        if credential_path(name):
            raise SystemExit('Credential/runtime-like historical path: ' + name)
    packed = subprocess.check_output(['git', '-C', str(ROOT), 'cat-file', '--batch'], input=b'\n'.join(object_names) + b'\n')
    offset = 0
    blobs = 0
    while offset < len(packed):
        end = packed.index(b'\n', offset)
        sha, kind, raw_size = packed[offset:end].split()
        size = int(raw_size)
        body = packed[end+1:end+1+size]
        if kind == b'blob':
            audit('Git object ' + sha.decode(), body)
            blobs += 1
        offset = end + 1 + size + 1
    files = {}
    def put(name, body):
        if name in files:
            raise SystemExit('Duplicate archive member: ' + name)
        audit(name, body)
        files[name] = body
    for name in tracked:
        if credential_path(name):
            raise SystemExit('Credential/runtime-like tracked path: ' + name)
        path = ROOT / name
        if path.is_symlink():
            raise SystemExit('Review tracked symlink before packaging: ' + name)
        put('source/' + name, path.read_bytes())
    for prefix, folder in [('data', args.data), ('verification', args.verification)]:
        if not folder:
            continue
        folder = folder.resolve()
        if not folder.is_dir():
            raise SystemExit('Missing input directory: ' + str(folder))
        for path in sorted(folder.rglob('*')):
            if path.is_symlink():
                raise SystemExit('Review input symlink: ' + str(path))
            if path.is_file():
                name = path.relative_to(folder).as_posix()
                if credential_path(name):
                    raise SystemExit('Runtime-like path in supplied data/checks: ' + name)
                put(prefix + '/' + name, path.read_bytes())
    if args.with_build:
        for part in ['client', 'server']:
            folder = ROOT / 'dist' / part
            if not folder.is_dir():
                raise SystemExit('Build first: missing dist/' + part)
            for path in sorted(folder.rglob('*')):
                if path.is_file():
                    put('build/' + part + '/' + path.relative_to(folder).as_posix(), path.read_bytes())
    with tempfile.TemporaryDirectory(prefix='liquid-light-history-') as tmp:
        bundle = pathlib.Path(tmp) / 'liquid-light-nodes-lab.bundle'
        subprocess.run(['git', '-C', str(ROOT), 'bundle', 'create', str(bundle), '--all'], check=True, capture_output=True)
        checked = subprocess.run(['git', '-C', str(ROOT), 'bundle', 'verify', str(bundle)], check=True, capture_output=True)
        put('history/liquid-light-nodes-lab.bundle', bundle.read_bytes())
        put('verification/git-bundle.txt', checked.stdout + checked.stderr)
    put('history/commits.txt', git('log', '--all', '--date=iso-strict', '--format=%H %ad %s'))
    manifest = {
        'format': 'liquid-light-nodes-lab-handoff', 'version': 1,
        'created_at': dt.datetime.now(dt.timezone.utc).isoformat(),
        'source_commit': commit, 'source_branch': branch,
        'available_commit_count': int(git('rev-list', '--count', '--all')),
        'tracked_source_files': len(tracked), 'audited_reachable_blob_count': blobs,
        'includes_build': args.with_build, 'includes_explicit_data': bool(args.data),
        'source_baseline_release': '6d49470fb85939cffeecbb543a0f6202e15a293d',
        'scope': 'Nodes Lab only; earlier Liquid Light Studio is a separate application.',
        'exclusions': ['node_modules', '.git config/hooks/credentials', 'browser profiles/sessions', 'runtime secrets', 'data never exported/synced from other devices'],
        'data_boundary': 'Only files explicitly supplied under --data; not a raw administrative cloud-bucket export.',
        'secret_check': 'Recognizable credential patterns in current files and reachable Git blobs; not a formal security audit.',
    }
    put('manifest.json', (json.dumps(manifest, indent=2) + '\n').encode())
    start = '''# Liquid Light · Nodes Lab — portable handoff

Start with `source/HANDOFF.md`. All technical documentation and native examples are under `source/`.

To recover Git history from this extracted directory:

```bash
git clone history/liquid-light-nodes-lab.bundle liquid-light-nodes-lab
cd liquid-light-nodes-lab
npm ci
npm test
npm run build
npm run dev
```

Alternatively run those npm commands inside `source/` without Git history.

`data/` is separate personal artwork/workspace data. Read its inventory before restoring: the open editor and cloud state may differ. Import the supplied native graph files without changing the live cloud revision. The frontend runs independently; cross-device sync on a new host needs verified identity and object storage. No API/login key is required for local editing.

`manifest.json` records the exact source snapshot. `verification/` records checks; `SHA256SUMS` validates archive members. No GitHub repository is created by packaging. Read the backup/migration guides for private GitHub import and independent hosting.
'''
    put('START_HERE.md', start.encode())
    sums = ''.join(hashlib.sha256(body).hexdigest() + '  ' + name + '\n' for name, body in sorted(files.items()))
    files['SHA256SUMS'] = sums.encode()
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, 'x', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name, body in sorted(files.items()):
            archive.writestr(name, body)
    with zipfile.ZipFile(output) as archive:
        if archive.testzip():
            raise SystemExit('ZIP integrity verification failed.')
        for line in archive.read('SHA256SUMS').decode().splitlines():
            expected, name = line.split('  ', 1)
            if hashlib.sha256(archive.read(name)).hexdigest() != expected:
                raise SystemExit('Checksum mismatch: ' + name)
    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    print(json.dumps({'archive': str(output), 'size_bytes': output.stat().st_size, 'sha256': digest, 'source_commit': commit, 'members': len(files), 'history_blobs_checked': blobs}))

if __name__ == '__main__':
    main()
