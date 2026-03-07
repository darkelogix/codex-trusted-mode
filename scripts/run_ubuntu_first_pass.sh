#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EVIDENCE_DIR="${REPO_ROOT}/release-evidence"
ARCHIVE_NAME="${1:-codex-ubuntu-first-pass-evidence.tgz}"

mkdir -p "${EVIDENCE_DIR}"

echo "[1/7] Installing repo dependencies"
npm install

echo "[2/7] Running Linux clean-room baseline"
npm run clean-room-smoke:linux -- ubuntu-vm-first-pass codex-ubuntu-vm

echo "[3/7] Capturing Codex runtime stream"
if command -v codex >/dev/null 2>&1; then
  codex exec --json "List the files in the current directory and then stop." > "${EVIDENCE_DIR}/codex-exec-capture.jsonl"
else
  echo "codex not found on PATH" >&2
  exit 1
fi

echo "[4/7] Parsing runtime stream evidence"
node scripts/parse_codex_jsonl_evidence.js --input "${EVIDENCE_DIR}/codex-exec-capture.jsonl" --source real_runtime

echo "[5/7] Running live app-server capture"
PATH="$HOME/.local/bin:$HOME/.npm-global/bin:/usr/local/bin:/usr/bin:/bin:$PATH" npm run capture-live-app-server-session:node

if [[ -f "${EVIDENCE_DIR}/native-hook-callback-raw.json" ]]; then
  echo "[6/7] Normalizing native hook evidence"
  node scripts/capture_native_hook_evidence.js --input "${EVIDENCE_DIR}/native-hook-callback-raw.json" --source real_runtime
else
  echo "[6/7] Native hook callback not captured; skipping normalization"
fi

echo "[7/7] Verifying certification gate"
node scripts/verify_certification_gate.js

echo "Packaging evidence archive: ${ARCHIVE_NAME}"
tar -czf "${ARCHIVE_NAME}" \
  release-evidence

echo "Evidence archive written to ${REPO_ROOT}/${ARCHIVE_NAME}"
