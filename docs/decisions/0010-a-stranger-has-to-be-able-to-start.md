# 10. A stranger has to be able to start

Date: 8 November 2026, recording a decision made in steps between 14 and 26
October. Status: accepted, with the next step open.

## Context

My first two assignments came back with the same note: the marker could not
tell what the thing was about. The cause was the same both times. The agent
that wrote the page had the whole conversation as context and assumed the
reader did too. The final project is marked from the URL alone, by a marker
who starts at `/readme/` and then opens the harbour with nobody there to
explain it, and the showcase room is full of people who arrive at once and
read nothing.

On 14 October an agent with no context was given the deployed URL and asked
what it was. It scored the first screen 3 of 5: it could infer a sailing
game, but no page said game, online, or that other people were here
([`f87d651`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/f87d651),
[`2cb79bc`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/2cb79bc)).
The same day three agents played it cold, a laptop alone, a phone, and two
friends. All three knew within a minute that it was a co-op sailing game,
and all three missed the same things: nobody could tell they had landed, a
sinking vanished into a fresh ship, and a click on a station sign stopped a
step short
([`7429834`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/7429834),
[`4e62725`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/4e62725),
[`729c7c8`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/729c7c8)).
After crit 10 the tutor asked that a second or third person aboard should
see what they are for.

## Options

1. **No guidance; learn by watching.** Big Walk ships no tutorial and works
   because friends arrive together on voice. A stranger alone at a pier has
   nobody to watch.
2. **A tutorial level.** A scripted first voyage, alone, before the real
   harbour. It would be a solo mode in all but name, it delays the one
   thing the game is for, and a room of forty arriving at once cannot each
   be walked through it.
3. **Three things on the page, and a world that says what happened.** A
   first-screen card that says what the game is in three short paragraphs
   and asks for a name; a station given to you when you board, by order of
   boarding, so there is something to do; and a hint line that says what
   the tile under your feet does. Then the world itself reports: a landing
   plants a flag with the crew's names, a sinking stays on screen until
   you board again, ships have names, and the board reads as news.

## Decision

Option 3, over eight commits from 14 to 26 October. The card went from one
paragraph to three short ones and a line of keys
([`cd5674f`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/cd5674f)),
the header line says what the game is before anything else
([`37440ce`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/37440ce)),
jobs appear over heads and in a crew line, and the ship at the pier says
which job the next body aboard will take
([`808811a`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/808811a),
decision record 7), and a line says the harbour is loading on a slow
connection
([`71099a9`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/71099a9)).
Six cold reads of the card and the README between 14 October and 7
November went from 3 of 5 to a steady 4 of 5 on "what is this", "what do I
do" and "what do others do".

## Consequences

- This is judged, not tested. `spec/a11y.test.ts` checks that the hint,
  the status and the toast are live regions and that every control is
  named; whether a stranger understands the words only a stranger can
  say. The people so far are the crit
  pods of 12 and 19 October; a session with strangers from outside the
  course is still owed.
- The card's storage key changes whenever its words change, so returning
  visitors see the new words once.
- Every word on the first screen is a word the marker reads before the
  README's argument reaches them; the card and the README are kept saying
  the same thing, in the same commit.
- Done on 9 November, after the galleon: a red dashed line from your feet
  to the gangway and then to the station your job names, with a box saying
  what to press
  ([`a6a488e`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/a6a488e)),
  and a line to the nearest hole, or to the pump, when nobody is working
  it
  ([`3c0d92b`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/3c0d92b)).
  Four AI testers that day passed arrival, card, guide and boarding 10 of
  12 (`docs/testing/playtest-2026-11-09.md`).
