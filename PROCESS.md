# Process overview

This is the short account, rewritten at each crit. The long one, day by
day with every commit, what was thrown away and how each result was
checked, is [`docs/process-log.md`](docs/process-log.md).

## What I built

Earshot is a harbour with one berth, seen over the shoulder of a block
bird with a name you can change. The ship at the pier has four stations,
sail, helm, chart table and pump; a body works one at a time by standing
on it, and every station stops when it is left. An unheld helm wanders,
rocks thicken on the way out and hole the deck where they strike, and the
chart table is the only map, so how far a ship gets is a record of how many
people were aboard together. Every landing flies a flag with the crew's
names, every wreck is a line on the board, and the server logs who did
what. `README.md` says what good means here. This file is how it got that
way.

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
The weekend after brought the block view, three-point hulls, typed names,
the harbour board, notes, gestures and six decision records, each as a red
commit and a green one
([`a00c0be`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/a00c0be)
to [`b6cb1ef`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/b6cb1ef)).

## Measured, not promised

The numbers were tuned by simulated crews of one to four bots
([`b5d7677`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/b5d7677)).
The first sweep said the problem was rules, not numbers: a helm that held
itself made the third body idle, and reefs spread evenly gave a navigator
nothing to find
([`0f828aa`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/0f828aa)).
The simulator had four faults of its own, the last a server left running
after every run until 398 of them had the machine at a load of 200, which
had quietly bent every table before it
([`b845fd9`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/b845fd9),
[`1fab797`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/1fab797)).
A phone session then found the sea mostly rock and a holed ship past
saving, so the hull is holed where it struck and a body standing there
patches it
([`f6f7488`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/f6f7488)
red,
[`20413e3`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/20413e3)),
and the live log of my own sinking showed the reef still tearing a stopped
hull, so a still ship takes no more
([`3d2bf04`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/3d2bf04)
red,
[`9a274f7`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/9a274f7)).
The reefs were thinned three times in a week, measured each time: to a
sea so open that bots of any size landed everywhere
([`7eb0313`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/7eb0313)),
then to a scatter that thickens on the way out and nothing within thirty
tiles of the pier
([`0b91d33`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/0b91d33),
[`45fc95a`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/45fc95a)).
Now the near and middle islands are reached by everyone and the far island
alone three times in four, with anyone else aboard every time; the bots
never patch, so a careful person alone does better. `docs/tuning.md` has
the seven sweeps.

## Read by strangers

Assignment 2 came back with the same comment as assignment 1, that the
marker could not tell what it was about, so before touching the app again
an agent with no context read the first screen cold: it could infer a
sailing game but no page said game, online, or that other people were here.
The card and the README now open with a plain sentence
([`f87d651`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/f87d651),
[`2cb79bc`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/2cb79bc)).
Then three agents played it cold, a laptop alone, a phone, two friends.
They scored "what is this" four of five and could not say what counted as
success: nobody saw their own landing, a sinking vanished into a new hull,
and a click on a station sign stopped a step short. Those became flags on
the islands, a sinking that stays on screen, ships with names, station
snapping, fixed buttons and a board that reads as news
([`7429834`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/7429834),
[`4e62725`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/4e62725),
[`3655dd7`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/3655dd7),
[`729c7c8`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/729c7c8)).
The crew-only channel went, because the players could not tell it from
the open one
([`ed65651`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/ed65651)
red,
[`8c35c89`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/8c35c89)).

## Who may do what

Three berths refilling in five seconds had filled the pier with drifted,
half-boarded hulls. Now there is one berth, a countdown over everyone
waiting, and a ship left empty away from it is scuttled
([`a0262da`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/a0262da)
red,
[`ef82d9f`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/ef82d9f)).
A jump that boarded, landed on islands and left ships lived four days and
went, after a Space press put me in the sea by accident; the pier is the
only way on or off
([`682c79f`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/682c79f)
red,
[`66f786e`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/66f786e)).
Every one of these is decided on the server: who holds a station, who
hears a word, who is sent the chart, who may take up a note, and the log
names each act and each refusal by name and public id
([`f1f1dac`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/f1f1dac)
red,
[`bb48b3d`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/bb48b3d)).
When the flags needed island positions, putting them in `hello` turned a
test red, because the chart rule says nobody is sent the map but the body
at the table; they travel with `near` instead, only within sight
([`fd3a03b`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/fd3a03b)).

## How I directed it

`CLAUDE.md` is the README as rules, each with a date. Every claim went in
as a failing test and was broken once to see it fail (`docs/red-runs.md`).
Agents read, reviewed and played with narrow briefs and no context; I
decided, and I have reversed myself in public three times this week, on
the reefs, the jump and the channel, each time from something watched or
measured rather than felt.

## Stack

One Node process steps the ships twenty times a second from who holds
which station, one WebSocket per visitor carries intent up and small state
down, three.js draws it. A framework would share the state the server has
to own. The costs: hand-written routing, an experimental `node:sqlite`,
two megabytes of vendored three.js, tests that start their own server.

## Thin spots

The commits of 10 and 11 October were cut from one tree at the end of each
evening; since then each change is its own pair. The ladder is bots; the
crit 10 pod is the first crew of strangers. The agent wrote most of the
code and drafted this file; I decided what to build, what to cut, and what
to take back.
