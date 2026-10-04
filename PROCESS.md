# Process overview

## What I built

Earshot, a top-down island where each visitor is a dot with a bird's name and
anything you say reaches only people within 8 tiles. The first puzzle needs
two people: one on a plate that shows a code, one at a keypad 21 tiles away.
`README.md` says what good means here; this file is how it got that way.

## Choosing it

My first ideas were a sign-up list, a bill splitter and a shared harp, and I
dropped them as too simple. Avatar games came next, then I asked for
something like Big Walk, where distance limits what you can tell people.
Before building I had agents visit every classmate's deployed app. The
course's six crit agents had all built a wall that only grows, and 14 of 32
READMEs cited Robin Sloan's essay on an app as a home-cooked meal. Nobody
limited what you know by where you stand, so I built that. Sloan is about
who an app is for. Shirky fits Earshot better: it leans on the people
already in the room.

## How I got here

The spike came first and went in as one commit
([`8611c0b`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/8611c0b)).
Before that I deployed it and ran 30 simulated walkers against the real
machine ([`docs/load-test.md`](docs/load-test.md)). On my laptop 95% of
inputs came back within 99 ms; on Fly, within 1.26 s. Every snapshot resent
every name and colour ten times a second. With five walkers the tail was
gone, so it grew with the crowd, not the network. Names now travel once, and
the same run on Fly gave 146 ms.

The rule the whole idea rests on wasn't doing anything. The plate was 5
tiles from the keypad, so two people could pass the code standing still. I
wrote that as a test
([`005acf3`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/005acf3)),
watched it fail, then moved the plate
([`4b6c35b`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/4b6c35b)).
That showed the dividing wall started at row 3, so you could walk round the
gate: failing test
([`111f6d5`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/111f6d5)),
then the fix
([`b25cf7c`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/b25cf7c)).

A gate that opens once leaves nothing for the next visitor, and the marker
comes the next day. It now locks again each day with a new code, and who
opened it stays in a table the database won't let anyone edit: tests
([`9eede68`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/9eede68)),
then code
([`37f7b43`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/37f7b43)).

## How I knew

I broke three rules on purpose. Sending bubbles to everyone and sending the
code to everyone each turned a named test red. Letting the plate-holder type
the code did not, and still doesn't: the holder is 21 tiles from the keypad,
so the server turns them away for distance before it asks who they are. The
test now names that notice
([`0ceebd0`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/0ceebd0)).
The real guard is the database refusing one person in both roles, and the
last gate test checks that directly.

A review of these files against the code found the short id everyone saw
was the first 8 characters of their cookie, and that a widened range still
passed the earshot test. Both are tests first now
([`d22176d`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/d22176d)),
then fixed
([`641fea6`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/641fea6)).
Fresh random birds in those tests also turned up two visitors with the same
name. A keyboard-only pass in a real browser found Enter submitted the empty
text box
([`a5e37b8`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/a5e37b8)).

## How I directed it

`CLAUDE.md` is the README turned into rules, and four of them came from this
week's mistakes. The gate test that passed by skipping, because an earlier
run had opened the gate, became "a test that needs a shut gate starts its
own server"
([`714b094`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/714b094)).
The keypad check that stayed green became "break the rule once and watch the
test go red". The empty Enter became "Enter and E must move focus without
submitting anything". The cookie prefix became "never send any part of a
cookie".

## Stack

Moves go up and positions come down ten times a second, so one WebSocket
beats server-sent events plus a POST for every key. The idea needs the
server to decide who hears what, so one Node process holds the world, steps
it twenty times a second and the page only draws. The Astro starter from
crit 7 has no place for that loop. The costs: hand-written routing, a
`node:sqlite` that is still experimental in Node 24 and prints a warning,
and gate and restart tests that each start a server of their own.

## Thin spots

The map is a placeholder with one puzzle and nothing behind the gate. The
spike sat uncommitted while I deployed and load-tested it, so the snapshot
fix has no commit of its own, and the rest landed in one morning. CI hasn't
run yet because the repo is private until the cutoff. The agent wrote most
of the code and drafted this file. I decided what to build and what to cut.
