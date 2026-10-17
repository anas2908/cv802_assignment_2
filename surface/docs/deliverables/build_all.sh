#!/usr/bin/env bash
# Rebuild the deliverables from the finished runs: results.json -> (figures) -> one-page report PDF -> slides PPTX/PDF.
# Runs ON the node:  surface/scripts/node_run.sh 'bash surface/docs/deliverables/build_all.sh [--figures]'
set -Eeuo pipefail
HERE="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "${HERE}/../../scripts/env.sh"
DOCS_PY="${DATA}/envs/docs/bin/python"     # python-pptx, python-docx, matplotlib
cd "${CODE}"
python3 "${HERE}/collect_results.py"
if [[ "${1:-}" == "--figures" ]]; then
  CUDA_VISIBLE_DEVICES="" "${BASE_PY}" -m surface.docs.deliverables.make_figures
fi
( cd "${HERE}/report" && python3 build_table.py \
  && pdflatex -interaction=nonstopmode main.tex >| build.log 2>&1 && pdflatex -interaction=nonstopmode main.tex >| build.log 2>&1 \
  && cp main.pdf ../CV802_SP2_one_page_report.pdf && echo "report: $(pdfinfo main.pdf | grep Pages)" )
( cd "${HERE}/slides" && "${DOCS_PY}" build_slides.py \
  && soffice -env:UserInstallation=file:///tmp/cv802_lo_profile --headless --convert-to pdf CV802_SP2_surface_extraction.pptx >/dev/null 2>&1 \
  && echo "slides: $(pdfinfo CV802_SP2_surface_extraction.pdf | grep Pages)" )
