# Framefast

A small, browser-based framing estimator for a single straight wall. Enter the wall dimensions, stud spacing and plate stock length, then optionally add doors and windows to get a material summary and cut list.

## Run locally

No dependencies or build step are needed. From the repository directory, run `python3 -m http.server 8000` and open `http://localhost:8000`. Run the calculator tests with `npm test` (Node.js required).

## Measurement and estimating assumptions

- Measurements use feet and inches. Wall height is the overall height, including one 1½-inch bottom plate and two 1½-inch top plates. Studs are assumed to be 1½ inches thick.
- Opening widths and heights are **rough opening** dimensions. The left edge is the distance from the wall's left end to the rough opening. Window sill height is from the top of the bottom plate to the top of the rough sill; door openings start at the top of the bottom plate. Header depth is its actual installed depth.
- Each opening has two full-height king studs, two jacks, two header plies and, for windows, one rough sill. Jacks support the header; header plies extend across the opening and both jacks. Cripples follow the common stud layout where they fit inside the rough opening. Common studs intersecting opening framing are removed. A minimum 4½ inches is required between a rough opening and a wall end, and 6 inches between rough openings.
- Plate cuts use the chosen stock length. The bottom plate is cut out across each door rough opening; each listed plate cut is counted as a separate stock board, without reusing offcuts. Plate joint locations, stagger and support are not designed. Stud and header stock quantities are not optimized.
- Nail counts are a rough allowance: four per common, king or cripple stud; six per jack; four per header ply and four per rough sill. Plate splices, connections to other walls, sheathing, blocking, special fasteners and waste are excluded.

**This is a planning estimate, not structural design.** Header size, load paths, additional supports, fastening, splice placement and applicable building codes depend on the project and are not calculated. Confirm them with a qualified professional or local authority and verify measurements on site. Add an appropriate waste allowance.
