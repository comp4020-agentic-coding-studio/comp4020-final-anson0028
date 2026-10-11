# Tuning by simulated crews

The numbers in `server/params.ts` decide whether the ladder in
`docs/the-ship.md` exists: alone you should sometimes reach the near island
and rarely the middle one, two of you should nearly always reach the near
island and sometimes the middle one, three should usually reach the middle
one, and the far island should take four, the fourth standing at the chart
table and calling the route. Two played sessions on 10 October showed the
first numbers gave no ladder at all: two people reached all three islands
in seventy seconds without touching the pump, and one person reached the
near island in ten.

## Method

`pnpm crews` (`scripts/crews.ts`) starts a server of its own for every run,
at `SIM_SPEED` times real time (a test-only switch; the physics are per
tick, so only the waiting changes), boards one ship with a crew of one to
four bots, and plays a fixed strategy per headcount:

- One body runs between stations by priority: pump when the water is past
  60%, until it is under 15; the sail when it is under half, until it is
  full; the helm when the course is more than 7° off; otherwise the sail.
- Two: one holds the sail the whole way; the other takes the helm until the
  course is set, then pumps when the water passes 30%, going back to the
  helm when the course drifts more than 9°.
- Three: sail, helm and pump, each held the whole way.
- Four: three, plus a body at the chart table who plots a route around the
  reef tiles (a shortest path that charges 40 for a reef tile and 6 for
  each reef next to a tile) and hands the helm its waypoints. Crews of one
  to three steer straight at the island.

Each run ends when the ship lands on the target island, sinks, or 150
game-seconds pass, and records which, the time, and the furthest the ship
got from the pier. A cell is one headcount and one island; the tables give
the share of runs that landed, wrecked and timed out, the median time of
the landings, and the mean furthest point.

The bots are steadier than people, never talk, and never panic, so a cell
that is hard for them is harder for a crew of strangers. That is the right
way round for the ladder.

## What the first sweeps showed, 12 October

**Sweep 1, the numbers as shipped and three slower, leakier sets.** No
ladder. With the shipped numbers every crew, one to four, landed on every
island every time (solo to the far island in 27 s). Slowing the ship to 1.6
tiles a second, doubling reef damage and leak, and loosening the sail twice
as fast only made the solo far run fail; crews of two, three and four still
landed everywhere, in the same times. Two things in the rules, not the
numbers, were the cause:

- The third body had no job. The heading held when the helm was let go, so
  two people, one on the sail and one who set the course and then pumped,
  were as good as three. In the simulation the two-crew and three-crew rows
  were identical to the second.
- Reefs were too thin to matter: none within 16 tiles, at most 30% further
  out, spread evenly, so a straight line to any island crossed only a few.

**Sweep 2, two rule changes.** The helm now wanders when nobody holds it
(`HELM_DRIFT`, a slow swing of up to that many radians a second), so a
two-crew ship pumping its way across the reefs drifts off course and someone
has to leave the pump. Reefs start at 12 tiles, rise faster and reach 45 to
50% (`REEF_FROM`, `REEF_SLOPE`, `REEF_MAX`). With the ship at 1.2 tiles a
second the rows separated for the first time: solo landed on the near
island every time, on the middle one in one run of six and not at all on the
far one; two landed on the middle island every time and never on the far;
three and four reached the far island in one and two runs of six. Two
things were still wrong. The first version of the simulator counted a ship
that sank in the same instant its snapshot vanished as a timeout, which hid
most of the wrecks; fixed before sweep 3. And the fourth body, the
navigator, gained almost nothing, because with reefs spread evenly there is
no route to find.

**Sweep 3, reefs in clumps.** Reef density is now modulated by a smooth
field (`REEF_CLUMP`): fields of reef with clear lanes between them, so a
crew with someone at the chart table can find a way through that a crew
steering straight cannot. Eight runs per cell, three sets. The best of them
(ship 1.2 tiles a second, sail loosening at 0.12 a second, reef damage 15 a
second, leak 0.06 of the hull damage a second, pump 3 a second, reefs from
12 tiles rising by 1/70 per tile to 50%, helm drift 0.1):

| crew | near | middle | far |
|---|---|---|---|
| 1 | landed 8/8 | wrecked 8/8 | wrecked 8/8 |
| 2 | landed 8/8 | landed 6/8, wrecked 2 | wrecked 8/8 |
| 3 | landed 8/8 | landed 8/8 | landed 8/8 |
| 4 | landed 8/8 | landed 8/8 | landed 8/8 |

The ladder exists for one, two and three. Three and four were the same
row, and the reason was mine: the navigator's path search mixed its
estimate with its cost and never found a route, so the four-crew had been
steering straight all along. Fixed before sweep 4, which also makes the far
sea harder so that a straight line through it should fail and a route
through the lanes should not.

**Sweep 4, a working navigator and a harder far sea.** Three sets, eight
runs per cell: leak 0.07, or reef damage 20, or reefs to 60%. All three
gave the same shape: three reach the middle island always and the far one
once in eight; four reach the far island every time by the lanes. The
leak-0.07 set keeps the two-crew's middle island at "sometimes" (5 of 8),
so it was chosen. The four-crew's near-island row failed in all three sets
for a reason that was the simulator's again: the route out of the harbour
began along the row of berths and the ship was blocked by its neighbour.
The navigator now leaves the harbour eastward before following the route.

## The numbers, 12 October

`MAX_SPEED` 1.2, `SAIL_RISE` 0.25, `SAIL_LOOSEN` 0.12, `TURN_RATE` 0.8,
`REEF_DAMAGE` 15, `LEAK_PER_DAMAGE` 0.07, `PUMP_RATE` 3, `REEF_FROM` 12,
`REEF_SLOPE` 70, `REEF_MAX` 0.5, `REEF_CLUMP` 1, `HELM_DRIFT` 0.1. Twelve
runs per cell, 220 game-seconds each, at five times real time:

| crew | target | landed | wrecked | timed out | median landing (s) | mean furthest (tiles) |
|---|---|---|---|---|---|---|
| 1 | near | 100% | 0% | 0% | 20 | 20 |
| 1 | middle | 0% | 100% | 0% | – | 35 |
| 1 | far | 0% | 100% | 0% | – | 31 |
| 2 | near | 100% | 0% | 0% | 18 | 20 |
| 2 | middle | 58% | 42% | 0% | 38 | 46 |
| 2 | far | 0% | 100% | 0% | – | 54 |
| 3 | near | 92% | 0% | 8% | 18 | 18 |
| 3 | middle | 100% | 0% | 0% | 37 | 41 |
| 3 | far | 33% | 67% | 0% | 63 | 64 |
| 4 | near | 100% | 0% | 0% | 19 | 20 |
| 4 | middle | 100% | 0% | 0% | 41 | 42 |
| 4 | far | 100% | 0% | 0% | 65 | 70 |

The one three-crew near-island timeout was a run whose sailor never got
the sail; it is left in the table rather than re-rolled. The far island
takes about a minute of sailing with four aboard. These are bots; a crew of
strangers who have to find the stations, talk, and notice the water will
do worse, which is the right side to err on. The next check is the crit 10
pod.
