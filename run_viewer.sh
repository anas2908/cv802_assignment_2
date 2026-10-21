#!/usr/bin/env bash
# Open the surface-extraction results in your browser: meshes and point clouds of every method on every input,
# metrics, film storyboards, report and slides. CPU only, no installation: needs Python 3.8+.
#   bash run_viewer.sh            (Ctrl-C to stop)        PORT=8800 bash run_viewer.sh   to choose the port
set -euo pipefail
cd "$(dirname "$0")"
PY="$(command -v python3 || command -v python)" || { echo "Python 3 is required"; exit 1; }
"$PY" - <<'PY'
import pathlib, zipfile
out = pathlib.Path(".viewer_cache/results"); out.mkdir(parents=True, exist_ok=True)
for z in sorted(pathlib.Path("results").glob("*.zip")):
    stamp = out / (z.stem + ".unpacked")
    if stamp.exists() and stamp.stat().st_mtime >= z.stat().st_mtime:
        continue
    print("unpacking", z); zipfile.ZipFile(z).extractall(out); stamp.touch()
PY
PORT="${PORT:-$("$PY" -c 'import socket;s=socket.socket();s.bind(("127.0.0.1",0));print(s.getsockname()[1])')}"
URL="http://127.0.0.1:${PORT}/hub/"
echo "Open: ${URL}   (classic viewer: http://127.0.0.1:${PORT}/viewer  ·  compare: http://127.0.0.1:${PORT}/compare)"
( sleep 2; (command -v open >/dev/null && open "$URL") || (command -v xdg-open >/dev/null && xdg-open "$URL") ) >/dev/null 2>&1 &
export CV802_SP2_DATASET_LABEL="bundled results: VGGSfM, MVS and MVS (floaters removed) — the run name starts with its input"
exec "$PY" -B surface/ui/server.py --host 127.0.0.1 --port "$PORT" --no-auth --read-only \
  --results-root .viewer_cache/results --outputs-root .viewer_cache/no_outputs \
  --input-ply surface/inputs/light_shirt_vggsfm_clean.ply
