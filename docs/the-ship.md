# The ship: design note, 10 October 2026

Written before the build and corrected once, after the first round of
comments on it. The defaults I chose in order to start building are at the
end; the plan says what came in which week.

## What changes, and why

Earshot's gate had three faults, and I heard about each from a different
place. At crit 8 the pod opened the gate once and then had nothing to do;
when I played it alone the day before, I could only walk. The tutor said an
idea borrowed from a game needs its own variation, and that I should work
out what is good and bad in games like it. The research on Big Walk found
the same complaint in its reviews: no solo mode, no matchmaking, so it needs
a fixed group of friends, and its puzzles stay sized for four in a lobby of
twelve. Earshot had copied the fault along with the idea.

So the first rule of the new design is that a person who arrives alone can
do something. Not everything, and not well, but something. That rule comes
from feedback, and this note says so because the course reads corrections
as process.

The research (29 games and papers) and the cohort survey (114 apps) agree on
what the strong designs share: a rule that makes a second person necessary,
and an artefact that is itself the attributed record. Nobody in the cohort
makes the number of people needed change with how many are there. That is
the gap this design goes for.

Kept from Earshot: the world, walking, bird identities, the server-owned
loop, SQLite, the tests and deployment, and the rule that what you can do
and know depends on where your body is. Dropped: the plate, the keypad and
the gate.

## The idea in one sentence

Ships at a pier, many hands. A body can hold one station at a time, every
station needs tending, and the sea gets harder the further out you go, so
how far a ship gets is a record of how many people were aboard together.

## The view

The world is drawn in 3D from simple blocks, seen over your bird's shoulder
(third person). You see the deck around you and the water ahead, and that
is all. The only top-down map is on the chart table: stand there and the
view switches to the chart.

This isn't decoration. In the old top-down view everyone saw the whole
island for free. In a block world you see what is in front of you, and the
map is something you have to go and stand at. "Where you stand decides what
you know" becomes literal.

What it costs: a 3D renderer (three.js, in the browser), phone controls that
work at 390 px (a d-pad to walk, drag to look, one action button), a
keyboard-only path (WASD to walk, arrows to turn the camera, E to use), and
time. A classmate's endless driving game (marcuszorian) shows 3D runs fine
on this stack and on a phone. The server doesn't care: it simulates tiles,
bodies and ships exactly as it does now, and sends the same small state.
Rendering is the browser's job.

The 2D top-down renderer that exists today isn't wasted. It becomes the
chart.

## The world

- A sea of tiles: a harbour with a pier, islands at increasing distances,
  clear lanes between them, and reef fields in the open water far from any
  of them.
- Several ships moored at the pier (three to start). Any crew can take any
  free one. Each ship is a small deck (about 7 by 4 tiles) that carries the
  bodies standing on it, with stations at least three tiles apart: sail,
  helm, chart table, pump.
- You walk on the deck, and onto the pier when the ship is docked.

## Rules

Each of these becomes a test.

1. One body, one station. You hold a station by standing on its tile and
   holding the action key. Stepping off releases it. Two bodies can't hold
   the same station.
2. Sail. Held, the sail rises over a few seconds. Unheld, it loosens over a
   longer time. Speed follows the sail.
3. Helm. Held with a direction, the ship turns. Unheld, a sailing ship
   wanders: a slow swing either way, so a course set and left drifts off
   over the next half minute. (Changed 12 October: with a heading that held
   itself, two people were as good as three; see `docs/tuning.md`.)
4. Chart. Only a body standing at the chart table is sent the map beyond the
   ship's own sight, and only that body's view switches to the chart.
   Everyone else sees the water around the ship and nothing more.
5. Reefs. A reef tile under the bow, the centre or the stern of a moving
   ship opens a hole at that part of the deck, as fast as the ship is
   going; a ship lying still on a reef takes no more. Water rises every
   tick while any hole is open. A body standing on a hole and holding
   patches it; a held pump lowers the water. At full water the ship sinks.
