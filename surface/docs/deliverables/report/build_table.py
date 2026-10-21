"""Write report/table.tex (Table 1 of the one-page report) from results.json; pending cells are marked."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import resmodel as rm  # noqa: E402

PEND = r"\pend"


def cell(r, key, nd, bold):
    if r == rm.PENDING:
        return PEND
    if r is None:
        return "--"
    s = rm.fmt(r, key, nd)
    return r"\textbf{" + s + "}" if bold else s


# column spec: (dataset, metric key, digits, higher is better)
COLS = [("vggsfm", "cd", 3, False), ("vggsfm", "f1", 3, True), ("vggsfm", "f05", 3, True), ("vggsfm", "nc", 2, True),
        ("mvs", "cd", 3, False), ("mvs", "f1", 3, True),
        ("mvs_clean", "cd", 3, False), ("mvs_clean", "f1", 3, True)]
best = {}
for ds, k, nd, hi in COLS:
    vals = [round(r[k], nd) for m in rm.ORDER if (r := rm.best(ds, m)) not in (None, rm.PENDING)]
    best[(ds, k)] = max(vals) if hi else min(vals)

lines = []
for m in rm.ORDER:
    rv = rm.best("vggsfm", m)
    name = rm.SHORT[m] + (r"$^\ast$" if m in rm.EXTRA else "")
    row = [name, rm.fmt(rv, "faces")]
    for ds, k, nd, hi in COLS:
        r = rm.best(ds, m)
        b = r not in (None, rm.PENDING) and round(r[k], nd) == best[(ds, k)]
        row.append(cell(r, k, nd, b))
    row.append(r"\checkmark" if rv not in (None, rm.PENDING) and rv["watertight"] else "")
    lines.append(" & ".join(row) + r" \\")
    if m == "dhsp":
        lines.append(r"\midrule")

tex = r"""
{\footnotesize\setlength{\tabcolsep}{4.6pt}
\begin{tabular}{@{}lr cccc cc cc c@{}}
\toprule
 & & \multicolumn{4}{c}{VGGSfM (main input, 139k pts)} & \multicolumn{2}{c}{MVS (487k pts)} & \multicolumn{2}{c}{MVS-clean} & \\
\cmidrule(lr){3-6}\cmidrule(lr){7-8}\cmidrule(lr){9-10}
Method & Faces & CD\,\%$\downarrow$ & F@1\%$\uparrow$ & F@0.5\%$\uparrow$ & NC$\uparrow$ & CD\,\%$\downarrow$ & F@1\%$\uparrow$ & CD\,\%$\downarrow$ & F@1\%$\uparrow$ & WT \\
\midrule
""" + "\n".join(lines) + r"""
\bottomrule
\end{tabular}\\[2pt]
\captionof{table}{Best run per method vs.\ its own input dots. CD: mean mesh--dot gap (Chamfer), \% of the scan's
diagonal, lower is better; F@$\tau$: share within $\tau$ of each other, higher is better; NC: agreement of surface
directions; WT: closed, printable. $^\ast$\,Beyond the course list""" + (
    r"; \pend\ = still training." if rm.pending_list() else ".") + r"""}
\label{tab:results}}
"""
Path(__file__).with_name("table.tex").write_text(tex)
print("table.tex written; pending:", rm.pending_list() or "none")
