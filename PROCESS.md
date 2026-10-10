# Process overview

## What I built

Earshot is a harbour with three ships. Each visitor is a dot with a bird's
name. A ship has four stations, sail, helm, chart table and pump, and a body
holds one at a time by standing on it. Every station runs down when it is
left, reefs flood the hull, and the sea gets harder further out, so how far
a ship gets is a record of how many people were aboard together.
`README.md` says what good means here. This file is how it got that way.

## Where crit 8 left it

Crit 8 shipped a gate: one person on a plate 21 tiles from a keypad reads a
code, another types it
([`46eedd6`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/46eedd6)).
It worked, and it had nothing after it. The pod opened the gate once and
stood around. Alone, I could only walk. The tutor said an idea borrowed from
a game needs its own variation, and that I should work out what is good and
bad in games like it.

## Choosing again

Before changing anything I had agents read 29 games and papers in five
clusters, each for how it works, what is good and what is bad, and a sixth
agent fetch every source they cited and check the claims. One source didn't
load and several claims were corrected; the notes mark both
([`docs/research.md`](docs/research.md)). A second pass read the 114
final-project READMEs in the class
([`docs/cohort-survey.md`](docs/cohort-survey.md)). Both came out the same
way: the strong designs make a second person necessary with a rule, not a
hope, and keep an artefact that is itself the attributed record. Nobody
makes the number of hands a thing needs change with how many are there. Big
Walk's reviews name its fault as no solo mode, and my gate had copied it.

So the design was written before any code
([`6c20b7a`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/6c20b7a),
[`5068bf0`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/5068bf0))
and I corrected it. Three things changed in that round: the view will be
blocks seen over the bird's shoulder, with the chart table as the only map;
ships are always at the pier, not one that respawns; and one person must
always be able to sail. The decision record picks "one person can do
everything, but only from where they stand" over two-or-nothing, because it
needs no counting of people and can't be beaten with a second tab.

## Red, then green

The eleven ship tests went in first
([`c5b36c4`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/c5b36c4)).
Run against the crit 8 server they fail 11 of 11 in 57 seconds. The server
that passes them is the next commit
([`605d8f0`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/605d8f0)):
12 of 12 with the persist test, and the whole spec 19 of 19 once the client
([`e72c8a4`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/e72c8a4))
and the README
([`c8280f3`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/c8280f3))
landed. Three of the tests were wrong before the code was. A sailing ship
can't be boarded, so the stations test has to board the second bird before
the first raises the sail; the walker's snapshot helper cleared its inbox
and threw away the toast the test was waiting for; and the two-bodies and
one-body sailing checks compare one measured speed, so they became two
tests that share it.

## How I knew

I broke four rules on purpose: stations never released, a sail that never
loosens, the chart sent to everyone aboard, a wreck naming only the first
person. Each turned its named test red. In a real browser one window at
1920 raised the sail with the mouse while a 390-wide phone view boarded by
the on-screen button and turned the helm 64 degrees by touch; a
keyboard-only pass boarded and went ashore. That pass found the first bug:
pressing E straight after the page loaded did nothing, because the client
decided whether you were aboard from a snapshot it hadn't received yet. The
boarding range also had to grow from 5 to 7 tiles to reach the moored
ships, and the phone's status line sat on the d-pad. Thirty simulated
walkers on my laptop came back within 104 ms at the 95th percentile with
73 MB of memory; the same run against Fly comes after this deploy.

## How I directed it

`CLAUDE.md` is the README as rules, and the new ones come from this round.
"Never gate play on a headcount" is the decision record as a rule. "Tuning
numbers live in `server/params.ts` and change by simulation" exists because
the first draft had them scattered and guessed. "Break the rule once and
watch the test go red" stays from crit 8, and this time every break went
red, which is what the rule is for. The design note and the decision record
are the course's process made literal: the agent proposed, I corrected, and
the corrections are in the file.

## Stack

Unchanged from crit 8, and the case for it grew. The ship is stepped twenty
times a second on the server from who holds which station, so one Node
process owning the world and one WebSocket per visitor is still the shape.
The block view that comes next is the browser's job; the server sends the
same small state either way. The costs remain: hand-written routing, a
`node:sqlite` that is still experimental, and tests that start their own
server.

## Thin spots

The numbers are untuned, so the ladder in the design note (two for speed,
three for reefs, four for the far island) is a claim until the bots run.
The view is still top-down. Plaques show only on the chart. The research
notes are the agents' reports in their own words, checked but not
rewritten. The agent wrote most of the code and drafted this file; I decided
what to build, what to cut, and what to correct.
