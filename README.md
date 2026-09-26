# Stranded Colony

Stranded Colony is a local-first, turn-based colony survival and development game for iPhone, iPad, and desktop browsers.

## Current checkpoint

- Phase 2 Increment 7 — Reliable Water Capability — **implemented; verification required**
  - Increment 6 is verified, played, and evaluated.
  - A completed Spring Water Line now removes the colony's recurring base water-consumption burden.
  - **Secure Water** is removed from assignment menus once the line is operational.
  - Any survivors still assigned to Secure Water from the previous turn are released to **Unassigned** rather than automatically redirected.
  - The Water pressure card changes to **Reliable supply** and explicitly reports that hauling labor has been freed.
  - The existing Phase 1 Water Collector remains a separate +2 Water/turn improvement, so it can continue adding reserve water without survivor labor.
  - Save format advances to v9 with v8 → v9 migration preserving existing regional/story knowledge and project state.
  - New physical script filename avoids stale installed-PWA assets.

### Phase 2 Increment 7 verification
1. Load the existing completed-line colony and confirm v8 → v9 without losing turn, resources, Spring Evaluated knowledge, Water Collector, Efficient Salvage, or Spring Water Line completion.
2. Confirm survivors who were previously assigned to Secure Water now show **Unassigned**. They must not be automatically moved to another task.
3. Open survivor assignment menus and confirm **Secure Water** is no longer available.
4. Confirm the Water pressure card now says **Reliable supply** and explains that the spring line has freed hauling labor.
5. Confirm the Spring Water Line panel says **Operational • routine water hauling eliminated**.
6. Choose new work for the freed survivors yourself and commit a turn.
7. Confirm the colony no longer loses 6 Water as base survivor consumption. If the existing Water Collector is built, Water should instead increase by +2 that turn unless another future mechanic changes it.
8. Confirm food, salvage, shelter, events, and other assignments continue resolving normally.
9. Close/reopen once and confirm the completed capability and assignments persist.
10. Gameplay judgment: does the first planning turn after solving water feel materially more capable because those survivor slots are now yours to use elsewhere?

Do not begin Increment 8 until this increment is verified, played, and evaluated.


### Increment 6 corrective patch
- Fixed a v7 → v8 migration defect that reset persisted Northern Ridge story knowledge to the initial Observed state. Future migrations now preserve existing regional knowledge and only seed it when absent.
- Fixed Spring Water Line project rendering; the project panel logic had been placed in the wrong function and therefore never appeared after Spring Evaluated.
- Fixed the render-side Build assignment counter so it cannot display undefined.
- The user's already-reset ridge progression cannot be automatically reconstructed from the overwritten save, but their replayed Spring Evaluated state is now the correct persisted state going forward.


- Phase 2 Increment 6 — Spring Water Line Commitment & Construction — **implemented; verification required**
  - Increment 5 is verified, played, and evaluated.
  - Spring Evaluated now unlocks a real project possibility rather than an automatic solution.
  - Committing the Spring Water Line costs 15 Salvage up front.
  - Once committed, **Build Spring Water Line** becomes a survivor assignment and requires 3 total construction work across committed turns.
  - Construction therefore competes directly with food, water, shelter, and salvage labor.
  - Completing construction does **not yet** activate the water-labor benefit; that capability transition is deliberately held for the next verified increment.
  - Save format advances to v8 with v7 → v8 migration preserving the colony.

### Phase 2 Increment 6 verification
1. Load the colony and confirm v7 → v8 with all existing state preserved.
2. After Spring Evaluated, confirm a **Spring Water Line** project panel appears.
3. Confirm committing it requires 15 Salvage. If you lack enough, the panel should tell you how much more is needed; gathering that salvage is intended gameplay.
4. Commit the project. Confirm 15 Salvage is spent immediately and the project remains unfinished at 0 / 3 construction work.
5. Confirm **Build Spring Water Line** now appears in survivor assignment menus.
6. Assign one survivor and commit a turn. Confirm normal survival rules still resolve and project status advances to 1 / 3.
7. Construction can be accelerated by assigning multiple survivors, but each builder gives up other work that turn.
8. Reach 3 / 3 total work. Confirm the project reports construction complete and the build assignment disappears.
9. Confirm completion does not yet reduce water consumption or automatically reassign water workers.
10. Close/reopen once and confirm project commitment/progress persists.
11. Gameplay judgment: did obtaining 15 Salvage and sacrificing survivor turns make the infrastructure feel like a genuine colony commitment rather than another story click?