6. Sinking. Everyone aboard is put ashore at the harbour. A wreck is written
   with the spot, the day, the names of everyone aboard, and the distance
   from harbour. The database refuses to change or delete it. The wreck is
   drawn where it happened and fades with age but never goes.
7. Islands. The first time any ship reaches an island, a landing is written
   with the crew's names, the crew size and the day, and a plaque stands on
   the island. Later landings are counted; the plaque is a flag on the
   island that names the first crew. (Jumping onto islands lived for four
   days in October and was removed on the 18th: a Space press aboard put
   people in the sea by accident, and nobody needed the island itself.)
8. Absence. With nobody aboard, a ship stays where it is: the sail loosens,
   and if it is leaking the water keeps rising. The next visitor finds it as
   it was left. A ship that sinks empty leaves a wreck named "nobody
   aboard". A ship left empty away from the berth for five minutes is
   scuttled without a record (18 October: the harbour had filled with
   drifted hulls).
9. The pier. Ships are shared, not owned. There is one berth. Ten seconds
   after its ship is clear of it a new one is launched, and everyone not
   aboard sees the countdown over their head; ships at sea stay where they
   were left, up to a cap on the fleet. Boarding is E beside the ship,
   within five tiles or so.
10. Talking is unchanged: a bubble reaches 8 tiles. Aboard, that is the whole
    ship. Ship to ship, and ship to shore, it isn't.
11. Hulls are solid. A ship stops short of another ship and of the shore,
    the hull is checked at bow, centre and stern, and the crew are told when
    it is stopped or scraped.

## What each extra body adds

| Aboard | What the ship can do | Measured, 18 October (`docs/tuning.md`) |
|---|---|---|
| 1 | Leaves harbour. Raise the sail, run to the helm, run back as the sail loosens, run to the pump when the water shows, stand on a hole to patch it. The rocks thicken on the way out; alone, a scrape is the end unless you stop and patch. | Near and middle 12 of 12; far 1 of 12. |
| 2 | One on the sail, one who sets the course and then pumps or patches, running back to the helm as the ship wanders. | Near and middle 12 of 12; far 11 of 12. |
| 3 | Sail, helm and pump all held. The ship holds its course and takes scrapes. | Every island 12 of 12; the far one in 63 s. |
| 4 | A fourth at the chart table, who alone sees the reef fields and calls a route through the lanes. | Every island 12 of 12; the far one in 66 s. |
| A room of 30 | One berth, a new ship ten seconds after the last one clears, so crews form on the pier while they wait. The board says which crew got furthest. | Not yet. |

The ladder is not enforced by counting people. It falls out of one body
being in one place at a time, of a helm that wanders when nobody holds it,
and of rocks that thicken with distance from the pier. The sea was opened
right out on 14 October and found empty; on the 18th a thin scatter came
back, growing on the way out, with the dense fields kept to the corners.
Bots that never patch land on the near and middle islands at any size and
reach the far one alone once in twelve, with two aboard eleven times, and
with three or four every time.

## What persists, and what expires

