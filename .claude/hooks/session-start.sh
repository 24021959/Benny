#!/bin/bash
# Installs tooling needed by the repo's skills in Claude Code cloud sessions.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

if ! command -v notebooklm >/dev/null 2>&1; then
  pip install --quiet "notebooklm-py[browser]" \
    || pip install --quiet --break-system-packages "notebooklm-py[browser]" \
    || echo "notebooklm-py install failed; the notebooklm skill will be unavailable" >&2
fi
