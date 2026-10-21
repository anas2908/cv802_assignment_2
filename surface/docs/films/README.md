# Teaching films

Eighteen short films (56 minutes in all) that explain every part of Sub-project 2, in roadmap order: the
methods, the metrics, texturing, the viewer and 3D printing, and the code pipeline. Each one is drawn as an animated
chalkboard (1920×1080, 60 fps) with its own music score, and uses our real runs and numbers.

| Folder | Film | Length | Scenes |
|---|---|---|---|
| [`01_poisson/`](01_poisson/) | Screened Poisson reconstruction | 3:09 | 12 |
| [`02_metrics/`](02_metrics/) | The metrics | 3:48 | 14 |
| [`03_ier/part1/`](03_ier/part1/) | IER meshing, part 1: choosing triangles | 2:23 | 8 |
| [`03_ier/part2/`](03_ier/part2/) | IER meshing, part 2: the network and the mesh | 2:28 | 7 |
| [`04_meshanything/part1/`](04_meshanything/part1/) | MeshAnything, part 1: how it writes a mesh | 3:22 | 10 |
| [`04_meshanything/part2/`](04_meshanything/part2/) | MeshAnything, part 2: training, our scan, our runs | 3:02 | 8 |
| [`05_point2mesh/part1/`](05_point2mesh/part1/) | Point2Mesh, part 1: the idea | 3:08 | 9 |
| [`05_point2mesh/part2/`](05_point2mesh/part2/) | Point2Mesh, part 2: our scan and our runs | 2:26 | 7 |
| [`06_dhsp/part1/`](06_dhsp/part1/) | Deep Hybrid Self-Prior, part 1: the method | 2:52 | 8 |
| [`06_dhsp/part2/`](06_dhsp/part2/) | Deep Hybrid Self-Prior, part 2: our scan and our runs | 2:54 | 8 |
| [`07_nksr/`](07_nksr/) | NKSR | 4:06 | 12 |
| [`08_sap/`](08_sap/) | Shape As Points | 3:12 | 9 |
| [`09_2dgs/`](09_2dgs/) | 2D Gaussian Splatting | 3:34 | 10 |
| [`10_texturing/`](10_texturing/) | Photo texturing | 2:54 | 9 |
| [`11_viewer_printing/part1/`](11_viewer_printing/part1/) | The viewer and 3D printing, part 1: the mesh viewer | 3:00 | 9 |
| [`11_viewer_printing/part2/`](11_viewer_printing/part2/) | The viewer and 3D printing, part 2: 3D printing | 3:38 | 11 |
| [`12_pipeline/part1/`](12_pipeline/part1/) | The code pipeline, part 1: one run, start to finish | 2:54 | 9 |
| [`12_pipeline/part2/`](12_pipeline/part2/) | The code pipeline, part 2: running everything | 3:20 | 10 |

## Watch them

- **Storyboards:** `bash run_viewer.sh` → *Videos* tab shows one still per scene of every film that has its stills
  rendered (videos 1–7 for now). The same stills close the slide deck.
- **MP4:** the films are source, not video files. Load a film folder into a Motion film player and press *Export*: it
  renders the MP4, music included, in the browser.

## What is in a film folder

The player's own layout, one folder per film (or per part):

```text
film.json          title
cut.js             window.CUT = kit.scenes();  (the film is the list of scenes below)
modules/
  scenes.json      scene order, names and durations; size, fps, palette and fonts
  base.css         the shared look (colours, type)
  shared.js        drawing helpers shared by the scenes
  scene-<id>.js    one scene each: init(kit) builds it once, render(t) draws it at time t (a pure function of t)
  score.js         the music and sound cues as data, timed to the scenes
  *.json           data a scene draws (for example dots, meshes, training snapshots)
  retyped.json     lines of on-screen text that were reworded by hand after the film was made
assets/            the images a scene shows (renders and figures from our runs)
```

Fonts are Google Fonts named in `scenes.json` (Crimson Pro, Source Sans 3, JetBrains Mono); the player fetches them.
