# Stranded Colony

Stranded Colony is a local-first, turn-based colony survival and development game for iPhone, iPad, and desktop browsers.

## Current checkpoint

- Increment 1 — Application Shell and Persistence Foundation — **verified**
- Increment 2 — First Colony State and Visible Board — **verified**
- Increment 3 — Assignments and Resources — **verified**
- Increment 4 — Authoritative Turn Resolution — **verified**
- Increment 5 — First Improvement / Project — **verified**
- Increment 6 — First Capability / Research Change — **verified**
- Increment 7 — First State-Responsive Risk / Event — **verified**
- Increment 8 — Playable-Slice Integration and Hardening — implemented; final slice verification required

## Increment 8 hardening

No new gameplay system is added. This increment hardens the complete first playable slice.

- Turn resolution now follows explicit Consume → Produce → Resolve Risk/Consequence → Finalize phases.
- Turn-result deltas are calculated from actual before/after resources. If Food or Water is scarce and consumption bottoms out at zero, the displayed delta now matches the real state change.
- Build and research controls re-evaluate their resource requirements after busy/save operations instead of being blindly re-enabled.
- The Water Collector now appears on the colony board after construction, so the first permanent improvement visibly changes the crash site.
- Assignment instructions now accurately state that resources change when the turn is committed.
- Offline shell cache advances to v8.
- Save format remains v2; no migration is required.

## Final playable-slice verification gate

This is the mandatory first major gameplay checkpoint. Stop features and test the complete slice.

1. **Load and readability:** Open the deployed game on the primary mobile device. Load the existing colony. Confirm vitals, board, assignment controls, project/research state, and event history are readable without overflow or precision tapping.
2. **Visible improvement:** Confirm a previously built Water Collector is visible on the board and its project panel still reports Built.
3. **Deterministic turn:** Note Food, Water, and Salvage. Commit a turn with known assignments and verify the resulting values match the existing rules: 1 Food and 1 Water consumed per survivor; +3 Food per forage worker; +3 Water per water worker; +2 Water from the built collector; Salvage +5 per salvage worker when Efficient Salvage is researched.
4. **Actual-delta reporting:** Confirm the turn-result Food/Water/Salvage deltas exactly equal the visible before/after resource changes.
5. **Persistence:** Change at least one assignment, commit a turn, fully close the app, reopen it, and load the colony. Confirm assignments, resources, turn number, Water Collector, Efficient Salvage, and Shelter Wear history all persist.
6. **Offline:** After one online reload, enter Airplane Mode, reopen/load, change an assignment, commit a turn, fully close/reopen again, and confirm the new state persisted locally.
7. **Control-state regression:** If Salvage is below an uncompleted action's cost in a fresh colony, its Build/Research button must remain disabled after loading or committing a turn; it should become available only when enough Salvage exists.
8. **New-colony recovery check:** Only if you are comfortable replacing the current test colony, create a new colony and verify Turn 0 / 5 survivors / Food 18 / Water 20 / Salvage 12 appear correctly and the board starts without a Water Collector. If you want to preserve the current colony, skip this destructive check.
9. **Playable-slice judgment:** Play several consecutive turns. Note any confusing decision, awkward mobile interaction, unreadable visual state, or behavior that feels inconsistent even if technically correct.

Do not begin new feature development after this gate. Once Increment 8 is verified, evaluate what the first playable slice demonstrates before planning the next phase.
