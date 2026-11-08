# Process overview

This is the short account, rewritten at each crit and again for the
deadline. The long one, day by day with every commit, is
[`docs/process-log.md`](docs/process-log.md). Decisions are in
[`docs/decisions/`](docs/decisions/), one record each.

## What I built

A big ship at a jetty with five stations that run only while a body
stands at them, a job for everyone aboard by order of boarding, a word
that reaches your whole ship and nobody ashore, rocks that hole the deck,
and a board that keeps every landing and wreck with names. One rule under
all of it: what you can do and what you know depends on where your body
is. The server decides all of it
([decision 13](docs/decisions/0013-the-server-decides-who-may-do-what.md)).
`README.md`
says what good means here. This file is how it got that way.

## Ideation: from three requirements to a ship

The brief fixed many users, real time and persistence; I wanted a co-op
game. The first version copied Big Walk's shape, a gate two people could open
once
([`8611c0b`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/8611c0b),
shipped for crit 8 at
[`46eedd6`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/46eedd6)).
The crit group opened it and stood around. Two agents read 29 games and
papers and the class's 114 project READMEs
([`6c20b7a`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/6c20b7a),
[`docs/cohort-survey.md`](docs/cohort-survey.md)); both said: make a
second person useful with a rule, and keep a record with names on it.
The design note and the first decision record came before any code
([`5068bf0`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/5068bf0)).

## Planning: the stack

One Node 24 process steps the ships twenty times a second from who holds
which station; one WebSocket per visitor carries intent up and a small
snapshot down; `node:sqlite` holds the records; three.js draws it. The
alternatives were Astro plus a socket server, or React with Socket.io. Against them: one page, one process,
and a server that simulates the ship should own the state, not share it
with a framework; every extra layer is one more place a reef could be
computed on the wrong side. The costs: an experimental SQLite module, two
megabytes of vendored three.js, routing by hand, tests that start their
own server. I would reverse it the day the app needed a second page.

## Implementation: red first

Every claim went in as a failing test, then the code that made it pass, in
separate commits. The eleven ship tests failed 11 of 11 against the gate
server, "no `board` message, no ships in snapshots", and passed on the ship
([`c5b36c4`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/c5b36c4),
[`605d8f0`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/605d8f0)).
Every test since was seen red before its code, and five were broken again on
purpose after it, a rate set to 0 or a rule switched off
([twenty-three runs](docs/red-runs.md)). Where a check stayed green, the
check was wrong and was rewritten before the rule was trusted.

## Measured, not promised

The numbers were tuned by simulated crews of one to four bots. The first sweep said the problem was rules,
not numbers, and two rules changed: an unheld helm wanders, and reefs
come in clumps with lanes
([`0f828aa`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/0f828aa)).
The simulator had faults of its own, a navigator that steered straight
([`b845fd9`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/b845fd9))
and a server left running after every run, 398 of them bending every
table measured that day
([`1fab797`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/1fab797)).
The reefs were thinned three times in a week, measured each time
([`45fc95a`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/45fc95a),
[decision 9](docs/decisions/0009-the-sea-gets-harder.md)); those sweeps
measured a deck that no longer exists, and sweep eight in
`docs/tuning.md` measures the big ship.

## Human checks

Assignment 2 came back with the same comment as assignment 1, that the
marker could not tell what it was about. So an agent with no context read
the first screen and three more played it, and the words changed
([`f87d651`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/f87d651),
[`2cb79bc`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/2cb79bc)).
The two crit sessions were the real tests; the harbour board kept the
record ([the board](docs/testing/harbour-board-2026-11-09.md)). Crit 9
found the sea too hard, and the reefs were thinned that night. Crit 10
found the start unclear, and the tutor asked that everyone aboard should
see what they are for; the card became three short paragraphs and
everyone now gets a job
([`cd5674f`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/cd5674f),
[`808811a`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/808811a),
[decision 10](docs/decisions/0010-a-stranger-has-to-be-able-to-start.md)).
The eight scenarios from the crit 10 whiteboard were run against the live
app with its log lines
([the report](docs/testing/multi-user-test-report.md)).