Forever: every wreck, every landing (a line on the harbour board with the
crew's names and the day; the first one on each island is also the plaque),
every note until its writer takes it up, each ship's last state, your bird,
its name and where it stood. Expires: bubbles (eight seconds), what you
heard (two minutes, on your screen only), who holds which station, the
voyage in progress.

The map tells the story on its own. Single-handed wrecks pile up near the
harbour. Far wrecks are rare and have long crew lists. The far plaques name
crews of four or more; the near one may say one sailor.

## Smallest schema

- `players`: as now.
- `ships`: id, x, y, heading, sail, water, hull, leaks (the open holes as
  JSON), updated_at. One row per ship, including moored ones.
- `wrecks`: id, x, y, day, crew (names), distance. Triggers refuse update
  and delete.
- `landings`: island, day, crew (names), size. One row per island, kept.
- Who holds which station lives in memory. It is presence, not history.

## Numbers that are tuned, not guessed

Sail rise and loosen times, turn rate, station spacing, leak rate by
distance, reef density, the pier's launch interval. They were tuned with
headless bots on 12 October, crews of one to four, each cell run a dozen
times; the method, the sweeps and the two rule changes they forced (a helm
that wanders, reefs in clumps) are in `docs/tuning.md`, and the measured
ladder is in the README.

## What I learned from each game

The research notes are in the repo's survey; this is the short form, one
lesson each, and whether it is kept or left out.

| Looked at | Lesson | Kept | Left out |
|---|---|---|---|
| Big Walk (House House, 2026) | Distance splits one group into small conversations and makes information travel down a chain of people. Its reviews: no solo mode and puzzles sized for four make it need a fixed friend group. | 8-tile talk; information that has to be carried (the chart). | Voice; no solo play. |
| Lethal Company | One player watches the ship's monitor and relays by walkie. The full view is a job, not a gift. | The chart table as a station with a duty to call out. | Walkie-talkies; dead players who can only watch. |
| Keep Talking and Nobody Explodes | Split who knows from who acts, and nobody can finish alone or boss the rest. | Chart (knows) and helm (acts) are different bodies. | One fixed pair while everyone else watches. |
| Spaceteam | Everyone holds an order meant for someone else, and shouting it into the room is the design. | The room's shouting counts as play. | Shouting as the only channel. |
| Overcooked | One person can do every station, slowly and badly; two split the work. | The whole solo rule. | Timers and scores. |
| Sea of Thieves | A crew shares one ship with real stations. | Stations; shared hull. | 3D combat, voice, matchmaking. |
| Pico Park | Levels change with how many players there are. | The ladder that changes with headcount. | "Everyone must take part", which doesn't survive thirty people. |
| Journey, Sky | Strangers cooperate without words; names come only after a shared act. | Crew names appear together on wrecks and plaques. | Removing words altogether. |
| Dark Souls, Death Stranding | Traces left where they happened; credit goes to everyone who helped, not the last hand. | Wrecks at the spot; every name aboard, not the captain's. | Ratings that reward the author. |
| r/place, Wordle | A deliberate reset and a lasting record; one shared clock. | A day stamp on every wreck and landing. | A daily wipe (the sea keeps everything). |
| Koster's laws; Erickson and Kellogg (2000) | A narrow game fails; socialising needs downtime. Limits should be visible and run both ways. | Islands at every distance; the deck has room to stand around. The chart rule is the same for everyone. | — |
| Long Watch (my own earlier idea) | Absence is an event the next visitor can read. | A ship left at sea keeps running down. | Storms and coal. |
| drift archive (classmate marcuszorian) | A trace met in space where it happened, aging visibly; 3D is doable here. | Wrecks that fade but stay; the block view. | Solo play as the whole game. |
| Calligraphy Relay (classmate u7663394) | Nobody may act twice in a row, so a second person is a rule, and the artefact carries a seal per hand. | The artefact as the attributed record. | Turns. |
| The garden (classmate cxin16215-netizen) | Headcount unlocks things in steps (2, 3, 4, 5 people). | The ladder, but made of distance and leaks instead of thresholds. | Counting heads on the server. |
| The village (classmate anpham-09) | A thing becomes permanent only when someone else was there. | Plaques and wrecks name everyone present. | Fixed at two. |
| Common Pool (classmate avaai666) | One person can't tip the world; two can, and the spec proves it. | Tuning proven by simulation, not asserted. | — |
| Earshot (my crit 8) | After the first pair, nothing to do; a lone stranger could only walk. | The rule that one person can always sail. | The gate. |

## Tests for Monday, written red first

- A body cannot hold two stations, and two bodies cannot hold one.
- An unheld sail loosens and the ship slows.
- Two different bodies on sail and helm keep speed through a turn; one body
  alternating loses it.
- A reef tile under a moving ship opens a hole where it struck, and none
  under a ship lying still; a body standing on it patches it; open holes
  make the water rise and a held pump lowers it.
- Full water sinks the ship, puts everyone ashore, and writes a wreck that
  names them, survives a restart, and refuses update and delete.
- The pier is the only way on or off: E boards a ship alongside and steps
  off one there; at sea, stepping off is refused and a jump is only a hop.
- The one berth is refilled ten seconds after its ship is clear, with a
  countdown in every snapshot; a ship left empty away from it is scuttled.
- With nobody aboard the water keeps rising.
- Two ships move independently; taking a moored ship leaves the others at
  the pier.
- The first landing on an island is written once, with the crew size.

## Not in this version

Cards on deck, wind, voice, trade, a lookout, treasure items (the plaque is
the treasure).

## Plan

- Done 10 October, tagged `crit-9`: the sim with its tests, drawn top-down;
  the decision record; README, PROCESS and reflections/crit-9.md rewritten.
- Done the same evening, after the tag: the block view, third person, WASD
  and arrows, d-pad and drag on a phone, the chart as the only map. The
  top-down renderer survives only as the chart. The helm now turns on the
  port/starboard part of the holder's input, because camera-relative keys
  make "left" mean a side of the ship, not a side of the deck.
- Done 11 October, after two played sessions and a night of being played:
  the hull as three points and ships that stop short of each other and of
  the shore, with the crew told why; ships moored apart; a first-visit card;
  typed names; the harbour board.
- Crit 10 (19 October): a log line per action, tuning by bots with the runs
  recorded, plaques in the world, and a second decision record on the view
  if it stands.

## Decisions taken for the first slice

Each of these is a default I chose to get building. Any of them can change.
The ones that were argued over have a record in `docs/decisions/`: one body
one station (1), the block view (2), berths that refill (3), typed names
(4), a board that ranks nothing (5), notes and no wide channel (6).

1. Name: still Earshot, until a better one turns up.
2. Third person, when the block view lands.
3. One berth at the pier, refilled ten seconds after its ship is clear
   (`LAUNCH_DELAY_S`), with at most twelve ships in the world (`MAX_SHIPS`)
   and a ship left empty away from the berth scuttled after `DERELICT_S`.
   Changed on 11 October from "a new hull five minutes after a sinking",
   after a reviewer showed three ships abandoned intact at sea left the
   harbour empty for good; and on 18 October from three berths to one,
   after the harbour filled with drifted, half-boarded hulls.
4. When a ship sinks, everyone is put ashore at the pier. Leaving a ship at
   sea also puts you ashore ("you swim back"), and the ship stays where it
   is.
5. Bubbles stay at 8 tiles.
6. Every wreck is drawn the same; its label says how many were aboard.
7. No crew cap beyond the deck's size.
8. The gate is gone, not kept as a ruin.
9. The sea map is generated from a fixed seed, so every visitor sees the
   same reefs and islands and the spec can rely on them.
10. Names are free text, letters, digits and spaces, 16 at most, with the
    bird name as the default. Two visitors may share a name.
11. The harbour board sits at the top right the whole time: every landing
    and wreck, newest first, with the day. It ranks nothing; the only
    summary is who got furthest today.
12. A first-visit card says what this is, lists the keys and asks the name.
    It shows once per browser and ? brings it back.
13. Notes on the ground, 11 October, borrowed from a classmate's campus
    (passionleader): written where you stand ashore, 60 characters, three
    each, read within 1.5 tiles, sent only within sight, fading over 14
    days but never removed except by the writer. The stronger version,
    notes on the islands, waits on stepping off a landed ship.
14. Talk, the same day: bubbles last 8 seconds, the last two minutes of what
    you heard stay on your own screen, and a word nobody heard says so. No
    channel reaches further than 8 tiles; that is the rule the project
    stands on. A crew-only channel (Shift+Enter) lived three days and was
    removed on 14 October: cold players could not tell it from the open
    one, and it reached the pier anyway.
15. Gestures, the same day, also from the campus: wave, jump, nod and
    shake. The jump was an act for four days in October (boarding, landing
    on islands, into the sea) and went back to being a hop on the 18th.
    They carry 8 tiles like a word, plus the whole crew when aboard, one
    every 400 ms, and nothing is recorded. They give the people standing
    around on the pier something to answer with.
16. The log, for crit 10: one line per act on stdout, naming the person by
    name and public id, including every refusal, so two people in two
    browsers can be told apart from `flyctl logs` alone. Positions and
    inputs are not logged; the stream is for reading, not replaying.
