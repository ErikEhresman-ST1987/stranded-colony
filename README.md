# Stranded Colony

Stranded Colony is a local-first, turn-based colony survival and development game for iPhone, iPad, and desktop browsers.

## Current checkpoint

### Phase 2 Increment 3 delivery correction
- Corrected a stale PWA asset edge case observed on iPad where the v5 HTML loaded while an older cached app.js still supplied the assignment menus.
- Versioned the Phase 2 Increment 3 CSS/JavaScript asset URLs and advanced the shell cache so **Survey Northern Ridge** is reliably delivered to installed PWAs.
- No gameplay or save-state rules changed.


- Phase 2 Increment 2 — Regional Survey & First Expertise Interpretation — **implemented; verification required**
  - The Northern Ridge is now a visible known regional observation, not a quest marker or revealed solution.
  - Nia Saye's geology/surveying expertise interprets the observation without claiming groundwater, a spring, or alien infrastructure.
  - Starting regional knowledge is persisted in scenario state.
  - Save format advances to v4 with a narrow v3 → v4 migration that preserves the existing Phase 2 colony.
  - Offline shell cache advances for the new build.

### Phase 2 Increment 2 verification

1. Reload the deployed game and load the existing Phase 2 colony. It should upgrade from save v3 to v4 without starting over.
2. Confirm turn number, resources, assignments, completed project/research state, and prior event state are unchanged after the upgrade.
3. Confirm a Northern Ridge marker appears on the colony board and a Regional Survey panel appears below the pressure cards.
4. Confirm the survey says vegetation is unusually dense on part of the upper slope, no visible drainage was identified, and the area was not closely surveyed.
5. Confirm Nia Saye's interpretation says the vegetation difference is real but its cause is not yet known. The interface must not mention a spring, groundwater, alien structures, or a water objective.
6. Fully close and reopen the app, load the colony again, and confirm the survey remains present and the footer reports save format v4.
7. Repeat the close/reopen test in Airplane Mode after one online refresh.
8. On iPhone/iPad, confirm the Northern Ridge marker does not obscure essential board information and the survey panel is readable without horizontal overflow.
9. Gameplay judgment: decide whether the ridge feels like an interesting piece of evidence you may want to investigate later, rather than an instruction telling you what to do.

Do not begin Phase 2 Increment 3 until this increment is verified and evaluated.


- Phase 2 Increment 1 — Fragile Stability & Competing Priorities — **verified, played, and evaluated**
  - Phase 2 now begins with the approved six survivors.
  - The opening colony is explicitly in fragile stability.
  - Water, Food, Shelter, and Power are presented as behaviorally different pressures.
  - Water is communicated as recurring survivor-capacity pressure rather than merely a stockpile.
  - Save format advances to v3. Phase 1 test saves are preserved but are not silently rewritten into the new six-survivor Phase 2 colony.
  - Offline shell cache advances for the Phase 2 build.

### Phase 2 Increment 1 verification

1. Open the deployed game. If a Phase 1 save exists, confirm it is identified as preserved and that the game asks you to start a new Phase 2 colony rather than silently converting it.
2. Start a new colony and confirm there are exactly six survivors: Mara Venn, Nia Saye, Elena Sato, Kei Arun, Tomas Vale, and Jonah Reed.
3. Confirm the board says the colony is in fragile stability and asks you to decide what to make reliable first.
4. Confirm four pressure cards are visible: Water, Food, Shelter, and Power. Water should describe labor commitment; Food should describe finite runway; Shelter should respond to maintenance assignment; Power should communicate a capability ceiling.
5. Change assignments and confirm the Water and Shelter pressure cards respond immediately.
6. Commit a turn and verify six Food and six Water are consumed before assigned production is added.
7. Fully close and reopen the app, load the colony, and confirm the six survivors, assignments, resources, turn number, projects/research, and pressure presentation persist correctly.
8. On iPhone/iPad, confirm the pressure cards and survivor assignment controls do not overflow and remain comfortable to tap.
9. Play several turns and judge whether Water, Food, Shelter, and Power feel like understandable competing concerns. Note any pressure that feels fake, confusing, or obviously dominant.

Do not begin Phase 2 Increment 2 until this increment is verified and played.

## Phase 1 checkpoint

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
