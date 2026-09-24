# Stranded Colony

Stranded Colony is a local-first, turn-based colony survival and development game for iPhone, iPad, and desktop browsers.

## Current checkpoint

- Increment 1 — Application Shell and Persistence Foundation — **verified**
- Increment 2 — First Colony State and Visible Board — **verified**
- Increment 3 — Assignments and Resources — **verified**
- Increment 4 — Authoritative Turn Resolution — implemented; activation and verification required before Increment 5

## Increment 4 scope

The first authoritative turn loop is active: plan assignments, commit the turn, resolve resource changes, advance the turn exactly once, validate/save the resulting state, and render it.

For this first-slice balance, each survivor requires 1 Food and 1 Water per turn. Each survivor assigned to Forage produces 3 Food; Secure Water produces 3 Water; Salvage Wreck produces 3 Salvage. Maintain Shelter is a valid assignment but has no resource yield in this increment.

Turn resolution is deterministic. No random events, projects, research, injuries, survivor changes, or risk systems are active yet. Assignments remain in place after a turn so the player can review or change the next plan.

Save format remains v2; the existing schema already contains all state required for this increment.

## Increment 4 verification gate

1. Load the verified colony and note its current Turn, Food, Water, Salvage, and assignments.
2. Use a simple test plan: one survivor on Forage, one on Water, one on Salvage, and the other two on any non-producing assignments.
3. Commit one turn. With five survivors, Food should change by -2, Water by -2, Salvage by +3, and Turn by exactly +1.
4. Confirm the result message reports those same changes and assignments remain selected.
5. Fully close and reopen the app, load the colony, and confirm the new turn number, resources, and assignments persisted.
6. Commit one more turn and confirm the same deterministic rules apply exactly once.
7. After an online reload, test Airplane Mode: load the colony and commit a turn. Confirm the turn resolves and persists offline.

Do not begin Increment 5 until Increment 4 is activated and these checks are confirmed.
