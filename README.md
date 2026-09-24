# Stranded Colony

Stranded Colony is a local-first, turn-based colony survival and development game for iPhone, iPad, and desktop browsers.

## Current checkpoint

- Increment 1 — Application Shell and Persistence Foundation — **verified**
- Increment 2 — First Colony State and Visible Board — **verified**
- Increment 3 — Assignments and Resources — **verified**
- Increment 4 — Authoritative Turn Resolution — **verified**
- Increment 5 — First Improvement / Project — **verified**
- Increment 6 — First Capability / Research Change — implemented; activation and verification required before Increment 7

## Increment 6 scope

The first research capability is **Efficient Salvage**. It costs 12 Salvage. Once researched, every survivor assigned to Salvage Wreck recovers 5 Salvage per committed turn instead of the base 3.

This is a capability change rather than passive production: the authoritative turn resolver reads completed research and changes the rule used for the existing Salvage Wreck assignment.

Research completion is persisted before the UI adopts the new state. Save format remains v2 because the existing playthrough already includes the research object.

No research tree, research points, timers, risks, events, or additional technologies are introduced in this increment.

## Increment 6 verification gate

1. Load the verified colony. If Salvage is below 12, work the wreck until at least 12 is available.
2. Confirm Efficient Salvage changes to Ready to research when 12 Salvage is available.
3. Research it. Confirm exactly 12 Salvage is deducted, the panel reports Researched, and the research button disappears.
4. Assign exactly one survivor to Salvage Wreck and the other four to non-salvage work. Commit one turn. Salvage should increase by exactly 5.
5. Assign two survivors to Salvage Wreck and commit another turn. Salvage should increase by exactly 10.
6. Fully close and reopen the app, load the colony, and confirm Efficient Salvage remains researched and still changes salvage yield.
7. After an online reload, repeat a salvage turn in Airplane Mode and confirm the capability and resulting state persist offline.

Do not begin Increment 7 until Increment 6 is activated and these checks are confirmed.
