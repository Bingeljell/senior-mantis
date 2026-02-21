#!/usr/bin/env bash
# Local desktop smoke checks for HolyOps development (no GUI launch).

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

HOLYOPS_CONFIG_PATH="${HOME}/.holyops/holyops.json"
LEGACY_CONFIG_PATH="${HOME}/.seniormantis/seniormantis.json"
CONFIG_PATH="${SM_CONFIG_PATH:-}"
if [[ -z "${CONFIG_PATH}" ]]; then
  if [[ -f "${HOLYOPS_CONFIG_PATH}" ]]; then
    CONFIG_PATH="${HOLYOPS_CONFIG_PATH}"
  elif [[ -f "${LEGACY_CONFIG_PATH}" ]]; then
    CONFIG_PATH="${LEGACY_CONFIG_PATH}"
  else
    CONFIG_PATH="${HOLYOPS_CONFIG_PATH}"
  fi
fi
ALLOW_SETUP=0

for arg in "$@"; do
  case "${arg}" in
    --with-setup) ALLOW_SETUP=1 ;;
    --help|-h)
      cat <<'EOF'
Usage: scripts/smoke-desktop-local.sh [--with-setup]

Runs non-GUI HolyOps desktop preflight checks.

Options:
  --with-setup   If config is missing, run `node holyops.mjs setup` automatically.
EOF
      exit 0
      ;;
    *)
      printf "Unknown argument: %s\n" "${arg}" >&2
      exit 2
      ;;
  esac
done

log() {
  printf "==> %s\n" "$*"
}

run() {
  log "$*"
  "$@"
}

run node --version
run pnpm --version
# Validate Electron package wiring without launching the Electron binary (avoids GUI crash popups).
run pnpm --dir apps/desktop-electron list electron --depth 0
run node holyops.mjs --help
run node holyops.mjs gateway --help

if [[ ! -f "${CONFIG_PATH}" ]]; then
  if [[ "${ALLOW_SETUP}" -eq 1 ]]; then
    log "Missing config at ${CONFIG_PATH}; running setup once."
    run node holyops.mjs setup
  else
    printf "Missing config at %s. Run `node holyops.mjs setup` (or rerun with --with-setup).\n" "${CONFIG_PATH}" >&2
    exit 2
  fi
fi

log "node holyops.mjs status --json"
STATUS_JSON="$(node holyops.mjs status --json)"
printf "%s\n" "${STATUS_JSON}"

WORKSPACE_DIR="$(printf "%s" "${STATUS_JSON}" | node -e '
let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  raw += chunk;
});
process.stdin.on("end", () => {
  try {
    const parsed = JSON.parse(raw);
    const workspace = parsed?.agents?.agents?.[0]?.workspaceDir;
    process.stdout.write(typeof workspace === "string" ? workspace : "");
  } catch {
    process.stdout.write("");
  }
});
')"
LEGACY_WORKSPACE_PATH="${HOME}/.openclaw/workspace"
if [[ "${WORKSPACE_DIR}" == "${LEGACY_WORKSPACE_PATH}" ]]; then
  log "Legacy workspace default detected at ${LEGACY_WORKSPACE_PATH}."
  log "Run node holyops.mjs setup to migrate default workspace to ~/.holyops/workspace."
fi

log "Desktop smoke checks passed."
