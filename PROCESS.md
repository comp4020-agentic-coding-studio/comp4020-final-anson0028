# Process overview

## What I built

Earshot is a harbour with three berths, seen over the shoulder of a block
bird with a name you can change. A ship has four stations, sail, helm, chart
table and pump, and a body holds one at a time by standing on it. Every
station runs down when it is left, reefs flood the hull, and the sea gets
harder further out, so how far a ship gets is a record of how many people
were aboard together. `README.md` says what good means here. This file is
how it got that way.

## Where crit 8 left it

Crit 8 shipped a gate: one person on a plate 21 tiles from a keypad reads a
code, another types it
([`46eedd6`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/46eedd6)).
It worked, and it had nothing after it. The pod opened the gate once and
stood around. Alone, I could only walk. The tutor said a borrowed idea needs
its own variation, and to work out what is good and bad in games like it.

## Choosing again

Before changing anything I had agents read 29 games and papers in five
clusters, each for how it works, what is good and what is bad, and a sixth
agent fetch every source they cited and check the claims. One source didn't
load and several claims were corrected; the notes mark both
([`docs/research.md`](docs/research.md)). A second pass read the 114
final-project READMEs in the class
([`docs/cohort-survey.md`](docs/cohort-survey.md)). Both came out the same
way: the strong designs make a second person necessary with a rule, not a
hope, and keep an artefact that is itself the attributed record. Big Walk's
reviews name its fault as no solo mode, and my gate had copied it.

So the design was written before any code
([`6c20b7a`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/6c20b7a),
[`5068bf0`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/5068bf0))
and I corrected it: blocks over the bird's shoulder with the chart as the
only map, ships always at the pier, one person always able to sail. The
[decision record](docs/decisions/0001-one-body-one-station.md) picks "one
person can do everything, but only from where they stand" over
two-or-nothing, because it needs no counting of people and can't be beaten
with a second tab.

## Red, then green

The eleven ship tests went in first
([`c5b36c4`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/c5b36c4)).
Against the crit 8 server they fail 11 of 11. The server that passes them is
the next commit
([`605d8f0`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/605d8f0)),
which also dropped crit 8's `openings` table, the one crit 8's CLAUDE.md
said never to delete; the wrecks and landings that replaced it carry the
same triggers. Then the client
([`e72c8a4`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/e72c8a4))
and the README
([`c8280f3`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/c8280f3)).
Three of the tests were wrong before the code was: a sailing ship can't be
boarded, the walker's snapshot helper threw away the toast it was waiting
for, and two sailing checks compared one measured speed.

The next evening went the same way in bigger batches. Five new claims went
in as one spec commit
([`a00c0be`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/a00c0be)):
the helm turns on the port/starboard part of its holder's input, a ship
stops short of another, an empty berth is refilled, a typed name goes on
every record, every landing and wreck is a line on the harbour board. Each
failed against the server before it; the runs are in
[`docs/red-runs.md`](docs/red-runs.md). three.js came in on its own
([`f5c28f6`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/f5c28f6)),
then the server
([`a201e65`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/a201e65)),
then the block view, the first-visit card and the board
([`6586fcd`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/6586fcd)).

## How I knew

I broke four rules on purpose: stations never released, a sail that never
loosens, the chart sent to everyone aboard, a wreck naming only the first
person. Each turned its named test red. A headless browser boards, walks to
a station, raises the sail and turns the helm at 1920 wide with a mouse, at
390 wide by touch and with the keyboard only, after every client change.

Then I had the game played. Two scripted sessions, a keyboard and a phone,
reached all three islands in seventy seconds without touching the pump, and
a lone sailor reached the near island in ten, so the numbers are untuned and
say so. The same sessions found the ship ramming the island after the
landing toast with no word on screen, which is why a hull is now three
points that stop at the shore and the crew are told why. Then three agents
read it with narrow briefs, a marker with the brief open, the tutor who
marked my first two assignments, and a classmate playing cold. The marker
showed three ships abandoned intact at sea leave the harbour empty for good,
so berths refill themselves. The tutor found the fault my first two
assignments had, the point not on the first screen, which the first
paragraph and the card now carry. The player could not find the helm on a
phone and wrecked on the first sail; those are next. Thirty simulated
walkers on my laptop answer within 104 ms, and crit 8 showed a laptop number
is not evidence for Fly; that run is owed.

## How I directed it

`CLAUDE.md` is the README as rules. "Never gate play on a headcount" is the
decision record as a rule. "Tuning numbers live in `server/params.ts` and
change by simulation" exists because the first draft had them scattered and
guessed. "Break the rule once and watch the test go red" stays from crit 8.
The design note and the decision record are where I corrected the agent:
the view, the pier, solo play, then free names and a board that ranks
nothing. The three reviews were agents too, each told whose eyes to use and
to find what I had missed, not to agree with me.

## Stack

Unchanged from crit 8, and the case for it grew. The ship is stepped twenty
times a second on the server from who holds which station, so one Node
process owning the world and one WebSocket per visitor is still the shape.
The block view is the browser's job; the server sends the same small state.
The costs remain: hand-written routing, an experimental `node:sqlite`, tests
that start their own server, and now two megabytes of three.js in the repo.

## Thin spots

The numbers are untuned, so the ladder in the design note is a claim until
the bots run. Nobody but me, scripts and one phone in a real hand has
driven the block view. Both evenings' commits were cut from one working
tree at the end, so the pairs are not one per claim; the red runs are
recorded instead. The research notes are the agents' reports in their own
words, checked but not rewritten. The agent wrote most of the code and
drafted this file; I decided what to build, what to cut, and what to
correct.
