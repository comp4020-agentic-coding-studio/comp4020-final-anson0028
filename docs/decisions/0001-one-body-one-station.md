# 1. One body, one station

Date: 10 October 2026. Status: accepted; built for crit 9.

## Context

The brief asks for one decision about how the app behaves when several
people use it at once. The question here is what a ship needs from its crew:
what one person aboard can do, and what each extra person adds.

Earshot's gate needed exactly two people and gave the rest of the day to
nobody. The research found the same fault in Big Walk (no solo play, and
puzzles sized for four in a lobby of twelve) and in Pico Park (no single
player). It also found the opposite fault: a game that one person can
finish alone makes the others optional.

## Options

1. **Two people or nothing.** The ship moves only while two different people
   hold sail and helm. Cooperation is certain. A stranger who arrives alone
   can only watch, and a crit marker needs two windows for anything to
   happen.
2. **One person can do everything, at no cost.** Any station works from
   anywhere, or one body can hold several. Nobody is ever stuck, and nobody
   is ever needed either. More people only make it faster.
3. **One person can do everything, but only from where they stand.** A body
   holds one station at a time, stations are tiles apart, and every station
   runs down when unheld. One person can sail, slowly and badly. Two split
   the stations. Further out, one pair of hands is not enough.
4. **Everyone votes on heading and sail.** No stations; the ship follows the
   majority. Headcount only changes how long a vote takes.

## Decision

Option 3. It keeps the rule the project started with: what you can do
depends on where your body is. It needs no counting of people on the server,
which is also the only version that can't be gamed with a second tab, since
a second tab is a second body that still has to stand somewhere. It gives a
stranger something to do alone and gives the marker's two windows a visible
difference from one.

## Consequences

- The feel depends on numbers (sail loosen time, station spacing, leak rate
  by distance). They are tuned with headless bots, and the measured results
  go in the README. A wrong number makes solo play either trivial or
  hopeless.
- A lone sailor will wreck often near the harbour. That is intended, and the
  map will show it.
- Tests must drive two and three separate sockets through stations, not one.
- The ladder (2 for speed, 3 for reefs, 4 for the far islands) is a claim
  about the tuning, not a rule in code. If the bots show it doesn't hold,
  the numbers change, not this record.
