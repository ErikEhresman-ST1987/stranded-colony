# Stranded Colony

Stranded Colony is a local-first, turn-based colony survival and development game for iPhone, iPad, and desktop browsers.

## Current checkpoint

- Increment 1 — Application Shell and Persistence Foundation — **verified**
- Increment 2 — First Colony State and Visible Board — **verified**
- Increment 3 — Assignments and Resources — **verified**
- Increment 4 — Authoritative Turn Resolution — **verified**
- Increment 5 — First Improvement / Project — implemented; activation and verification required before Increment 6

## Increment 5 scope

The first colony improvement is the **Water Collector**. It costs 9 Salvage and, once built, permanently contributes +2 Water during each committed turn.

Building is an explicit player action. The project cost is deducted from authoritative Game State and the completed project is persisted before the UI adopts the new state. The existing turn resolver reads completed project state and applies the Water Collector output as part of resource production.

This is intentionally one complete project, not a project catalog or construction framework. No research, risks, events, construction timers, or additional buildings have been added.

Save format remains v2 because the existing playthrough already includes the projects object.

## Increment 5 verification gate

1. Load the verified colony. If Salvage is below 9, assign survivors to Salvage Wreck and commit turns until at least 9 is available.
2. Confirm the Water Collector panel changes to Ready to build when the colony has at least 9 Salvage.
3. Build it. Confirm exactly 9 Salvage is deducted, the panel reports Built, and the build button disappears.
4. With five survivors, set one survivor to Secure Water and the others to non-water work. Commit one turn. Water should change by 0: +3 from the worker, +2 from the collector, and -5 consumption.
5. Set no survivors to Secure Water and commit another turn. Water should change by -3: +2 collector and -5 consumption.
6. Fully close and reopen the app, load the colony, and confirm the Water Collector remains built and continues contributing +2 Water.
7. After an online reload, repeat a turn in Airplane Mode and confirm the project effect and resulting state persist offline.

Do not begin Increment 6 until Increment 5 is activated and these checks are confirmed.
