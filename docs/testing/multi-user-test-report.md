# Multi-user test against the live app, 9 November 2026

The scenarios are the ones on the week 11 whiteboard. They were run at
01:53 Canberra time on 9 November against
https://comp4020-final-anson0028.fly.dev at commit `a7d3e63`, two
minutes after CI deployed it, with three scripted players (Playwright,
headless Chromium, one browser context each, named QA live 1, 2 and 3 on
the card). The log lines below are from `flyctl logs` on the one Fly
machine (`84ed7e2f4e0238`, syd); the server logs one line per act, and
nothing in the browsers was trusted that the log did not also say. The
players are scripts, not people.

`/health` before: 0 clients, 1 ship, 11 wrecks, 2 landings, RSS 102 MB,
tick p95 0.11 ms. After: 3 clients, RSS 107 MB, tick p95 0.71 ms.

## a) Two users join

Expected: each arrives on the jetty, is told apart by id and name, and
sees the other in the next snapshot.

Observed: both arrived within three seconds and the first saw the
second's public id in its snapshot at once.

    14:53:08.476Z late swift#f448d243 arrives on the jetty at (11.8, 30.6); 1 here
    14:53:10.047Z late swift#f448d243 is now called QA live 1
    14:53:11.296Z late swift#c81ad212 arrives on the jetty at (11.8, 31.2); 2 here

## b) One user's action reaches the relevant users

Expected: a move shows in the other browser within a second; a word
said aboard reaches everyone aboard and nobody ashore.

Observed: QA live 2 held a direction and QA live 1's snapshots showed
the new position after 228 ms. Aboard, QA live 1 said "hello from the
helm"; QA live 2, aboard, had it in the heard list within 600 ms; QA
live 3, on the jetty, had nothing.

    14:53:21.846Z QA live 1#f448d243 says: "hello from the helm" (heard by QA live 2#c81ad212 aboard ship 26)

## c) Simultaneous action within the same second

Expected: two boards in the same second both succeed onto the one ship;
two grabs of the same station in the same second give it to one body
and refuse the other, with the refusal in the log.

Observed: both E presses were sent in the same call; both boarded ship
26 within 23 ms of each other. Both then held E on the helm tile in the
same call; the server gave the helm to QA live 2 and refused QA live 1.

    14:53:17.705Z QA live 2#c81ad212 boards ship 26 (Tern 3) by the gangway; 1 aboard; job: all
    14:53:17.728Z QA live 1#f448d243 boards ship 26 (Tern 3) by the gangway; 2 aboard; job: helm
    14:53:20.625Z QA live 2#c81ad212 takes the helm of ship 26
    14:53:20.629Z QA live 1#f448d243 is refused the helm of ship 26: QA live 2#c81ad212 holds it

## d) A late user joins

Expected: the newcomer sees everyone already here and, on boarding,
gets the next job in order.

Observed: QA live 3 arrived to a snapshot with three birds and the ship's
jobs `sail, helm` for the two aboard; after boarding, its job was `chart`,
the third in order.

    14:53:22.931Z quiet wren#ec0f5916 arrives on the jetty at (12.3, 30.6); 3 here
    14:53:33.399Z QA live 3#ec0f5916 boards ship 26 (Tern 3) by the gangway; 3 aboard; job: chart

## e) Leave and return

Expected: closing the tab while aboard and reopening it within two
minutes puts the body back on the same ship at the same deck spot, and
the log says so.

Observed: QA live 2's page was closed at deck (-4.5, 0.5) on ship 26 and
reopened two seconds later; the first snapshot in the new page had it on
ship 26 at (-4.5, 0.5).

    14:53:33.979Z QA live 2#c81ad212 leaves from ship 26; 2 here
    14:53:36.403Z QA live 2#c81ad212 comes back aboard ship 26 after a dropped connection; 3 here

## f) Isolated room joins

There are no rooms: one harbour, one berth, one ship at a time. What is
isolated is the place you stand in (decision record 12): a word aboard
reaches the deck and not the jetty, a word on the jetty reaches the
jetty and not the deck. QA live 3 said "anyone on the pier?" alone on
the jetty and was told nobody heard.

    14:53:29.934Z QA live 3#ec0f5916 says: "anyone on the pier?" (heard by nobody, ashore)

## g) Scale machines until two users land on different machines

Not done, on purpose. The app is one Node process with one `node:sqlite`
file on one Fly volume (`fly.toml`, `CLAUDE.md` "Facts about the stack");
a second machine would have its own empty database and its own ships,
and a word said on one would never reach the other. The README says the
app is for a room, not for scale; `fly scale count 2` would make two
harbours that share a URL, which is the failure this design accepts
rather than solves.

## h) Restart the machine mid-session

Expected: the pages say the connection dropped and reconnect on their
own; everyone aboard comes back on the same ship at the same spot; the
board, wrecks and landings are still there.

Observed: with QA live 1 at the helm tile (-4.5, 0.5) and QA live 2 at
the gangway (0.5, -2.5) of ship 26, `flyctl machine restart` was run at
14:58:20 (Anson's say-so, nobody else aboard). `/health` was unreachable
from +5.1 s to +5.7 s after the command; the page showed "The connection
dropped. Reconnecting… you'll be put back aboard your ship."; both were
back on ship 26 at the same deck spots 9.4 s after the command, and
`/health` after showed the same 11 wrecks and 2 landings.

    14:58:21Z Main child exited normally with code: 0
    14:58:25.341Z all hands on deck: listening on 8080 with 1 ships, 11 wrecks, 5 notes
    14:58:27.224Z QA live 1#51e4ce24 comes back aboard ship 26 after a dropped connection; 1 here
    14:58:27.230Z QA live 2#f00eb7ab comes back aboard ship 26 after a dropped connection; 2 here

The same case runs on every CI push against a server of its own
(`spec/ship.test.ts`, "puts you back aboard after the server restarts
under you", red first on `2aebfee`).

## What this did not test

A real person's hands; a phone on a mobile network; more than three
players at once on the live machine (the load runs in
`docs/load-test.md` did thirty bots); and a sinking or a landing on the
live sea, which would have written to the public board.