## The big ship, the last two days

I asked for the ship I had wanted, a big one with places on it; the agent
wrote a four-stage plan and I took stage one on a branch. Four tests went
red, then the server, the client and decision record 8
([`62332a2`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/62332a2),
[`67da561`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/67da561),
[`768913d`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/768913d),
[`4a83b39`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/4a83b39)).
Playing it changed three rules that night. Waking aboard went; the jetty
is where a crew forms
([`80d000f`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/80d000f)
red,
[`2340fc6`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/2340fc6)).
The 8-tile rule went; on a long deck it made the pump deaf to the helm,
and a crew that cannot talk to itself is not a crew
([`5e6829c`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/5e6829c)
red,
[`bf36817`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/bf36817),
[decision 12](docs/decisions/0012-one-channel-per-place.md)). A red line
now leads a first visit to the gangway and to your station
([`a6a488e`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/a6a488e)).
Four AI testers played it for twenty minutes; thirteen faults were fixed
that night, six are listed open
([the report](docs/testing/playtest-2026-11-09.md),
[`f7613d1`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/f7613d1)),
and the deck was cut to 14 by 6
([`88e03fe`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/88e03fe)).

## What was thrown away

Three berths became one
([`ef82d9f`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/ef82d9f)).
A jump that boarded ships and islands lived four days and went after it
put me in the sea
([`66f786e`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/66f786e)).
The crew-only channel went because players could not tell it from the open
one
([`8c35c89`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/8c35c89)).
The project's first name, Earshot, went with the 8-tile rule it named
([`9e759af`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/9e759af)).
Coins for a landing I wanted and did not build
([decision 11](docs/decisions/0011-no-reward-for-landing.md)).

## Workflow: the harness, the agents, two conversations

The harness, every file and command the agent must obey or that catches
it, is listed in [`docs/harness.md`](docs/harness.md). Agents, on Claude
Code with Opus and then Fable, got narrow briefs and no history: readers,
cold readers and cold players, reviewers playing a marker or a tutor,
a code reviewer, play-testers, markers of this file. The Superpowers set
was used once, for the code review that found two crashes, red first
([`272f7b2`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/272f7b2)),
and otherwise left off as too heavy. Humanizer read every page of words
before it shipped, because an agent's prose is hard for people to read.

The project ran as two conversations. The main one changed code. A
second one, forked from it, kept the words: when the main one landed a piece of work it sent the fork a
message, and the fork brought that week's `PROCESS.md` and the long log up
to date. On the last two days they ran side by side, the big ship on its
branch in one and the README on `main` in the other, and met at the merge
([`f0c3f61`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/f0c3f61)).
Playwright ran at both viewports before UI changes, borrowed from the
assignment 2 repo rather than installed here. Every call was mine. The agent was wrong in ways only the checks
caught: the first nudge test matched the boarding toast, not the nudge,
and was tightened in the server commit
([`9dcd406`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/9dcd406));
the navigator bug above hid for two sweeps. The thirteen decision
records each list the options and what each costs; the README was
rewritten on the last weekend from my own account of what good means,
spoken aloud and written down with me
([`93906af`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/93906af)).

## Thin spots

The commits of 10 and 11 October were made in batches at the end of each
evening, and on 8 and 9 November several commits bundled spec, code and
docs in one; the red evidence is in `docs/red-runs.md`. The agent wrote
nearly all the code and drafted every document, this one included; every
commit carries its name. I decided what to build, what to cut, and what
to take back. The numbers were tuned by bots, and bots never patch. The
big ship
is a day old: its ladder is one sweep, and the far-island number in the
README is from the old deck. Only classmates have sailed it; nobody from
outside the course has.
