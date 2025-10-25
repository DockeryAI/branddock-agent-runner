#!/usr/bin/env bash
set -euo pipefail
# run sync if present; ignore failure
if [ -f scripts/sync-spec.mjs ]; then node scripts/sync-spec.mjs || true; fi
node scripts/sanitize-spec.mjs
