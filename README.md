# Stranded Colony

Stranded Colony is a local-first, turn-based colony survival and development game for iPhone, iPad, and desktop browsers.

## Current checkpoint

Increment 1 — Application Shell and Persistence Foundation — **verified**.

Increment 2 — First Colony State and Visible Board — implemented; activation and verification are required before Increment 3.

## Increment 2 scope

- A visible crash-site board now establishes the approved temperate alien frontier direction.
- The broken colony ship is the dominant board anchor.
- Emergency Shelter and Wreck Salvage are the first visible sites.
- Five individual survivors are represented on the board and in a compact roster.
- The first visible resource state is Food 18, Water 20, and Salvage 12.
- This increment is deliberately observational: assignments, resource consumption/production, and turn resolution remain inactive.
- Existing Increment 1 save-format v1 colonies are upgraded sequentially to save-format v2 when loaded. The original save is not erased before a valid v2 state is written.

The exact starting values and named survivors are the minimum concrete content needed to exercise this playable-slice checkpoint; they can be tuned later without changing the architecture.

## Foundation

- Native HTML, CSS, and JavaScript.
- Central authoritative `gameState`.
- IndexedDB is the authoritative local save technology.
- `SaveManager` is the sole persistence owner.
- Current save format: `saveVersion: 2`.
- One active colony save is stored initially.
- Static application shell is cached by a small versioned service worker.
- Game saves are never stored in the service-worker cache.
- No real-time/offline colony progression.
- No framework, backend, cloud account, analytics, or external runtime dependency.

## Increment 2 verification gate

1. Reopen the deployed app and confirm your existing v1 local save is offered as ready to upgrade.
2. Load it. Confirm the status reports that it was upgraded and loaded, with Turn 0, 5 survivors, Food 18, Water 20, and Salvage 12.
3. Confirm the board visibly shows the broken ship, Emergency Shelter, Wreck Salvage, and five small survivor figures without horizontal overflow.
4. Confirm the survivor roster shows five named survivors and roles.
5. Fully close and reopen the app. Load the colony again and confirm it now loads normally as v2 with the same state.
6. Start a new colony, accept replacement, and confirm the same complete first colony state is saved.
7. After one online reload, test Airplane Mode and confirm the updated board shell still opens.

Do not begin Increment 3 until Increment 2 is activated and these checks are confirmed.
