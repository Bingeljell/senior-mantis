#!/usr/bin/env bash
# Local desktop smoke checks for HolyOps development (no GUI launch).

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

CONFIG_PATH="${SM_CONFIG_PATH:-${HOME}/.seniormantis/seniormantis.json}"

log() {
  printf "==> %s\n" "$*"
}

run() {
  log "$*"
  "$@"
}

run node --version
run pnpm --version
run pnpm --dir apps/desktop-electron exec electron --version
run node holyops.mjs --help
run node holyops.mjs gateway --help

if [[ ! -f "${CONFIG_PATH}" ]]; then
  log "Missing config at ${CONFIG_PATH}; running setup once."
  run node holyops.mjs setup
fi

run node holyops.mjs status --json

log "Desktop smoke checks passed."
