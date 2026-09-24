# Stranded Colony

Stranded Colony is a local-first, turn-based colony survival and development game for iPhone, iPad, and desktop browsers.

## Current checkpoint

- Increment 1 — Application Shell and Persistence Foundation — **verified**
- Increment 2 — First Colony State and Visible Board — **verified**
- Increment 3 — Assignments and Resources — **verified**
- Increment 4 — Authoritative Turn Resolution — **verified**
- Increment 5 — First Improvement / Project — **verified**
- Increment 6 — First Capability / Research Change — **verified**
- Increment 7 — First State-Responsive Risk / Event — implemented; activation and verification required before Increment 8

## Increment 7 scope

The first state-responsive event is **Shelter Wear**. It gives the existing Maintain Shelter assignment its first protective purpose.

After normal resource resolution, if Shelter Wear has never occurred and no survivor was assigned to Maintain Shelter for that turn, loose crash debris damages the emergency shelter. Emergency repairs consume up to 2 Salvage. The event is then marked resolved and will not repeat.

If at least one survivor is assigned to Maintain Shelter, the event does not occur and remains eligible for a later unprotected turn. This makes the event respond to actual colony state rather than a random timer.

The consequence is resolved inside the authoritative turn path, included in the turn's Salvage delta, saved with the resulting colony state, and rendered from persisted event state. Save format remains v2 because event state fits within the existing flags area.

This increment deliberately adds one deterministic event only. It does not add random event tables, probabilities, injuries, chains, or a general event engine.

## Increment 7 verification gate

Important: on the first turn after this update, assign at least one survivor to Maintain Shelter so the prevention case can be tested before the one-time event is allowed to occur.

1. Load the verified colony and note current Salvage.
2. Assign at least one survivor to Maintain Shelter. Commit a turn. Shelter Wear should NOT appear.
3. Remove every survivor from Maintain Shelter. Note Salvage, then commit one turn.
4. Shelter Wear should appear. Compared with the normal work yield for that turn, an additional 2 Salvage should be consumed (or all remaining Salvage if fewer than 2 were available). The turn result's Salvage delta should include that consequence.
5. Commit another turn with nobody maintaining the shelter. Shelter Wear must NOT occur a second time and no second 2-Salvage event cost should be applied.
6. Fully close and reopen the app, load the colony, and confirm the Shelter Wear event remains visible as historical state and does not repeat.
7. After an online reload, commit another turn in Airplane Mode and confirm the event history and resulting colony state persist offline.

Do not begin Increment 8 until Increment 7 is activated and these checks are confirmed.
