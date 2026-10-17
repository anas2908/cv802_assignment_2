"""Shared view of results.json for the report, slides and notes builders (stdlib only)."""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
R = json.loads((HERE / "results.json").read_text())
DS = ["vggsfm", "mvs", "mvs_clean"]
DS_LABEL = {"vggsfm": "VGGSfM", "mvs": "MVS", "mvs_clean": "MVS-clean"}
DS_LONG = {"vggsfm": "VGGSfM (mask-cleaned, 138,677 pts)", "mvs": "COLMAP MVS (487,451 pts)",
           "mvs_clean": "MVS, floaters removed (487,047 pts)"}
ORDER = ["poisson", "ier", "point2mesh", "meshanything", "dhsp", "nksr", "sap", "twodgs"]
NAME = {"poisson": "Screened Poisson (ours)", "ier": "IER", "point2mesh": "Point2Mesh", "meshanything": "MeshAnything V2",
        "dhsp": "DHSP", "nksr": "NKSR", "sap": "Shape As Points", "twodgs": "2D Gaussian Splatting"}
SHORT = {"poisson": "Poisson (ours)", "ier": "IER", "point2mesh": "Point2Mesh", "meshanything": "MeshAnything V2",
         "dhsp": "DHSP", "nksr": "NKSR", "sap": "SAP", "twodgs": "2DGS"}
VENUE = {"poisson": "SGP'06 / TOG'13", "ier": "ECCV'20", "point2mesh": "SIGGRAPH'20", "meshanything": "2024",
         "dhsp": "ICCV'21", "nksr": "CVPR'23", "sap": "NeurIPS'21", "twodgs": "SIGGRAPH'24"}
KIND = {"poisson": "implicit, classical", "ier": "learned prior", "point2mesh": "self-prior", "meshanything": "generative",
        "dhsp": "self-prior + colour", "nksr": "learned implicit", "sap": "diff. Poisson", "twodgs": "image-based"}
EXTRA = {"nksr", "sap", "twodgs"}          # beyond the course list
PENDING = "pending"


def runs(ds):
    return R["datasets"].get(ds, {})


def run(ds, run_id):
    return runs(ds).get(run_id)


def best(ds, method):
    """Best run of a method on an input, or PENDING while DHSP's full pipeline is still training."""
    rs = runs(ds)
    if method == "dhsp":
        full = R["dhsp_full"][ds]
        for rid in (full + "-phototex2", full):
            if rid in rs:
                return rs[rid]
        return PENDING
    cands = [r for r in rs.values() if r["method"] == method and r["best"]]
    return cands[0] if cands else None


def dhsp_prior(ds):
    """DHSP's 3D-prior-only result (always available) for the 'before' column."""
    rs = runs(ds)
    for rid in ("dhsp-v1", "dhsp-v1-mvs", "dhsp-v1-mvsclean"):
        if rid in rs:
            return rs[rid]
    return None


def pending_list():
    out = []
    for ds in DS:
        if best(ds, "dhsp") == PENDING:
            out.append(f"DHSP full pipeline on {DS_LABEL[ds]}")
    return out


def fmt(r, key, nd=3, pend="[pending]"):
    if r == PENDING:
        return pend
    if r is None:
        return "--"
    v = r[key]
    if isinstance(v, bool):
        return "yes" if v else "no"
    if key == "faces":
        return f"{v / 1e6:.2f}M" if v >= 1e6 else (f"{v / 1e3:.0f}k" if v >= 1e4 else f"{v / 1e3:.1f}k")
    if key == "seconds":
        return "--" if v is None else (f"{v:.0f}s" if v < 120 else f"{v / 60:.0f}min")
    return f"{v:.{nd}f}"


def val(ds, run_id, key, nd=3):
    r = run(ds, run_id)
    return fmt(r if r else None, key, nd)
