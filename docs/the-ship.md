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
work at 390 px (a thumb stick to walk, drag to look, one action button), a
keyboard-only path (WASD to walk, arrows to turn the camera, E to use), and
time. A classmate's endless driving game (marcuszorian) shows 3D runs fine
on this stack and on a phone. The server doesn't care: it simulates tiles,
bodies and ships exactly as it does now, and sends the same small state.
Rendering is the browser's job.

The 2D top-down renderer that exists today isn't wasted. It becomes the
chart.

## The world

- A sea of tiles: a harbour with a pier, calm water near it, reef fields
  that thicken with distance, and islands at increasing distances.
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
3. Helm. Held with a direction, the ship turns. Unheld, the heading stays.
4. Chart. Only a body standing at the chart table is sent the map beyond the
   ship's own sight, and only that body's view switches to the chart.
   Everyone else sees the water around the ship and nothing more.
5. Reefs. Crossing a reef tile damages the hull, and water rises every tick.
   A held pump lowers it. At full water the ship sinks.
6. Sinking. Everyone aboard is put ashore at the harbour. A wreck is written
   with the spot, the day, the names of everyone aboard, and the distance
   from harbour. The database refuses to change or delete it. The wreck is
   drawn where it happened and fades with age but never goes.
7. Islands. The first time any ship reaches an island, a landing is written
   with the crew's names, the crew size and the day, and a plaque stands on
   the island. Later landings are counted; the plaque keeps the first.
8. Absence. With nobody aboard, a ship stays where it is: the sail loosens,
   and if it is leaking the water keeps rising. The next visitor finds it as
   it was left. A ship that sinks empty leaves a wreck named "nobody
   aboard".
9. The pier. Ships are shared, not owned. A sunk ship is gone; the pier
   launches a new hull some minutes later, so there are never more than
   three ships moored and never none for long.
10. Talking is unchanged: a bubble reaches 8 tiles. Aboard, that is the whole
    ship. Ship to ship, and ship to shore, it isn't.

## What each extra body adds

| Aboard | What the ship can do |
|---|---|
| 1 | Leaves harbour. Raise the sail, run to the chart, run to the helm, notice the leak, run to the pump, find the sail has loosened. Calm water is fine; the reef field is usually a wreck. |
| 2 | One at the helm, one at the sail. The ship holds speed through turns. The near island is reachable. |
| 3 | A third on the pump. The ship can take a scrape and keep going, so the reef field is crossable. |
| 4 | A fourth at the chart, calling reefs ahead. The far islands come into reach. |
| 5 and up | Far out, the hull springs more than one leak. Several people pump at once. |
| A room of 30 | Three crews on three ships. The plaques say which crew got furthest. |

The ladder is not enforced by counting people. It falls out of one body
being in one place at a time, and of distances and leak rates that make one
pair of hands too few further out.

## What persists, and what expires

Forever: every wreck, every first landing, each ship's last state, your bird
and where it stood. Expires: bubbles (four seconds), who holds which station,
the voyage in progress.

The map tells the story on its own. Single-handed wrecks pile up near the
harbour. Far wrecks are rare and have long crew lists. The far plaques name
crews of four or more; the near one may say one sailor.

## Smallest schema

- `players`: as now.
- `ships`: id, x, y, heading, sail, water, hull, updated_at. One row per
  ship, including moored ones.
- `wrecks`: id, x, y, day, crew (names), distance. Triggers refuse update
  and delete.
- `landings`: island, day, crew (names), size. One row per island, kept.
- Who holds which station lives in memory. It is presence, not history.

## Numbers that are tuned, not guessed

Sail rise and loosen times, turn rate, station spacing, leak rate by
distance, reef density, the pier's launch interval. They get tuned with
headless bots the way crit 5's game was: one bot, then two, then four, each
run a hundred times. The targets, to be confirmed by the runs: alone, the
near island is reached sometimes and the reef field almost never; two reach
the near island nearly always; the far island needs four. The measured
numbers go in the README.

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
- A reef tile makes the water rise; a held pump lowers it.
- Full water sinks the ship, puts everyone ashore, and writes a wreck that
  names them, survives a restart, and refuses update and delete.
- With nobody aboard the water keeps rising.
- Two ships move independently; taking a moored ship leaves the others at
  the pier.
- The first landing on an island is written once, with the crew size.

## Not in this version

Cards on deck, wind, voice, trade, a lookout, treasure items (the plaque is
the treasure).

## Plan

- By Monday 12 October 13:30 (crit 9): the sim above with its tests, drawn
  in the existing top-down view; the decision record; README rewritten;
  PROCESS rewritten; reflections/crit-9.md. The sim is the same whichever
  way it is drawn, so this loses nothing.
- The week after: the block view, third person, phone and keyboard
  controls, the chart as the only map. Crit 10 (19 October) adds a log line
  per action and demos in 3D.
- Then islands and plaques, tuning by bots, and a second decision record on
  the view if it stands.

## Decisions taken for the first slice

Each of these is a default I chose to get building. Any of them can change.

1. Name: still Earshot, until a better one turns up.
2. Third person, when the block view lands.
3. Three ships at the pier; a new hull is launched five minutes after a
   sinking (`LAUNCH_DELAY_S`).
4. When a ship sinks, everyone is put ashore at the pier. Leaving a ship at
   sea also puts you ashore ("you swim back"), and the ship stays where it
   is.
5. Bubbles stay at 8 tiles.
6. Every wreck is drawn the same; its label says how many were aboard.
7. No crew cap beyond the deck's size.
8. The gate is gone, not kept as a ruin.
9. The sea map is generated from a fixed seed, so every visitor sees the
   same reefs and islands and the spec can rely on them.
