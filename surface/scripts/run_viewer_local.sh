#!/usr/bin/env bash
# Read-only viewer of the bundled results (surface/results) on any machine with python3, e.g. a Mac. No GPU.
set -Eeuo pipefail
HERE="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PORT="${CV802_VIEWER_PORT:-8791}"
echo "Open http://127.0.0.1:${PORT}/viewer   (Ctrl-C to stop)"
( sleep 1.5; command -v open >/dev/null && open "http://127.0.0.1:${PORT}/viewer" ) >/dev/null 2>&1 &
exec python3 -B "${HERE}/../ui/server.py" --host 127.0.0.1 --port "${PORT}" --no-auth --read-only \
  --outputs-root "${HERE}/../results/_none" --input-ply "${HERE}/../inputs/light_shirt_vggsfm_clean.ply"
