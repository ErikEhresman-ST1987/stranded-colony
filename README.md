# Stranded Colony

Stranded Colony is a local-first, turn-based colony survival and development game for iPhone, iPad, and desktop browsers.

## Current checkpoint

Increment 1 — Application Shell and Persistence Foundation — implemented. Activation and verification on the deployed GitHub Pages build are still required before Increment 2 begins.

## Foundation

- Native HTML, CSS, and JavaScript.
- Central authoritative `gameState`.
- IndexedDB is the authoritative local save technology.
- `SaveManager` is the sole persistence owner.
- Save format begins at `saveVersion: 1`.
- One active colony save is stored initially.
- Static application shell is cached by a small versioned service worker.
- Game saves are never stored in the service-worker cache.
- No real-time/offline colony progression.
- No framework, backend, cloud account, analytics, or external runtime dependency.

## Data boundaries

The save keeps generated scenario facts separate from mutable playthrough state. Stable game content definitions will live in application code/data as they are introduced rather than being copied into every save.

Current v1 save shape:

```text
saveVersion
meta
scenario
  worldSeed
  established
playthrough
  turn
  colony
  resources
  survivors
  assignments
  projects
  research
  flags
```

These are ownership seams, not promises that every listed gameplay system is implemented.

## Persistence constants

- IndexedDB database: `stranded-colony`
- Database version: `1`
- Object store: `saves`
- Active save key: `active-colony`
- Save format version: `1`

## Increment 1 verification gate

1. Open the deployed GitHub Pages app on a phone/tablet-sized screen and desktop.
2. Confirm there is no horizontal overflow and the board surface remains dominant.
3. Create a new colony; confirm Turn 0 and “Foundation ready” appear.
4. Fully close/reload the page. Confirm “Local save found” appears, then choose **Load Saved Colony** and confirm the same saved colony loads.
5. Try **Start New Colony** and cancel the replacement warning; confirm the existing colony remains.
6. Reopen online once so the service worker has cached the shell. Then enable Airplane Mode and reopen the installed/site app; confirm the shell loads.
7. Return online and confirm normal loading still works and no save error appears.

Do not begin Increment 2 until Increment 1 is activated and these checks are confirmed.
