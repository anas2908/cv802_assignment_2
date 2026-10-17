#!/usr/bin/env python3
"""CV802 Sub-project 2 (surface extraction) dashboard, run orchestrator and mesh viewer.

Dependency-free: Python 3.9+ standard library only. The browser side uses a vendored
three.js build in ``web/vendor``.

It must run on the allocation node (``surface/scripts/run_ui.sh`` starts it through
``node_run.sh``). It never computes anything heavy itself: a run is

    bash surface/methods/<id>/run.sh <run_dir> <run args>
    bash surface/scripts/finalize.sh <run_dir> <finalize args>

each started in its own process group, GPU phases wrapped in
``flock /tmp/cv802_sp2_gpu.lock`` (the same lock file as ``node_run.sh``), one active run
at a time with a FIFO queue. ``--read-only`` turns it into a pure result viewer.
"""

from __future__ import annotations

import argparse
import collections
import fcntl
import gzip
import hashlib
import json
import os
import re
import secrets
import shlex
import shutil
import signal
import socket
import subprocess
import sys
import tempfile
import threading
import time
import zipfile
from dataclasses import asdict, dataclass, field
from http import HTTPStatus
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Optional
from urllib.parse import parse_qs, quote, unquote, urlencode, urlparse

UI_ROOT = Path(__file__).resolve().parent
SURFACE_ROOT = UI_ROOT.parent
WEB_ROOT = UI_ROOT / "web"
DEFAULT_DATA_ROOT = Path(os.environ.get("CV802_SP2_DATA_ROOT", f"/l/users/{os.environ.get('USER', 'user')}/cv802_sp2"))
GPU_LOCK_DEFAULT = "/tmp/cv802_sp2_gpu.lock"
SAFE_SEGMENT = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._+-]{0,199}$")
MIME = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".obj": "text/plain; charset=utf-8",
    ".mtl": "text/plain; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".log": "text/plain; charset=utf-8",
    ".md": "text/plain; charset=utf-8",
    ".ply": "application/octet-stream",
    ".zip": "application/zip",
}
GZIP_EXTENSIONS = {".obj", ".mtl", ".json", ".js", ".txt", ".log", ".css", ".html"}
GZIP_MIN_BYTES = 64 * 1024
PREVIEW_ORDER = ["preview_front.png", "preview_back.png", "preview_left.png", "preview_right.png", "preview_shaded.png"]
TERMINAL_STATES = {"succeeded", "failed", "cancelled", "interrupted"}


def now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%S%z")


def read_json(path: Path) -> Optional[Any]:
    try:
        with path.open("r", encoding="utf-8") as stream:
            return json.load(stream)
    except (OSError, ValueError):
        return None


