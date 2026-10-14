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

**Sweep 5, thinner reefs, 12 October afternoon.** Played on a phone on
the local network, the sea read as mostly rock, and a ship holed early
sank with nothing to be done about it. Two rules changed first: a reef now
holes the hull at the part that struck, bow, centre or stern, the hole
shows on the deck as a red tile, and a body standing on it and holding
patches it (`REPAIR_RATE`, each hole at most `LEAK_CAP` 40); water comes
in only while a hole is open. Then the reefs were thinned. The first
tables of the afternoon were thrown away: the simulator had a fourth
fault, a server left running after every landed or wrecked run, and by
the time it was noticed 398 of them were sharing the ten cores (load
average 200). With the leak fixed and the strays killed, the shipped
numbers were measured again on a quiet machine and gave the same ladder
as the table of the morning, within a run or two per cell, so that table
stands. Then four thinner seas, twelve runs per cell, bots as before,
which matters: no bot patches a hole, so every row is a floor for a crew
that does.

| reefs (rise per tile, cap) | share of the sea that is reef | 1 → middle | 2 → middle | 3 → far | 4 → far |
|---|---|---|---|---|---|
| 1/70 to 50% (shipped) | 32% | 0/12 | 8/12 | 3/12 | 12/12 |
| 1/80 from 16 tiles to 40% | 25% | 12/12 | 12/12 | 3/12 | 12/12 |
| 1/90 from 14 tiles to 35% | 23% | 12/12 | 12/12 | 2/12 | 12/12 |
| 1/100 to 30% | 21% | 12/12 | 12/12 | 4/12 | 12/12 |
| 1/100 to 30%, damage 25 | 21% | 11/12 | 12/12 | 4/12 | 12/12 |

Any thinner sea costs the middle rung: a solo bot steering straight
reaches the middle island, where in the shipped sea it wrecked every
time, and the three seas between give nothing back for their extra rock.
A harder scrape does not restore it either. The near island and the far
one still separate one from four, and the hole on the deck is now a job a
second or third body can do, which the bots do not model. The thinnest
sea was kept, damage left at 15.

One more rule came from the same log: the reef kept tearing a hull that
had stopped on it, so the player patched one hole while two more opened
and the ship sank with four. Damage now scales with the sail, and a ship
lying still takes none; `REPAIR_RATE` went from 10 to 20 by hand, from
that log and not from a sweep, because the bots never patch. The ladder
as played, with people who do, is for the crit 10 pod to show.

**Sweep 6, the open sea, 14 October.** Three agents played the deployed
build cold, and the brief for the next change came from me after reading
them: far fewer reefs, no stray single rocks, dense fields only far from
any island, a sail that stays up longer, and a sea anyone can cross to the
far island by just sailing. That is a different game from the ladder
above, and it is the one I want for a room of strangers: the hands matter
in how fast and how dry you get there, not in whether you get there.

The map rule changed with it. Reef probability now rises with the distance
to the nearest of the pier and the three islands (`REEF_FROM` tiles of
clear water around each, then `1/REEF_SLOPE` per tile to `REEF_MAX`), so
the lanes between islands are open and the fields sit in the corners of
the chart; a reef cluster of fewer than five tiles is removed, so there are
no stray rocks. Two densities, twelve runs per cell, bots as before and
still not patching:

| reefs | share of the sea | 1 → far | 2 → far | 3 → far | 4 → far |
|---|---|---|---|---|---|
| 1/50 from 10 tiles to 50% | 6% | 12/12 in 70 s | 12/12 in 63 s | 12/12 in 63 s | 12/12 in 64 s |
| 1/35 from 10 tiles to 60% | 7% | 12/12 in 68 s | 12/12 in 63 s | 12/12 in 63 s | 12/12 in 64 s |

Every crew lands everywhere; a bot steering straight down a lane never
meets a field. The extra density bought nothing measurable, so the thinner
sea was kept. What the bots cannot show is a crew that strays: the fields
are still there for them, and a holed hull still needs a hand on the patch
and one on the pump. That is for the crit 10 pod.

## The numbers, 14 October

`MAX_SPEED` 1.2, `SAIL_RISE` 0.25, `SAIL_LOOSEN` 0.05, `TURN_RATE` 0.8,
`REEF_DAMAGE` 15, `LEAK_PER_DAMAGE` 0.07, `LEAK_CAP` 40, `REPAIR_RATE`
20, `PUMP_RATE` 3, `REEF_FROM` 10, `REEF_SLOPE` 50, `REEF_MAX` 0.5,
`REEF_CLUMP` 1, `HELM_DRIFT` 0.1. Twelve runs per cell, 220 game-seconds
each, at five times real time, on a quiet machine:

| crew | target | landed | wrecked | timed out | median landing (s) | mean furthest (tiles) |
|---|---|---|---|---|---|---|
| 1 | near | 100% | 0% | 0% | 19 | 20 |
| 1 | middle | 100% | 0% | 0% | 38 | 42 |
| 1 | far | 100% | 0% | 0% | 70 | 70 |
| 2 | near | 100% | 0% | 0% | 18 | 19 |
| 2 | middle | 100% | 0% | 0% | 37 | 42 |
| 2 | far | 100% | 0% | 0% | 63 | 70 |
| 3 | near | 100% | 0% | 0% | 18 | 20 |
| 3 | middle | 100% | 0% | 0% | 37 | 42 |
| 3 | far | 100% | 0% | 0% | 63 | 69 |
| 4 | near | 100% | 0% | 0% | 19 | 20 |
| 4 | middle | 100% | 0% | 0% | 38 | 42 |
| 4 | far | 100% | 0% | 0% | 64 | 70 |

Alone, the far island takes seven seconds longer than with a crew, which
is the running between stations. These are bots that never stray and
never patch; the measurement that matters now is people.
