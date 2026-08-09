# Task 5 report: biology visuals and remote inventory

## Delivered

- Added deterministic Pillow generator: `scripts/generate-biology-assets.py`.
- Added six original 1280x900 unit covers and six original 1200x760 structure diagrams under `assets/figures/generated/subjects/biology/`.
- Added prompt/source records in `assets/figures/generated/subjects/biology/prompts.json`.
- Updated biology data references to the `subjects/biology` asset namespace and registered diagrams in the unit data.
- Added `scripts/check-biology-assets.js` for source dimensions, hashes, prompt records, inventory membership, and remote output checks.
- Extended the shared asset inventory, remote preparation, remote validation, and unique-figure checks for biology.
- Kept existing cloud-only legacy image references compatible with the unique-figure checker; those images are reported as skipped when their source files are not present locally.

## Verification

- `python3 scripts/generate-biology-assets.py`: 6 covers and 6 diagrams generated.
- `node scripts/check-biology-content.js`: passed, 6 units / 36 knowledge items / 6 templates / 108 examples.
- `node scripts/check-biology-assets.js`: passed.
- `node scripts/prepare-remote-assets.js`: passed, 231 remote assets prepared.
- `node scripts/check-remote-assets.js`: passed, dimensions, limits, paths, and hashes checked.
- `node scripts/check-unique-figures.js`: passed, 229 local figures checked; 534 existing cloud-only legacy images skipped.
- `git diff --check`: passed.

## Source boundary

All new biology visuals are deterministic original vector-style compositions. The prompt records document the generator, original-work status, output paths, and manual review status. Page text remains the authoritative fallback when images fail to load.
