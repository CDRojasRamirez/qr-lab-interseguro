#!/bin/sh
# Writes the runtime config the SPA fetches at boot (see core/config/app-config.ts).
# nginx serves it from /tmp so the image also works with a read-only root fs.
set -eu

# DEMO_USERNAME / DEMO_PASSWORD are intentionally PUBLIC demo credentials: they end up
# in config.json and on the login screen. Omit either var to hide the block.
demo=""
if [ -n "${DEMO_USERNAME:-}" ] && [ -n "${DEMO_PASSWORD:-}" ]; then
  demo=",\"demoCredentials\":{\"username\":\"${DEMO_USERNAME}\",\"password\":\"${DEMO_PASSWORD}\"}"
fi

cat > /tmp/config.json <<EOF
{"goApiUrl":"${GO_API_URL:-http://localhost:8080}","nodeApiUrl":"${NODE_API_URL:-http://localhost:3000}"${demo}}
EOF
