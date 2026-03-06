#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENVIRONMENT_LABEL="${1:-ubuntu-clean-room}"
CODEX_RUNTIME="${2:-unknown}"

TIMESTAMP="$(date -u +"%Y%m%d-%H%M%S")"
RUN_ID="${ENVIRONMENT_LABEL}-${TIMESTAMP}"
TEMP_ROOT="${REPO_ROOT}/.clean-room/${RUN_ID}"
RUNS_ROOT="${REPO_ROOT}/release-evidence/matrix/runs"
SUMMARY_PATH="${RUNS_ROOT}/${RUN_ID}.json"

mkdir -p "${TEMP_ROOT}" "${RUNS_ROOT}"
export NPM_CONFIG_CACHE="${TEMP_ROOT}/npm-cache"

node_test_status="not_run"
steps_json=()

run_step() {
  local name="$1"
  local command="$2"
  local optional="${3:-false}"
  local started_at
  started_at="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

  set +e
  bash -lc "${command}"
  local exit_code=$?
  set -e

  local completed_at
  completed_at="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

  if [[ "${exit_code}" -eq 0 ]]; then
    steps_json+=("{\"name\":\"${name}\",\"status\":\"passed\",\"optional\":${optional},\"startedAtUtc\":\"${started_at}\",\"completedAtUtc\":\"${completed_at}\"}")
    return 0
  fi

  if [[ "${optional}" == "true" ]]; then
    steps_json+=("{\"name\":\"${name}\",\"status\":\"warning\",\"optional\":true,\"startedAtUtc\":\"${started_at}\",\"completedAtUtc\":\"${completed_at}\",\"detail\":\"exit ${exit_code}\"}")
    return 0
  fi

  steps_json+=("{\"name\":\"${name}\",\"status\":\"failed\",\"optional\":false,\"startedAtUtc\":\"${started_at}\",\"completedAtUtc\":\"${completed_at}\",\"detail\":\"exit ${exit_code}\"}")
  return "${exit_code}"
}

cd "${REPO_ROOT}"

run_step "node_test" "node --test" true
run_step "verify_config_contract" "node scripts/verify_config_contract.js"
run_step "verify_local_hardening" "node scripts/verify_local_hardening.js"
run_step "verify_pdp_request_shape" "node scripts/verify_pdp_request_shape.js"
run_step "verify_certification_gate" "node scripts/verify_certification_gate.js"
run_step "package_dry_run" "npm pack --dry-run --cache .npm-cache"
run_step "free_demo" "node scripts/run_free_demo.js"

overall_status="passed"
for step in "${steps_json[@]}"; do
  if [[ "${step}" == *"\"status\":\"failed\""* ]]; then
    overall_status="failed"
    break
  fi
done

{
  echo "{"
  echo "  \"capturedAtUtc\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\","
  echo "  \"runId\": \"${RUN_ID}\","
  echo "  \"environmentLabel\": \"${ENVIRONMENT_LABEL}\","
  echo "  \"codexRuntime\": \"${CODEX_RUNTIME}\","
  echo "  \"repoRoot\": \"${REPO_ROOT//\\/\\\\}\","
  echo "  \"isolatedTempRoot\": \"${TEMP_ROOT//\\/\\\\}\","
  echo "  \"overallStatus\": \"${overall_status}\","
  echo "  \"steps\": ["
} > "${SUMMARY_PATH}"

for i in "${!steps_json[@]}"; do
  if [[ "${i}" -gt 0 ]]; then
    echo "," >> "${SUMMARY_PATH}"
  fi
  echo "    ${steps_json[$i]}" >> "${SUMMARY_PATH}"
done

cat >> "${SUMMARY_PATH}" <<EOF
  ]
}
EOF

cat "${SUMMARY_PATH}"
