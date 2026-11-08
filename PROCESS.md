# Process overview

This is the short account, rewritten at each crit and again for the
deadline. The long one, day by day with every commit, what was thrown
away and how each result was checked, is
[`docs/process-log.md`](docs/process-log.md).

## What I built

A galleon at a jetty, seen over the shoulder of a block bird with a name
you can change. The jetty is the lobby: you arrive beside the ship and
board when you choose. Five stations
on three levels, helm and chart table on the quarterdeck, mainsail on
the main deck, foresail at the bow, the pump down a ladder in the bilge;
a body works one at a time by standing on it, every station stops when
it is left, and a word carries a ship's length, so the two ends of the
deck cannot hear each other. Rocks hole the deck where they strike, the
chart table is the only map, every landing flies a flag with the crew's
names, every wreck is a line on the board, and the server logs who did
what. `README.md` says what good means here. This file is how it got
that way.

## From the gate to the ship

Crit 8 shipped a gate two people could open once
([`46eedd6`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/46eedd6)).
The pod opened it and stood around. Agents read 29 games and papers and
the class's 114 READMEs
([`6c20b7a`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/6c20b7a));
both said the strong designs make a second person necessary with a rule
and keep an attributed record. The design note and the first decision
record came before any code
([`5068bf0`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/5068bf0)),
eleven tests went in red
([`c5b36c4`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/c5b36c4)),
the server made them green
([`605d8f0`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/605d8f0)),
and crit 9 shipped
([`f8dfc80`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/f8dfc80)).
The weekend after brought the block view, typed names, the harbour board,
notes, gestures and six decision records, each as a red commit and a
green one
([`a00c0be`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/a00c0be)
to [`b6cb1ef`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/b6cb1ef)).

## Measured, not promised

The numbers were tuned by simulated crews
([`b5d7677`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/b5d7677)).
The first sweep said the problem was rules, not numbers: a helm that held
itself made the third body idle, and reefs spread evenly gave a navigator
nothing to find
([`0f828aa`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/0f828aa)).
The simulator had four faults of its own, the last a server left running
after every run until 398 of them had bent every table before it
([`b845fd9`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/b845fd9),
[`1fab797`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/1fab797)).
A phone session found a holed ship past saving, so the hull is holed
where it struck and a body standing there patches it
([`f6f7488`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/f6f7488)
red,
[`20413e3`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/20413e3)),
and the log of my own sinking showed a stopped hull still tearing, so a
still ship takes no more
([`3d2bf04`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/3d2bf04)
red,
[`9a274f7`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/9a274f7)).
The reefs were thinned three times in a week, measured each time
([`7eb0313`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/7eb0313),
[`0b91d33`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/0b91d33),
[`45fc95a`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/45fc95a)).
Those seven sweeps measured a 7 by 4 deck that no longer exists; sweep
eight in `docs/tuning.md` measures the galleon, and the README quotes it
and nothing older.

## Read by strangers

Assignments 1 and 2 came back with the same comment, that the marker
could not tell what it was about, so an agent with no context read the
first screen cold and the card and README were rewritten to open with the
rule
([`f87d651`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/f87d651)).
Three agents then played it cold and could not say what counted as
success; those became flags, a sinking that stays on screen, ships with
names and a board that reads as news
([`7429834`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/7429834),
[`729c7c8`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/729c7c8)).
The crew-only channel went because they could not tell it from the open
one
([`ed65651`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/ed65651)
red,
[`8c35c89`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/8c35c89)).
Six more cold reads of the README took it from 3 to a steady 4 of 5
([`d795967`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/d795967)).
A code review by a fresh agent found two ways to crash the server from a
browser, a request for a directory and a `null` message; both landed as
red tests first
([`spec/robust.test.ts`](spec/robust.test.ts),
[`f03b072`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/f03b072)),
along with a dropped connection that puts you back aboard.

## Who may do what

Three berths had filled the pier with drifted hulls; now there is one,
with a countdown
([`a0262da`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/a0262da)
red,
[`ef82d9f`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/ef82d9f)).
A jump that boarded anywhere lived four days and went
([`682c79f`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/682c79f)
red,
[`66f786e`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/66f786e)).
The tutor asked after crit 10 that a second or third body aboard should
see what it is for, so everyone is given a job by order of boarding, a
label and never a lock
([`6d66973`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/6d66973)
to
[`a812049`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/a812049)).
Everything is decided on the server and the log names each act and each
refusal
([`bb48b3d`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/bb48b3d)).

## The galleon

On the last evening I asked for the ship I had wanted: you arrive
aboard, it is the size of a Sea of Thieves galleon, and it has places.
The spec and a four-stage plan came first; I took the first stage and a
branch. Four new tests went red on the old deck
([`62332a2`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/62332a2)),
the server made them green and moved fourteen old ones whose ships now
sat on the jetty or inside an island
([`67da561`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/67da561)),
the client drew it
([`768913d`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/768913d)),
decision record 8 says why and why not a mess hall and dice
([`4a83b39`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/4a83b39)).
I played it and saw the bow and stern flicker: coplanar faces. The agent
played it after the fix and found a tap on the raised deck landing on the
wrong tile, "12 tiles out" while moored, a near island shorter than the
trip to it, a helm that swung the stern into the jetty, and a mainsail
that walled off the view
([`2424db0`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/2424db0),
[`5de2254`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/5de2254)).

## How I directed it

`CLAUDE.md` is the README as rules. Every claim went in as a failing
test and was broken once to see it fail (`docs/red-runs.md`). Agents
read, reviewed and played with narrow briefs and no context; I decided,
and reversed myself in public on the reefs, the jump, the channel and the
whole deck, each time from something watched or measured rather than
felt.

## Stack

One Node process steps the ships twenty times a second from who holds
which station, one WebSocket per visitor carries intent up and small
state down, three.js draws it. A framework would share the state the
server has to own. The costs: hand-written routing, an experimental
`node:sqlite`, two megabytes of vendored three.js, tests that start their
own server.

## Thin spots

The commits of 10 and 11 October were cut from one tree at the end of
each evening. The ladder is bots; the only strangers who have sailed
were three AI agents and the crit 10 pod. The galleon is a day old and
its numbers are one sweep. The agent wrote most of the code and drafted
this file; I decided what to build, what to cut, and what to take back.