def write_json_atomic(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(f".{path.name}.{os.getpid()}.{threading.get_ident()}.tmp")
    with tmp.open("w", encoding="utf-8") as stream:
        json.dump(payload, stream, indent=2, default=str)
    os.replace(tmp, path)


def tail_bytes(path: Path, limit: int) -> str:
    try:
        size = path.stat().st_size
        with path.open("rb") as stream:
            if size > limit:
                stream.seek(size - limit)
                data = stream.read()
                cut = data.find(b"\n")
                data = data[cut + 1:] if 0 <= cut < 4096 else data
            else:
                data = stream.read()
        return data.decode("utf-8", errors="replace")
    except OSError:
        return ""


def within(child: Path, parent: Path) -> bool:
    try:
        child.relative_to(parent)
        return True
    except ValueError:
        return False


# --------------------------------------------------------------------------------------
# Configuration and method catalogue
# --------------------------------------------------------------------------------------


@dataclass
class Config:
    code_root: Path
    data_root: Path
    outputs_root: Path
    results_root: Path
    methods_root: Path
    finalize_script: Path
    input_ply: Path
    cache_dir: Path
    gpu_lock: str
    read_only: bool
    token: Optional[str]
    port: int
    host: str
    gpu_poll_seconds: float = 2.0
    kill_grace_seconds: float = 10.0


def load_catalog() -> dict[str, Any]:
    payload = read_json(UI_ROOT / "methods_catalog.json") or {}
    return payload if isinstance(payload, dict) else {}


def method_ids(cfg: Config, catalog: dict[str, Any]) -> list[str]:
    ordered = [entry["id"] for entry in catalog.get("methods", []) if isinstance(entry, dict) and "id" in entry]
    if cfg.methods_root.is_dir():
        for child in sorted(cfg.methods_root.iterdir()):
            if child.is_dir() and SAFE_SEGMENT.match(child.name) and child.name not in ordered:
                if (child / "pipeline.json").is_file() or (child / "run.sh").is_file():
                    ordered.append(child.name)
    return ordered


def method_spec(cfg: Config, catalog: dict[str, Any], method_id: str) -> dict[str, Any]:
    base = next((dict(e) for e in catalog.get("methods", []) if isinstance(e, dict) and e.get("id") == method_id), {})
    base.setdefault("id", method_id)
    base.setdefault("name", method_id)
    folder = cfg.methods_root / method_id
    pipeline_path = folder / "pipeline.json"
    pipeline = read_json(pipeline_path) if pipeline_path.is_file() else None
    pipeline_error = None
    if pipeline_path.is_file() and not isinstance(pipeline, dict):
        pipeline_error = "pipeline.json is not a valid JSON object"
        pipeline = None
    spec = {
        **base,
        "folder_exists": folder.is_dir(),
        "has_run_sh": (folder / "run.sh").is_file(),
        "has_readme": (folder / "README.md").is_file(),
        "has_pipeline_json": pipeline is not None,
        "pipeline_error": pipeline_error,
        "default_run_args": [],
        "finalize_args": [],
        "expected_minutes_source": "estimate" if "expected_minutes" in base else None,
    }
    if pipeline:
        for key in ("name", "method_name", "paper", "paper_url", "official_code", "description", "colour"):
            if isinstance(pipeline.get(key), str) and pipeline[key]:
                spec["name" if key == "method_name" else key] = pipeline[key]
        if isinstance(pipeline.get("default_run_args"), list):
            spec["default_run_args"] = [str(a) for a in pipeline["default_run_args"]]
        if isinstance(pipeline.get("finalize_args"), list):
            spec["finalize_args"] = [str(a) for a in pipeline["finalize_args"]]
        if isinstance(pipeline.get("expected_minutes"), (int, float)):
            spec["expected_minutes"] = pipeline["expected_minutes"]
            spec["expected_minutes_source"] = "pipeline.json"
        if isinstance(pipeline.get("gpu"), bool):
            spec["gpu"] = pipeline["gpu"]
        if isinstance(pipeline.get("finalize_gpu"), bool):
            spec["finalize_gpu"] = pipeline["finalize_gpu"]
        if isinstance(pipeline.get("self_locking"), bool):
            spec["self_locking"] = pipeline["self_locking"]
    spec.setdefault("gpu", True)
    spec.setdefault("finalize_gpu", False)
    if "self_locking" not in spec:
        # A run.sh that takes the GPU lock itself must not be wrapped again (nested flock on
        # the same file from a second open file description would deadlock).
        run_sh = folder / "run.sh"
        try:
            spec["self_locking"] = "cv802_sp2_gpu.lock" in run_sh.read_text(errors="replace")
        except OSError:
            spec["self_locking"] = False
    spec["runnable"] = bool(spec["has_run_sh"] and cfg.finalize_script.is_file() and not cfg.read_only)
    if not spec["has_run_sh"]:
        spec["not_runnable_reason"] = "run.sh not written yet"
    elif not cfg.finalize_script.is_file():
        spec["not_runnable_reason"] = "surface/scripts/finalize.sh not found"
    elif cfg.read_only:
        spec["not_runnable_reason"] = "read-only viewer"
    return spec


# --------------------------------------------------------------------------------------
# Result discovery
# --------------------------------------------------------------------------------------


def flatten(obj: Any, prefix: str = "") -> dict[str, Any]:
    flat: dict[str, Any] = {}
    if isinstance(obj, dict):
        for key, value in obj.items():
            flat.update(flatten(value, f"{prefix}.{key}" if prefix else str(key)))
    elif isinstance(obj, (int, float, bool, str)) or obj is None:
        flat[prefix] = obj
    return flat


def _numeric(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def pick_metric(flat: dict[str, Any], include: list[str], exclude: list[str] = (), numeric: bool = True) -> Optional[tuple[str, Any]]:
    """Return the first (key, value) whose lower-cased dotted key matches the patterns in order."""
    for pattern in include:
        regex = re.compile(pattern)
        for key, value in flat.items():
            lowered = key.lower()
            if not regex.search(lowered) or any(re.search(e, lowered) for e in exclude):
                continue
            if numeric and not _numeric(value):
                continue
            if not numeric and not isinstance(value, bool):
                continue
            return key, value
    return None


F_HALF = r"(0[._]?5(pct|_?percent|%)?|0[._]?005|half)(?![0-9])"
F_ONE = r"((?<![0-9.])1(pct|_?percent|%)|0[._]?01(?![0-9])|_1$|@1$)"


def summarise_metrics(metrics: dict[str, Any], manifest: dict[str, Any]) -> dict[str, Any]:
    """Pick headline numbers for the compare table and record which source key each came from."""
    flat = flatten(metrics or {})
    flat_manifest = flatten(manifest.get("metrics") or {})
    for key, value in flat_manifest.items():
        flat.setdefault(key, value)
    out: dict[str, Any] = {}
    sources: dict[str, str] = {}

    def put(name: str, hit: Optional[tuple[str, Any]], prefix: str = "metrics") -> None:
        if hit is not None:
            out[name] = hit[1]
            sources[name] = f"{prefix}:{hit[0]}"

    no_direction = [r"(to_|_to|->|precision|recall|accuracy|completeness|a2b|b2a|max|median|std|p9)"]
    put("chamfer", pick_metric(flat, [r"chamfer.*(sym|mean|avg|total|l1|l2)$", r"chamfer[^.]*$", r"chamfer"], no_direction[0:1]))
    if "chamfer" not in out:
        put("chamfer", pick_metric(flat, [r"chamfer"]))
    fkeys = [r"f_?score", r"(^|\.)f1(\b|_)"]
    put("fscore_05", pick_metric(flat, [rf"{f}.*{F_HALF}" for f in fkeys] + [rf"{F_HALF}.*{f}" for f in fkeys]))
    put("fscore_1", pick_metric(flat, [rf"{f}.*{F_ONE}" for f in fkeys] + [rf"{F_ONE}.*{f}" for f in fkeys], [F_HALF]))
    put("psnr", pick_metric(flat, [r"psnr"]))
    put("color_mae", pick_metric(flat, [r"(colou?r|rgb).*(mae|mean_abs|abs_err|l1)", r"(mae|mean_abs).*(colou?r|rgb)"]))
    put("normal_consistency", pick_metric(flat, [r"normal.*consist"]))
    put("watertight", pick_metric(flat, [r"watertight"], numeric=False))
    put("edge_manifold", pick_metric(flat, [r"edge.?manifold", r"manifold"], numeric=False))
    put("components", pick_metric(flat, [r"(connected_)?components?$", r"components"]))
    put("boundary_edges", pick_metric(flat, [r"boundary_edges?$", r"boundary"]))
    put("surface_area", pick_metric(flat, [r"surface_area", r"(^|\.)area$"]))
    mesh = manifest.get("mesh") or {}
    if _numeric(mesh.get("faces")):
        out["faces"], sources["faces"] = mesh["faces"], "manifest:mesh.faces"
    else:
        put("faces", pick_metric(flat, [r"(^|\.)(n_|num_)?faces$", r"faces"]))
    if _numeric(mesh.get("vertices")):
        out["vertices"], sources["vertices"] = mesh["vertices"], "manifest:mesh.vertices"
    else:
        put("vertices", pick_metric(flat, [r"(^|\.)(n_|num_)?vert(ex|ices)$", r"vertices"]))
    info = manifest.get("method_info") or {}
    if _numeric(info.get("elapsed_seconds")):
        out["runtime_s"], sources["runtime_s"] = info["elapsed_seconds"], "method_info:elapsed_seconds"
    if _numeric(info.get("peak_gpu_mib")):
        out["peak_gpu_mib"], sources["peak_gpu_mib"] = info["peak_gpu_mib"], "method_info:peak_gpu_mib"
    out["_sources"] = sources
    # Prefer the finalizer's canonical summary (contract: manifest["metrics"]) over pattern matching.
    canon = manifest.get("metrics") if isinstance(manifest.get("metrics"), dict) else {}
    for key, src in (("fscore_05", "fscore_0_5pct"), ("fscore_1", "fscore_1pct"), ("psnr", "color_psnr_db")):
        if isinstance(canon.get(src), (int, float)):
            out[key] = canon[src]
            out.setdefault("_sources", {})[key] = f"manifest:metrics.{src}"
    geo = metrics.get("geometry") if isinstance(metrics.get("geometry"), dict) else {}
    if isinstance(geo.get("chamfer_pct_diag"), (int, float)):
        out["chamfer_pct"] = geo["chamfer_pct_diag"]
    return out


@dataclass
class RunRecord:
    key: str
    source: str
    method_id: str
    run_id: str
    directory: Path
    manifest: dict[str, Any]
    mtime: float

    def file(self, name: str) -> Optional[Path]:
        path = self.directory / name
        return path if path.is_file() else None


class ResultIndex:
    """Scans ``<outputs>/*/*/manifest.json`` and bundled ``results/**/manifest.json`` with a short TTL cache."""

    def __init__(self, cfg: Config, ttl: float = 3.0) -> None:
        self.cfg = cfg
        self.ttl = ttl
        self._lock = threading.Lock()
        self._stamp = 0.0
        self._runs: dict[str, RunRecord] = {}

    def _load(self, manifest_path: Path, source: str) -> Optional[RunRecord]:
        manifest = read_json(manifest_path)
        if not isinstance(manifest, dict):
            return None
        directory = manifest_path.parent
        method_id = str(manifest.get("method_id") or directory.parent.name)
        run_id = str(manifest.get("run_id") or directory.name)
        if not SAFE_SEGMENT.match(method_id) or not SAFE_SEGMENT.match(run_id):
            method_id, run_id = directory.parent.name, directory.name
            if not SAFE_SEGMENT.match(method_id) or not SAFE_SEGMENT.match(run_id):
                return None
        try:
            mtime = manifest_path.stat().st_mtime
        except OSError:
            return None
        return RunRecord(f"{source}/{method_id}/{run_id}", source, method_id, run_id, directory, manifest, mtime)

    def runs(self, force: bool = False) -> dict[str, RunRecord]:
        with self._lock:
            if not force and time.monotonic() - self._stamp < self.ttl:
                return self._runs
            found: dict[str, RunRecord] = {}
            if self.cfg.outputs_root.is_dir():
                for manifest_path in sorted(self.cfg.outputs_root.glob("*/*/manifest.json")):
                    record = self._load(manifest_path, "outputs")
                    if record:
                        found[record.key] = record
            if self.cfg.results_root.is_dir():
                for manifest_path in sorted(self.cfg.results_root.rglob("manifest.json")):
                    record = self._load(manifest_path, "bundled")
                    if record:
                        found.setdefault(record.key, record)
            self._runs = found
            self._stamp = time.monotonic()
            return found

    def get(self, key: str) -> Optional[RunRecord]:
        record = self.runs().get(key)
        if record is None:
            record = self.runs(force=True).get(key)
        return record


def file_url(record: RunRecord, name: str) -> str:
    return f"/files/{record.source}/{quote(record.method_id)}/{quote(record.run_id)}/{quote(name)}"


def texture_names(record: RunRecord) -> list[str]:
    mtl = record.file("mesh.mtl")
    names: list[str] = []
    if mtl:
        try:
            for line in mtl.read_text(errors="replace").splitlines():
                parts = line.strip().split()
                if parts and parts[0].lower().startswith("map_") and len(parts) > 1:
                    name = parts[-1].replace("\\", "/")
                    if name not in names and (record.directory / name).is_file():
                        names.append(name)
        except OSError:
            pass
    if not names and record.file("texture.png"):
        names.append("texture.png")
    return names


def run_summary(record: RunRecord, detailed: bool = False) -> dict[str, Any]:
    manifest = record.manifest
    info = manifest.get("method_info") if isinstance(manifest.get("method_info"), dict) else {}
    if not info:
        info = read_json(record.directory / "method_info.json") or {}
    metrics_full = read_json(record.directory / "metrics.json") if record.file("metrics.json") else None
    summary = {
        "key": record.key,
        "source": record.source,
        "method_id": record.method_id,
        "method_name": manifest.get("method_name") or info.get("method_name") or record.method_id,
        "run_id": record.run_id,
        "status": manifest.get("status", "complete"),
        "created_at": manifest.get("created_at"),
        "mtime": record.mtime,
        "mesh": manifest.get("mesh") or {},
        "texture": manifest.get("texture") or {},
        "input": manifest.get("input") or {},
        "headline": summarise_metrics(metrics_full if isinstance(metrics_full, dict) else {}, {**manifest, "method_info": info}),
        "method_info": {k: info.get(k) for k in ("method_name", "paper", "official_code", "commit", "elapsed_seconds", "peak_gpu_mib", "device") if k in info},
        "has_obj": record.file("mesh.obj") is not None,
        "thumb": file_url(record, "thumb.png") if record.file("thumb.png") else (
            file_url(record, "preview_front.png") if record.file("preview_front.png") else None),
        "zip": f"/download/{record.source}/{quote(record.method_id)}/{quote(record.run_id)}.zip",
    }
    if detailed:
        files = {}
        for name in ("mesh.obj", "mesh.mtl", "display.obj", "display.mtl", "display.jpg", "metrics.json", "manifest.json",
                     "method_info.json", "log.txt", "geometry.ply", "ui_job.log"):
            path = record.file(name)
            if path:
                files[name] = {"url": file_url(record, name), "bytes": path.stat().st_size}
        for name in texture_names(record):
            files[name] = {"url": file_url(record, name), "bytes": (record.directory / name).stat().st_size}
        previews = [n for n in PREVIEW_ORDER if record.file(n)]
        try:
            extra = sorted(p.name for p in record.directory.glob("*.png")
                           if p.name not in previews and p.name != "thumb.png" and p.name not in texture_names(record))
        except OSError:
            extra = []
        summary.update({
            "files": files,
            "textures": texture_names(record),
            "previews": [{"name": n, "url": file_url(record, n)} for n in previews + extra],
            "metrics": metrics_full if isinstance(metrics_full, dict) else (manifest.get("metrics") or {}),
            "metrics_source": "metrics.json" if isinstance(metrics_full, dict) else "manifest.metrics",
            "method_info_full": info,
            "manifest": manifest,
        })
    return summary


# --------------------------------------------------------------------------------------
# GPU monitor
# --------------------------------------------------------------------------------------


class GpuMonitor:
    def __init__(self, cfg: Config) -> None:
        self.cfg = cfg
        self._lock = threading.Lock()
        self.latest: dict[str, Any] = {"available": False, "reason": "not polled yet"}
        self.history: collections.deque = collections.deque(maxlen=180)
        self.lock_state = "unknown"
        self._stop = threading.Event()

    def start(self) -> None:
        threading.Thread(target=self._loop, name="gpu-monitor", daemon=True).start()

    def stop(self) -> None:
        self._stop.set()

    def _query(self) -> dict[str, Any]:
        command = ["nvidia-smi"]
        visible = os.environ.get("CUDA_VISIBLE_DEVICES", "").strip()
        if visible and "," not in visible and visible.isdigit():
            command.append(f"--id={visible}")
        try:
            result = subprocess.run(
                command + ["--query-gpu=name,utilization.gpu,memory.used,memory.total,temperature.gpu,power.draw",
                           "--format=csv,noheader,nounits"],
                check=True, text=True, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, timeout=5)
            fields = [item.strip() for item in result.stdout.strip().splitlines()[0].split(",")]

            def num(value: str) -> Optional[float]:
                try:
                    return float(value)
                except ValueError:
                    return None
            payload: dict[str, Any] = {
                "available": True,
                "name": fields[0],
                "utilization_percent": num(fields[1]),
                "memory_used_mib": num(fields[2]),
                "memory_total_mib": num(fields[3]),
                "temperature_c": num(fields[4]),
                "power_w": num(fields[5]) if len(fields) > 5 else None,
                "time": time.time(),
            }
            try:
                apps = subprocess.run(
                    command + ["--query-compute-apps=pid,process_name,used_memory", "--format=csv,noheader,nounits"],
                    check=True, text=True, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, timeout=5)
                processes = []
                for line in apps.stdout.strip().splitlines():
                    parts = [p.strip() for p in line.split(",")]
                    if len(parts) >= 3:
                        processes.append({"pid": parts[0], "name": os.path.basename(parts[1]), "memory_mib": num(parts[2])})
                payload["processes"] = processes
            except (OSError, subprocess.SubprocessError):
                payload["processes"] = []
            return payload
        except (OSError, ValueError, IndexError, subprocess.SubprocessError) as error:
            return {"available": False, "reason": f"nvidia-smi unavailable ({type(error).__name__})", "time": time.time()}

    def _probe_lock(self) -> str:
        path = self.cfg.gpu_lock
        if not os.path.exists(path):
            return "free"
        try:
            fd = os.open(path, os.O_RDONLY)
        except OSError:
            return "unknown"
        try:
            fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
            fcntl.flock(fd, fcntl.LOCK_UN)
            return "free"
        except BlockingIOError:
            return "held"
        except OSError:
            return "unknown"
        finally:
            os.close(fd)

    def _loop(self) -> None:
        while not self._stop.is_set():
            sample = self._query()
            lock_state = self._probe_lock()
            with self._lock:
                self.latest = sample
                self.lock_state = lock_state
                if sample.get("available"):
                    self.history.append([round(sample["time"], 1), sample.get("utilization_percent"), sample.get("memory_used_mib")])
            self._stop.wait(self.cfg.gpu_poll_seconds)

    def snapshot(self) -> dict[str, Any]:
        with self._lock:
            return {"gpu": dict(self.latest), "history": list(self.history), "lock": self.lock_state}


# --------------------------------------------------------------------------------------
# Job runner
# --------------------------------------------------------------------------------------


@dataclass
class Job:
    id: str
    method_id: str
    run_id: str
    run_dir: str
    run_args: list[str]
    finalize_args: list[str]
    gpu: bool
    finalize_gpu: bool
    self_locking: bool
    state: str = "queued"           # queued | running | succeeded | failed | cancelled | interrupted
    phase: str = "queued"           # queued | waiting_gpu_lock | method | waiting_gpu_lock_finalize | finalize | done
    created_at: str = field(default_factory=now_iso)
    started_at: Optional[str] = None
    ended_at: Optional[str] = None
    started_monotonic: Optional[float] = None
    returncode: Optional[int] = None
    error: Optional[str] = None
    pid: Optional[int] = None
    expected_minutes: Optional[float] = None
    commands: list[list[str]] = field(default_factory=list)

    def public(self) -> dict[str, Any]:
        payload = asdict(self)
        payload.pop("started_monotonic", None)
        payload["log_url"] = f"/api/jobs/{self.id}/log"
        return payload


class JobManager:
    def __init__(self, cfg: Config, catalog: dict[str, Any]) -> None:
        self.cfg = cfg
        self.catalog = catalog
        self._lock = threading.Lock()
        self._wake = threading.Condition(self._lock)
        self.queue: collections.deque[Job] = collections.deque()
        self.current: Optional[Job] = None
        self.jobs: dict[str, Job] = {}
        self._cancel_requested: set[str] = set()
        self._proc: Optional[subprocess.Popen] = None
        self._stopping = False
        self._load_history()

    # history persisted as <run_dir>/ui_job.json so failed/cancelled runs remain visible after restarts
    def _load_history(self) -> None:
        if not self.cfg.outputs_root.is_dir():
            return
        for path in self.cfg.outputs_root.glob("*/*/ui_job.json"):
            payload = read_json(path)
            if not isinstance(payload, dict) or not payload.get("id"):
                continue
            try:
                job = Job(**{k: v for k, v in payload.items() if k in Job.__dataclass_fields__})
            except TypeError:
                continue
            if job.state not in TERMINAL_STATES:
                job.state, job.phase = "interrupted", "done"
                job.error = "The UI server stopped while this job was queued or running."
                job.ended_at = job.ended_at or now_iso()
                self._persist(job)
            self.jobs[job.id] = job

    def _persist(self, job: Job) -> None:
        try:
            write_json_atomic(Path(job.run_dir) / "ui_job.json", {k: v for k, v in asdict(job).items() if k != "started_monotonic"})
        except OSError:
            pass

    def start(self) -> None:
        threading.Thread(target=self._worker, name="job-worker", daemon=True).start()

    def enqueue(self, spec: dict[str, Any], run_args: list[str], finalize_args: list[str]) -> Job:
        method_id = spec["id"]
        stamp = time.strftime("%Y%m%d-%H%M%S")
        root = self.cfg.outputs_root / method_id
        with self._lock:
            run_id = f"{method_id}-ui-{stamp}"
            suffix = 2
            while (root / run_id).exists() or any(j.run_id == run_id for j in self.jobs.values()):
                run_id = f"{method_id}-ui-{stamp}-{suffix}"
                suffix += 1
            run_dir = root / run_id
            run_dir.mkdir(parents=True, exist_ok=False)
            job = Job(
                id=f"{run_id}-{secrets.token_hex(3)}", method_id=method_id, run_id=run_id, run_dir=str(run_dir),
                run_args=run_args, finalize_args=finalize_args, gpu=bool(spec.get("gpu", True)),
                finalize_gpu=bool(spec.get("finalize_gpu", False)), self_locking=bool(spec.get("self_locking", False)),
                expected_minutes=spec.get("expected_minutes"),
            )
            self.jobs[job.id] = job
            self.queue.append(job)
            self._persist(job)
            self._wake.notify_all()
        return job

    def cancel(self, job_id: str) -> tuple[bool, str]:
        with self._lock:
            job = self.jobs.get(job_id)
            if job is None:
                return False, "unknown job"
            if job in self.queue:
                self.queue.remove(job)
                job.state, job.phase, job.ended_at = "cancelled", "done", now_iso()
                job.error = "Cancelled before it started."
                self._persist(job)
                return True, "removed from queue"
            if self.current is job and job.state == "running":
                self._cancel_requested.add(job_id)
                proc = self._proc
                if proc and proc.poll() is None:
                    self._signal_group(proc, signal.SIGTERM)
                return True, "cancellation requested (SIGTERM sent to the process group)"
            return False, f"job is already {job.state}"

    @staticmethod
    def _signal_group(proc: subprocess.Popen, sig: int) -> None:
        try:
            os.killpg(proc.pid, sig)
        except (ProcessLookupError, PermissionError):
            pass

    def shutdown(self) -> None:
        with self._lock:
            self._stopping = True
            for job in list(self.queue):
                job.state, job.phase, job.ended_at = "cancelled", "done", now_iso()
                job.error = "UI server stopped before this job started."
                self._persist(job)
            self.queue.clear()
            current, proc = self.current, self._proc
            if current:
                self._cancel_requested.add(current.id)
            self._wake.notify_all()
        if proc and proc.poll() is None:
            self._signal_group(proc, signal.SIGTERM)
            deadline = time.monotonic() + self.cfg.kill_grace_seconds
            while proc.poll() is None and time.monotonic() < deadline:
                time.sleep(0.2)
            if proc.poll() is None:
                self._signal_group(proc, signal.SIGKILL)

    def _worker(self) -> None:
        while True:
            with self._lock:
                while not self.queue and not self._stopping:
                    self._wake.wait()
                if self._stopping:
                    return
                job = self.queue.popleft()
                self.current = job
                job.state, job.started_at, job.started_monotonic = "running", now_iso(), time.monotonic()
                self._persist(job)
            try:
                self._run(job)
            except Exception as error:  # keep the worker alive and surface the failure
                job.state, job.error = "failed", f"UI runner error: {type(error).__name__}: {error}"
            finally:
                with self._lock:
                    if job.state == "running":
                        job.state = "failed"
                    job.phase, job.ended_at = "done", now_iso()
                    self._persist(job)
                    self.current, self._proc = None, None
                    self._cancel_requested.discard(job.id)

    def _command(self, script: list[str], use_lock: bool, marker: Path) -> list[str]:
        # The marker file is touched as soon as the command (and the lock, if any) is acquired.
        inner = ["bash", "-c", 'touch "$0" && exec "$@"', str(marker), *script]
        if use_lock:
            return ["flock", self.cfg.gpu_lock, *inner]
        return inner

    def _phase(self, job: Job, name: str, script: list[str], use_lock: bool, log) -> int:
        state_dir = self.cfg.cache_dir / "jobs" / job.id
        state_dir.mkdir(parents=True, exist_ok=True)
        marker = state_dir / f"{name}.started"
        command = self._command(script, use_lock, marker)
        job.commands.append(command)
        log.write(f"\n[ui {now_iso()}] {name}: {shlex.join(command)}\n")
        log.flush()
        env = dict(os.environ)
        env.update({
            "CV802_SP2_DATA_ROOT": str(self.cfg.data_root),
            "PYTHONUNBUFFERED": "1",
            "CV802_UI_JOB_ID": job.id,
            "CV802_GPU_LOCK_HELD": "1" if use_lock else env.get("CV802_GPU_LOCK_HELD", "0"),
        })
        with self._lock:
            if job.id in self._cancel_requested:
                return -signal.SIGTERM
            job.phase = ("waiting_gpu_lock" if name == "method" else "waiting_gpu_lock_finalize") if use_lock else name
            proc = subprocess.Popen(command, stdin=subprocess.DEVNULL, stdout=log, stderr=subprocess.STDOUT,
                                    cwd=str(self.cfg.code_root), env=env, start_new_session=True)
            self._proc, job.pid = proc, proc.pid
            self._persist(job)
        term_sent_at: Optional[float] = None
        while True:
            try:
                return_code = proc.wait(timeout=0.5)
                break
            except subprocess.TimeoutExpired:
                pass
            if job.phase != name and marker.exists():
                job.phase = name
                self._persist(job)
            if job.id in self._cancel_requested:
                if term_sent_at is None:
                    self._signal_group(proc, signal.SIGTERM)
                    term_sent_at = time.monotonic()
                elif time.monotonic() - term_sent_at > self.cfg.kill_grace_seconds:
                    self._signal_group(proc, signal.SIGKILL)
        # Make sure no stragglers of this phase's process group survive.
        self._signal_group(proc, signal.SIGKILL)
        log.write(f"[ui {now_iso()}] {name} exited with code {return_code}\n")
        log.flush()
        return return_code

    def _run(self, job: Job) -> None:
        run_dir = Path(job.run_dir)
        run_dir.mkdir(parents=True, exist_ok=True)
        run_sh = self.cfg.methods_root / job.method_id / "run.sh"
        with (run_dir / "ui_job.log").open("a", encoding="utf-8", errors="replace") as log:
            log.write(f"[ui {now_iso()}] job {job.id} method={job.method_id} run_dir={run_dir}\n")
            if job.gpu and job.self_locking:
                log.write("[ui] run.sh references the GPU lock itself; not wrapping it in flock again.\n")
            code = self._phase(job, "method", ["bash", str(run_sh), str(run_dir), *job.run_args],
                               job.gpu and not job.self_locking, log)
            if job.id in self._cancel_requested:
                job.state, job.returncode, job.error = "cancelled", code, "Cancelled by user during the method stage."
                return
            if code != 0:
                job.state, job.returncode, job.error = "failed", code, f"run.sh exited with code {code}"
                return
            if not (run_dir / "geometry.ply").is_file():
                job.state, job.returncode, job.error = "failed", code, "run.sh exited 0 but did not write geometry.ply"
                return
            code = self._phase(job, "finalize", ["bash", str(self.cfg.finalize_script), str(run_dir), *job.finalize_args],
                               job.finalize_gpu, log)
            job.returncode = code
            if job.id in self._cancel_requested:
                job.state, job.error = "cancelled", "Cancelled by user during finalize."
            elif code != 0:
                job.state, job.error = "failed", f"finalize.sh exited with code {code}"
            elif not (run_dir / "manifest.json").is_file():
                job.state, job.error = "failed", "finalize.sh exited 0 but did not write manifest.json"
            else:
                job.state = "succeeded"

    def progress(self, job: Job) -> dict[str, Any]:
        payload = read_json(Path(job.run_dir) / "progress.json")
        progress = payload if isinstance(payload, dict) else {}
        percent = progress.get("percent")
        percent = float(percent) if _numeric(percent) else None
        if job.state == "succeeded":
            overall = 100.0
        elif job.phase in ("method",):
            overall = 0.9 * (percent or 0.0)
        elif job.phase in ("waiting_gpu_lock_finalize", "finalize"):
            overall = 90.0 + (0.1 * percent if percent is not None and str(progress.get("stage") or "").lower().startswith("final") else 0.0)
        else:
            overall = 0.0
        elapsed = time.monotonic() - job.started_monotonic if job.started_monotonic else None
        return {"overall_percent": round(min(100.0, overall), 1), "method_percent": percent,
                "stage": progress.get("stage"), "message": progress.get("message"), "elapsed_seconds": elapsed}

    def snapshot(self) -> dict[str, Any]:
        with self._lock:
            current = self.current
            queue = [job.public() for job in self.queue]
            recent = sorted((job for job in self.jobs.values() if job.state in TERMINAL_STATES),
                            key=lambda j: j.ended_at or "", reverse=True)[:25]
            recent_public = [job.public() for job in recent]
            current_public = current.public() if current else None
        if current_public is not None and current is not None:
            current_public["progress"] = self.progress(current)
        return {"current": current_public, "queue": queue, "recent": recent_public}

    def latest_job_for(self, method_id: str) -> Optional[dict[str, Any]]:
        with self._lock:
            jobs = [job for job in self.jobs.values() if job.method_id == method_id]
        if not jobs:
            return None
        job = max(jobs, key=lambda j: j.created_at)
        return {"id": job.id, "state": job.state, "phase": job.phase, "run_id": job.run_id,
                "created_at": job.created_at, "ended_at": job.ended_at, "error": job.error}


# --------------------------------------------------------------------------------------
# HTTP
# --------------------------------------------------------------------------------------


class App:
    def __init__(self, cfg: Config) -> None:
        self.cfg = cfg
        self.catalog = load_catalog()
        self.index = ResultIndex(cfg)
        self.gpu = GpuMonitor(cfg)
        self.jobs = JobManager(cfg, self.catalog)
        self.node = socket.gethostname().split(".")[0]
        self.started_at = now_iso()

    def methods(self) -> list[dict[str, Any]]:
        runs = list(self.index.runs().values())
        result = []
        for method_id in method_ids(self.cfg, self.catalog):
            spec = method_spec(self.cfg, self.catalog, method_id)
            mine = sorted((r for r in runs if r.method_id == method_id),
                          key=lambda r: (str(r.manifest.get("created_at") or ""), r.mtime), reverse=True)
            spec["result_count"] = len(mine)
            spec["latest_result"] = run_summary(mine[0]) if mine else None
            latest_file = self.cfg.outputs_root / method_id / "latest"
            try:
                spec["latest_pointer"] = latest_file.read_text().strip() if latest_file.is_file() else None
            except OSError:
                spec["latest_pointer"] = None
            spec["latest_job"] = self.jobs.latest_job_for(method_id)
            if mine and isinstance(mine[0].manifest.get("method_info"), dict):
                info = mine[0].manifest["method_info"]
                for key in ("paper", "official_code"):
                    if isinstance(info.get(key), str) and info[key]:
                        spec.setdefault(f"run_{key}", info[key])
            result.append(spec)
        return result

    def input_info(self) -> dict[str, Any]:
        manifest = read_json(self.cfg.input_ply.with_name(self.cfg.input_ply.stem + ".manifest.json")) or {}
        cloud = manifest.get("selected_point_cloud") or manifest.get("point_cloud") or {}
        size = self.cfg.input_ply.stat().st_size if self.cfg.input_ply.is_file() else None
        return {
            "name": self.cfg.input_ply.name,
            "available": self.cfg.input_ply.is_file(),
            "bytes": size,
            "point_count": cloud.get("point_count"),
            "bounds_min": cloud.get("bounds_min"),
            "bounds_max": cloud.get("bounds_max"),
            "source_run": manifest.get("run_id"),
            "url": "/input/cloud.ply",
            "dataset": os.environ.get("CV802_SP2_DATASET_LABEL", "VGGSfM point cloud (light shirt, mask-cleaned, 138,677 points)"),
            "frame": (json.loads(Path(os.environ["CV802_SP2_FRAME_JSON"]).read_text()) if os.environ.get("CV802_SP2_FRAME_JSON")
                      else self.catalog.get("input_frame", {"up": "-y", "front": "-z"})),
        }

    def config_payload(self) -> dict[str, Any]:
        return {
            "read_only": self.cfg.read_only,
            "node": self.node,
            "started_at": self.started_at,
            "outputs_root": str(self.cfg.outputs_root),
            "methods_root": str(self.cfg.methods_root),
            "results_root": str(self.cfg.results_root),
            "finalize_script": str(self.cfg.finalize_script),
            "finalize_available": self.cfg.finalize_script.is_file(),
            "gpu_lock": self.cfg.gpu_lock,
            "input": self.input_info(),
            "three_version": "0.160.1",
        }


def gzip_cached(cfg: Config, path: Path) -> Optional[Path]:
    """Return a cached .gz copy of a large text file (compressed once, streamed, low RAM)."""
    try:
        stat = path.stat()
    except OSError:
        return None
    digest = hashlib.sha1(f"{path.resolve()}|{stat.st_size}|{stat.st_mtime_ns}".encode()).hexdigest()
    target = cfg.cache_dir / "gz" / f"{digest}.gz"
    if target.is_file():
        return target
    try:
        target.parent.mkdir(parents=True, exist_ok=True)
        tmp = target.with_name(f".{digest}.{os.getpid()}.{threading.get_ident()}.tmp")
        with path.open("rb") as source, gzip.open(tmp, "wb", compresslevel=5) as sink:
            shutil.copyfileobj(source, sink, length=1024 * 1024)
        os.replace(tmp, target)
        return target
    except OSError:
        return None


def build_handler(app: App) -> type[BaseHTTPRequestHandler]:
    cfg = app.cfg
    cookie_name = f"cv802_sp2_ui_{cfg.port}"

    class Handler(BaseHTTPRequestHandler):
        server_version = "CV802-SP2-UI/1.0"
        protocol_version = "HTTP/1.1"

        def log_message(self, format: str, *args: Any) -> None:  # noqa: A002 - stdlib signature
            if os.environ.get("CV802_UI_ACCESS_LOG") == "1":
                sys.stderr.write("%s - %s\n" % (self.address_string(), format % args))

        # ---------- auth ----------
        def _authorised(self) -> bool:
            if not cfg.token:
                return True
            parsed = urlparse(self.path)
            query = parse_qs(parsed.query)
            if query.get("token", [""])[0] == cfg.token and self.command == "GET":
                rest = {k: v for k, v in query.items() if k != "token"}
                location = parsed.path + (("?" + urlencode(rest, doseq=True)) if rest else "")
                self.send_response(HTTPStatus.FOUND)
                self.send_header("Set-Cookie", f"{cookie_name}={cfg.token}; HttpOnly; SameSite=Strict; Path=/")
                self.send_header("Location", location or "/")
                self.send_header("Content-Length", "0")
                self.end_headers()
                return False
            header = self.headers.get("X-CV802-Token") or ""
            auth = self.headers.get("Authorization") or ""
            if header == cfg.token or auth == f"Bearer {cfg.token}":
                return True
            cookie = SimpleCookie(self.headers.get("Cookie", ""))
            if cookie_name in cookie and secrets.compare_digest(cookie[cookie_name].value, cfg.token):
                return True
            self.send_text(HTTPStatus.FORBIDDEN, "Forbidden: open the tokenised URL printed by surface/scripts/run_ui.sh\n")
            return False

        # ---------- responses ----------
        def send_text(self, status: int, text: str, content_type: str = "text/plain; charset=utf-8") -> None:
            body = text.encode()
            self.send_response(status)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(body)

        def send_json(self, payload: Any, status: int = 200) -> None:
            body = json.dumps(payload, default=str).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(body)

        def send_file(self, path: Path, download_name: Optional[str] = None, cache: str = "no-cache") -> None:
            try:
                size = path.stat().st_size
            except OSError:
                self.send_json({"error": "not found"}, 404)
                return
            content_type = MIME.get(path.suffix.lower(), "application/octet-stream")
            served, encoding = path, None
            if (path.suffix.lower() in GZIP_EXTENSIONS and size >= GZIP_MIN_BYTES
                    and "gzip" in (self.headers.get("Accept-Encoding") or "")):
                gz = gzip_cached(cfg, path)
                if gz is not None:
                    served, encoding = gz, "gzip"
            served_size = served.stat().st_size
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(served_size))
            self.send_header("X-Uncompressed-Length", str(size))
            self.send_header("Cache-Control", cache)
            if encoding:
                self.send_header("Content-Encoding", encoding)
                self.send_header("Vary", "Accept-Encoding")
            if download_name:
                self.send_header("Content-Disposition", f'attachment; filename="{download_name}"')
            self.end_headers()
            if self.command == "HEAD":
                return
            try:
                with served.open("rb") as stream:
                    shutil.copyfileobj(stream, self.wfile, length=1024 * 1024)
            except (BrokenPipeError, ConnectionResetError):
                pass

        def not_found(self, message: str = "not found") -> None:
            self.send_json({"error": message}, 404)

        def read_body(self) -> dict[str, Any]:
            length = int(self.headers.get("Content-Length") or 0)
            if length < 0 or length > 65536:
                raise ValueError("request body too large")
            raw = self.rfile.read(length) if length else b"{}"
            payload = json.loads(raw or b"{}")
            if not isinstance(payload, dict):
                raise ValueError("JSON object expected")
            return payload

        # ---------- routing ----------
        def do_HEAD(self) -> None:
            self.do_GET()

        def do_GET(self) -> None:
            if not self._authorised():
                return
            parsed = urlparse(self.path)
            path = unquote(parsed.path)
            query = parse_qs(parsed.query)
            try:
                self._route_get(path, query)
            except (BrokenPipeError, ConnectionResetError):
                pass

        def _route_get(self, path: str, query: dict[str, list[str]]) -> None:
            pages = {"/": "index.html", "/index.html": "index.html", "/viewer": "viewer.html",
                     "/viewer.html": "viewer.html", "/compare": "compare.html", "/compare.html": "compare.html"}
            if path in pages:
                self.send_file(WEB_ROOT / pages[path])
            elif path.startswith("/static/"):
                target = (WEB_ROOT / path[len("/static/"):]).resolve()
                if within(target, WEB_ROOT.resolve()) and target.is_file():
                    cache = "public, max-age=86400" if "/vendor/" in path else "no-cache"
                    self.send_file(target, cache=cache)
                else:
                    self.not_found()
            elif path == "/favicon.ico":
                self.send_text(204, "")
            elif path == "/api/config":
                self.send_json(app.config_payload())
            elif path == "/api/methods":
                self.send_json({"methods": app.methods(), "read_only": cfg.read_only})
            elif path == "/api/runs":
                runs = sorted(app.index.runs().values(),
                              key=lambda r: (str(r.manifest.get("created_at") or ""), r.mtime), reverse=True)
                self.send_json({"runs": [run_summary(r) for r in runs]})
            elif path.startswith("/api/run/"):
                record = app.index.get(path[len("/api/run/"):])
                self.send_json(run_summary(record, detailed=True)) if record else self.not_found("unknown run")
            elif path == "/api/status":
                payload = app.jobs.snapshot()
                payload.update(app.gpu.snapshot())
                payload["read_only"] = cfg.read_only
                payload["node"] = app.node
                self.send_json(payload)
            elif path.startswith("/api/jobs/") and path.endswith("/log"):
                job_id = path[len("/api/jobs/"):-len("/log")]
                job = app.jobs.jobs.get(job_id)
                if not job:
                    self.not_found("unknown job")
                    return
                limit = min(int((query.get("bytes") or ["65536"])[0] or 65536), 1024 * 1024)
                which = (query.get("file") or ["ui_job.log"])[0]
                name = "log.txt" if which == "log.txt" else "ui_job.log"
                self.send_text(200, tail_bytes(Path(job.run_dir) / name, limit))
            elif path == "/input/cloud.ply":
                self.send_file(cfg.input_ply, cache="public, max-age=3600") if cfg.input_ply.is_file() else self.not_found()
            elif path.startswith("/files/"):
                self._serve_run_file(path, query)
            elif path.startswith("/download/") and path.endswith(".zip"):
                self._serve_zip(path)
            else:
                self.not_found()

        def _resolve_run(self, parts: list[str]) -> Optional[RunRecord]:
            if len(parts) < 3 or parts[0] not in ("outputs", "bundled"):
                return None
            return app.index.get("/".join(parts[:3]))

        def _serve_run_file(self, path: str, query: dict[str, list[str]]) -> None:
            parts = path[len("/files/"):].split("/")
            record = self._resolve_run(parts)
            relative = "/".join(parts[3:])
            if record is None or not relative or any(p in ("", ".", "..") for p in parts[3:]):
                self.not_found()
                return
            base = record.directory.resolve()
            target = (record.directory / relative).resolve()
            if not within(target, base) or not target.is_file():
                self.not_found()
                return
            download = None
            if (query.get("download") or ["0"])[0] == "1":
                download = f"{record.method_id}-{record.run_id}-{target.name}"
            self.send_file(target, download)

        def _serve_zip(self, path: str) -> None:
            parts = path[len("/download/"):-len(".zip")].split("/")
            record = self._resolve_run(parts)
            if record is None:
                self.not_found()
                return
            names = ["mesh.obj", "mesh.mtl", *texture_names(record), "metrics.json", "manifest.json", "method_info.json"]
            folder = f"{record.method_id}-{record.run_id}"
            with tempfile.SpooledTemporaryFile(max_size=32 * 1024 * 1024, dir=str(cfg.cache_dir)) as spool:
                with zipfile.ZipFile(spool, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
                    for name in dict.fromkeys(names):
                        source = record.file(name)
                        if source and within(source.resolve(), record.directory.resolve()):
                            archive.write(source, f"{folder}/{name}")
                size = spool.tell()
                spool.seek(0)
                self.send_response(200)
                self.send_header("Content-Type", "application/zip")
                self.send_header("Content-Length", str(size))
                self.send_header("Content-Disposition", f'attachment; filename="{folder}.zip"')
                self.send_header("Cache-Control", "no-store")
                self.end_headers()
                shutil.copyfileobj(spool, self.wfile, length=1024 * 1024)

        def do_POST(self) -> None:
            if not self._authorised():
                return
            path = urlparse(self.path).path
            if cfg.read_only:
                self.send_json({"error": "this server is read-only"}, 403)
                return
            try:
                payload = self.read_body()
            except (ValueError, json.JSONDecodeError) as error:
                self.send_json({"error": str(error)}, 400)
                return
            if path == "/api/run":
                method_id = str(payload.get("method", ""))
                if method_id not in method_ids(cfg, app.catalog):
                    self.send_json({"error": f"unknown method {method_id!r}"}, 400)
                    return
                spec = method_spec(cfg, app.catalog, method_id)
                if not spec["runnable"]:
                    self.send_json({"error": f"{method_id} cannot run: {spec.get('not_runnable_reason')}"}, 409)
                    return
                try:
                    run_args = self._args(payload.get("run_args"), spec["default_run_args"])
                    finalize_args = self._args(payload.get("finalize_args"), spec["finalize_args"])
                except ValueError as error:
                    self.send_json({"error": str(error)}, 400)
                    return
                try:
                    job = app.jobs.enqueue(spec, run_args, finalize_args)
                except OSError as error:
                    self.send_json({"error": f"could not create run directory: {error}"}, 500)
                    return
                self.send_json({"queued": True, "job": job.public()}, 202)
            elif path == "/api/cancel":
                ok, message = app.jobs.cancel(str(payload.get("job_id", "")))
                self.send_json({"ok": ok, "message": message}, 200 if ok else 409)
            else:
                self.not_found()

        @staticmethod
        def _args(value: Any, default: list[str]) -> list[str]:
            if value is None:
                return list(default)
            if isinstance(value, str):
                return shlex.split(value)
            if isinstance(value, list) and all(isinstance(v, (str, int, float)) for v in value):
                return [str(v) for v in value]
            raise ValueError("arguments must be a string or a list of strings")

    return Handler


class Server(ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True


def parse_args(argv: Optional[list[str]] = None) -> argparse.Namespace:
    code_root = SURFACE_ROOT.parent
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=0, help="0 picks a free port")
    parser.add_argument("--token", default=None, help="access token (generated when omitted)")
    parser.add_argument("--no-auth", action="store_true", help="disable the token (only allowed with --host 127.0.0.1)")
    parser.add_argument("--data-root", type=Path, default=DEFAULT_DATA_ROOT)
    parser.add_argument("--outputs-root", type=Path, default=None, help="default: <data-root>/outputs")
    parser.add_argument("--results-root", type=Path, default=SURFACE_ROOT / "results", help="bundled read-only results")
    parser.add_argument("--methods-root", type=Path, default=SURFACE_ROOT / "methods")
    parser.add_argument("--finalize-script", type=Path, default=SURFACE_ROOT / "scripts" / "finalize.sh")
    parser.add_argument("--input-ply", type=Path, default=SURFACE_ROOT / "inputs" / "light_shirt_vggsfm_clean.ply")
    parser.add_argument("--cache-dir", type=Path, default=None, help="default: <data-root>/runtime/ui_cache")
    parser.add_argument("--gpu-lock", default=GPU_LOCK_DEFAULT)
    parser.add_argument("--read-only", action="store_true", help="viewer only: no runs, no queue")
    parser.add_argument("--url-file", type=Path, default=None, help="write the tokenised URL path here once listening")
    args = parser.parse_args(argv)
    args.code_root = code_root
    return args


def make_config(args: argparse.Namespace) -> Config:
    data_root = args.data_root.resolve() if args.data_root else DEFAULT_DATA_ROOT
    cache_dir = args.cache_dir or (data_root / "runtime" / "ui_cache")
    if args.no_auth and args.host not in ("127.0.0.1", "localhost", "::1"):
        raise SystemExit("--no-auth is only allowed together with --host 127.0.0.1")
    token = None if args.no_auth else (args.token or secrets.token_urlsafe(24))
    try:
        cache_dir.mkdir(parents=True, exist_ok=True)
    except OSError:
        cache_dir = Path(tempfile.mkdtemp(prefix="cv802_sp2_ui_cache_"))
    return Config(
        code_root=args.code_root, data_root=data_root,
        outputs_root=(args.outputs_root or data_root / "outputs").resolve(),
        results_root=args.results_root.resolve(), methods_root=args.methods_root.resolve(),
        finalize_script=args.finalize_script.resolve(), input_ply=args.input_ply.resolve(),
        cache_dir=cache_dir.resolve(), gpu_lock=args.gpu_lock, read_only=args.read_only,
        token=token, port=args.port, host=args.host,
    )


def serve(cfg: Config, url_file: Optional[Path] = None, ready: Optional[threading.Event] = None) -> tuple[Server, App]:
    server = Server((cfg.host, cfg.port), None)  # type: ignore[arg-type]
    cfg.port = server.server_address[1]
    app = App(cfg)
    server.RequestHandlerClass = build_handler(app)
    app.gpu.start()
    if not cfg.read_only:
        app.jobs.start()
    return server, app


def main(argv: Optional[list[str]] = None) -> int:
    args = parse_args(argv)
    cfg = make_config(args)
    server, app = serve(cfg)
    suffix = f"/?token={cfg.token}" if cfg.token else "/"
    print(f"CV802 SP2 UI listening on {app.node}:{cfg.port} ({'read-only' if cfg.read_only else 'run + view'})", flush=True)
    print(f"URL path: {suffix}", flush=True)
    if args.url_file:
        write_json_atomic(args.url_file, {"node": app.node, "port": cfg.port, "path": suffix, "pid": os.getpid()})

    def stop(signum: int, _frame: Any) -> None:
        raise KeyboardInterrupt

    signal.signal(signal.SIGTERM, stop)
    try:
        server.serve_forever(poll_interval=0.5)
    except KeyboardInterrupt:
        print("Stopping UI; cancelling any active run.", flush=True)
    finally:
        app.jobs.shutdown()
        app.gpu.stop()
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
