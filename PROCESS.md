# Process overview

## What I built

Earshot is a harbour with three berths, seen over the shoulder of a block
bird with a name you can change. A ship has four stations, sail, helm, chart
table and pump, and a body holds one at a time by standing on it. Every
station runs down when it is left, an unheld helm wanders, reefs thicken
into fields with lanes further out, and the chart table is the only map, so
how far a ship gets is a record of how many people were aboard together.
Every landing, wreck and note is kept with names, and the server logs who
did what. `README.md` says what good means here. This file is how it got
that way.

## From the gate to the ship

Crit 8 shipped a gate two people could open once
([`46eedd6`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/46eedd6)).
The pod opened it and stood around; alone, I could only walk. The tutor
said a borrowed idea needs its own variation. Agents read 29 games and
papers and the class's 114 READMEs
([`6c20b7a`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/6c20b7a)),
and both said the strong designs make a second person necessary with a
rule and keep an artefact that is the attributed record. The design note
and the first decision record came before any code
([`5068bf0`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/5068bf0)),
and I corrected them: blocks over the shoulder, ships always at the pier,
one person always able to sail. Eleven tests went in red
([`c5b36c4`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/c5b36c4)),
the server made them green
([`605d8f0`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/605d8f0)),
and crit 9 shipped top-down
([`f8dfc80`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/f8dfc80)).

## The weekend

The block view, the hull as three points, berths that refill, typed names
and the harbour board came the next evening in one red commit and three
green ones
([`a00c0be`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/a00c0be),
[`a201e65`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/a201e65),
[`6586fcd`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/6586fcd)).
Then I had it played: two scripted sessions, a keyboard and a phone,
reached all three islands in seventy seconds without touching the pump.
Then three agents read it with narrow briefs: a marker with the brief
open, the tutor who marked my first two assignments, and a classmate
playing cold. The marker showed three ships abandoned intact at sea left
the harbour empty for good, so berths refill
([`a201e65`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/a201e65)).
The tutor found the fault my first two assignments had, the point not on
the first screen, so the first paragraph and the first-visit card now carry
one sentence. The player could not find the helm on a phone, was told
"Aground" at the edge of the chart, and read their own sinking as news
about someone else. Those became one small commit each over the next day
([`40c9d1c`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/40c9d1c)
red, [`662499b`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/662499b)
green, [`8327c0b`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/8327c0b),
[`df59caf`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/df59caf)),
along with notes on the ground, crew-only talk and four gestures borrowed
from a classmate's campus
([`59df9e0`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/59df9e0)
red, [`3b901bf`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/3b901bf)
green), and six decision records
([`57fa83b`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/57fa83b)
to [`b6cb1ef`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/b6cb1ef)).

## Measured, not promised

The numbers were tuned by simulated crews
([`b5d7677`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/b5d7677)),
one to four bots per ship, twelve runs per island, at five times real time.
The first sweep showed the problem was not the numbers: with a heading that
held itself, two people were as good as three, and with reefs spread evenly
a navigator had nothing to find. Two rules changed, a helm that wanders
when unheld and reefs in clumps with lanes
([`0f828aa`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/0f828aa)),
and the ladder appeared: one reaches the near island, two the middle one
half the time, three the middle always and the far a third of the time,
four the far island every time. The simulator had three faults of its own
along the way, a sunk ship counted as a timeout, a path search that never
found a route, a route out of the harbour through the next berth; they are
in `docs/tuning.md`
([`b845fd9`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/b845fd9)).
Thirty simulated walkers against Fly, on this build, answer within 92 ms at
the 95th percentile with 102 MB in use (`docs/load-test.md`).

On the Monday the sea read as mostly rock from a phone and a holed ship
sank with nothing to be done, so a reef now holes the deck where it
struck and a body standing there patches it
([`f6f7488`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/f6f7488)
red, [`20413e3`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/20413e3),
[`a2e7799`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/a2e7799)),
and the reefs are thinner
([`0e43732`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/0e43732)).
The live log of one sinking showed a hull still being torn while the ship
lay stopped on the reef, so a still ship takes no more and patching shows
its progress
([`3d2bf04`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/3d2bf04)
red, [`9a274f7`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/9a274f7),
[`6eb7c63`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/6eb7c63)).
The same afternoon found the simulator's fourth fault: a server left
running after every landed or wrecked run, 398 of them by the time the
load average said so
([`1fab797`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/1fab797)).
The shipped numbers re-measured the same on a quiet machine; the thinner
sea is in `docs/tuning.md`.

## Who did what

For crit 10 the server logs one line per act, `name#id did what`, with
every refusal: a second tab, a station someone else holds, a note that
isn't yours. The test reads the server's stdout
([`f1f1dac`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/f1f1dac)
red, [`bb48b3d`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/bb48b3d)
green). Positions and inputs are not logged; `flyctl logs` reads like a
ship's log.

## How I directed it

`CLAUDE.md` is the README as rules, and each new rule has a date. "Never
gate play on a headcount" is the first decision record. "Numbers change by
simulation, and the spec pins its own" came from the tuning. "Never widen
earshot" came from deciding against a harbour-wide channel. "A new act gets
a log line in the same commit" came from crit 10's brief. The three reviews
were agents told whose eyes to use and to find what I had missed; their
reports changed the README's first paragraph, the berth rule and a dozen
smaller things, and the design note records what was borrowed and from
whom.

## Stack

Unchanged from crit 8, and the case for it grew: one Node process steps the
ships twenty times a second from who holds which station, one WebSocket per
visitor carries intent up and small state down, and three.js in the browser
draws it. The costs: hand-written routing, an experimental `node:sqlite`,
two megabytes of vendored three.js, and tests that start their own server.

## Thin spots

Both evenings' commits were cut from one working tree at the end, and the
weekend's are small but still mine to cut; the red runs are recorded in
`docs/red-runs.md` rather than one pair per claim. The ladder is bots; a
crew of strangers has not sailed it yet, and the block view has met one
phone in a real hand, mine. The fleet can grow to twelve ships left at sea.
The agent wrote most of the code and drafted this file; I decided what to
build, what to cut, and what to correct.