Do not begin Increment 7 until this increment is verified, played, and evaluated.


- Phase 2 Increment 5 — Evaluate the Spring — **implemented; verification required**
  - Increment 4 is verified, played, and evaluated.
  - After Spring Confirmed, survivors gain **Evaluate Spring** as a one-turn investigation assignment.
  - Evaluation establishes practical feasibility without constructing anything: flow is useful, elevation can reduce hauling, route is workable but rough, and infrastructure will require recovered material plus construction labor.
  - Evaluation explicitly opens a future infrastructure commitment rather than granting an automatic solution.
  - Save format advances to v7 with v6 → v7 migration preserving the colony.
  - New physical script filename again avoids stale installed-PWA assets.

### Phase 2 Increment 5 verification
1. Reload online and load the colony. Confirm v6 → v7 without losing the current turn, resources, assignments, projects/research, or Spring Confirmed knowledge.
2. Confirm **Evaluate Spring** appears as the ridge-related assignment; the completed survey/investigation options remain absent.
3. Assign one survivor to Evaluate Spring. It must consume that survivor's turn and reveal nothing before Commit Turn.
4. Commit. Normal colony consumption/production resolves and the result reports **Discovery: Spring Evaluated**.
5. Confirm the regional knowledge now establishes useful flow, downhill potential, a workable-but-rough route, and the need for recovered pipe/channel material, intake work, and construction labor.
6. Confirm no water infrastructure is built and no survivor is automatically freed from water duty.
7. Confirm no manufactured/alien evidence appears yet.
8. Commit another turn. Evaluation must not repeat or advance automatically.
9. Close/reopen and check once in Airplane Mode; Spring Evaluated must persist.
10. Gameplay judgment: does this feel like useful planning knowledge earned through scarce labor, and does it create a meaningful future commitment rather than another free story step?

Do not begin Increment 6 until this increment is verified, played, and evaluated.


- Phase 2 Increment 4 — Focused Ridge Investigation — **implemented; verification required**
  - Increment 3 is verified, played, and evaluated.
  - Once the Northern Ridge is Surveyed, the old survey assignment is replaced by **Investigate Ridge Moisture**.
  - Committing a survivor to that focused investigation can confirm the small spring above the colony.
  - Discovery records the spring as a persistent world fact and notes its elevation/steady flow, but explicitly does not solve water.
  - The next problem remains evaluation: safety, flow, route, materials, labor, and infrastructure.
  - Save format advances to v6 with v5 → v6 migration preserving the colony.
  - A new physical script filename is used again to avoid the iPad PWA stale-script problem.

### Phase 2 Increment 4 verification

1. Reload online and load the existing colony. Confirm v5 upgrades to v6 without losing turn, resources, assignments, Water Collector, Efficient Salvage, or ridge knowledge.
2. Because the ridge is already Surveyed, assignment menus should no longer show **Survey Northern Ridge**; they should show **Investigate Ridge Moisture**.
3. Assign exactly one survivor to Investigate Ridge Moisture. Confirm this consumes that survivor's turn and the summary reports Ridge 1.
4. Before committing, the spring must not be revealed.
5. Commit the turn. Normal resource rules resolve, and the result should report **Discovery: Spring Confirmed**.
6. Confirm the Regional Survey now says a small clear spring emerges from fractured rock above the colony, roughly 34 meters higher, with apparently steady flow.
7. Confirm the interpretation explicitly says discovery is not a solution: flow, safety, route, materials, and labor still require evaluation.
8. Confirm there is still no engineered material, alien structure, ancient civilization, or automatic gravity-water project.
9. Commit another turn. The spring discovery must not fire again or advance automatically.
10. Close/reopen, including Airplane Mode after one online refresh, and confirm the confirmed spring persists.
11. Gameplay judgment: did choosing to spend scarce survivor capacity to follow the evidence feel earned, and does finding the spring create a new practical question rather than simply awarding a solution?

Do not begin Increment 5 until this increment is verified, played, and evaluated.


### Phase 2 Increment 3 delivery correction — second pass
- iPad PWA still served the previous assignment JavaScript despite the query-string cache bust. The screenshot confirmed the updated v5 HTML while the dropdown still had the old five choices.
- The Increment 3 application script now uses a new physical filename, `app-v5.js`, so it cannot collide with an older cached `app.js`.
- No gameplay or save-state rules changed.

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
