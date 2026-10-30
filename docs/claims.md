# What holds each claim

Every claim here has a test that drives a running server, or reads its
database once it stops. `spec/ship.test.ts` unless noted.

1. One body, one station; one holder per station.
2. An unheld sail loosens and the ship slows.
3. Sail and helm held by two bodies keep speed through a turn; one body
   running between them loses it.
4. A reef under a moving hull holes it where it struck, and a ship lying
   still takes no more; a body standing on the hole patches it; open holes
   take water, a held pump empties it, and at full water the ship sinks.
5. A sinking puts everyone ashore and writes a wreck naming them that
   nothing can change or delete.
6. A ship nobody is aboard keeps running down.
7. Ships move independently and stop short of each other; the one berth is
   refilled ten seconds after its ship is clear of it, with a countdown over
   everyone waiting, and a ship left empty away from it for five minutes is
   scuttled.
8. An island's first landing is written once, with the crew; later visits
   are counted.
9. Only a body at the chart table is sent the map.
10. Bubbles and gestures reach 8 tiles; nobody is sent another's cookie; a
    move shows within a second; your bird survives a restart.
    (`spec/walk.test.ts`, `spec/persist.test.ts`, `spec/harbour.test.ts`)
11. A typed name goes on every record after it.
12. Every landing and wreck is a kept line on the harbour board, with crew
    and day.
13. A note left ashore is seen within sight, kept, and taken up only by its
    writer.
14. A word reaches everyone within earshot and nobody else, whatever the
    client asks; a word nobody heard says so. (11–14: `spec/harbour.test.ts`)
15. The pier is the only way on or off a ship: E boards one alongside and
    steps off one there; nothing leaves a ship at sea but a sinking.
16. Everyone aboard has a job, given by the order they boarded and sent to
    every client in the snapshot (the page shows it over each head and in
    the crew list); a job left unworked at sea is named to its owner, and
    nothing stops anyone working any station
    ([decision record 7](decisions/0007-everyone-aboard-has-a-job.md)).

The red runs that showed each test failing first are in
[`red-runs.md`](red-runs.md).
