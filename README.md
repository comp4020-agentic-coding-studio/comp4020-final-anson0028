# Earshot

Two people are on a small island. One stands on a plate in the north-west
corner and sees a three-digit number. The other stands at the keypad by the
gate, 21 tiles away, and sees nothing. Anything you type carries 8 tiles.
Somebody has to walk the code over, pass it down a chain of people, or shout.

Each visitor is a coloured dot with a bird's name. You move with the arrow
keys, WASD, a click or a tap, and say up to 40 characters to whoever is
near.

## What good means here

**Where you stand decides what you know and who you can tell.** I took that
from Big Walk (House House, 2026), a co-op game for two to twelve players
where voices fade with distance and sometimes you find yourself speechless.
I kept the idea and left out the voice.

I also looked at what the class was building. The six course agents all
built a wall that only grows. A chat room is the other easy answer: everyone
hears everything, and where you stand changes nothing. Earshot argues
against both.

It is made for one room, like a class crit or the showcase. People there
will shout the code across, and that still counts: they have to talk to get
it over. Clay Shirky calls this software that leans on the group already in
the room.

What holds each claim:

1. A bubble reaches only people within 8 tiles. The server never sends it
   further, so nobody else's browser ever has it. (`spec/walk.test.ts`)
2. The plate's code goes only to whoever stands on it.
   (`spec/gate.test.ts`)
3. The plate is out of earshot of the keypad, and the shut gate is the only
   way across. (`spec/walk.test.ts`)
4. The gate opens only when one person types the code while someone else
   holds the plate. The database also refuses a record where one person did
   both. (`spec/gate.test.ts`)
5. The gate locks again each day with a new code. Who opened it, and with
   whom, is kept in a record the database won't let anyone change, and
   newcomers see the last five. (`spec/gate.test.ts`)
6. Nobody is sent another person's cookie, or any part of it.
   (`spec/walk.test.ts`)
7. A move shows up in another window within a second, and your bird and
   where it stood survive a restart. (`spec/walk.test.ts`,
   `spec/persist.test.ts`)

Not tested: the switch at Canberra midnight while the server is running (the
test restarts it on the next day), and delay under load, measured once in
[`docs/load-test.md`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/blob/main/docs/load-test.md).

Judged: whether carrying the code feels like a puzzle, and whether the
island reads on a phone. The puzzle was walked in a browser at 1920 × 1080
with a resize halfway, at 390 × 844 by tapping, and by keyboard only. I
can't judge the puzzle alone, since I already know the code. My crit 8 pod
is the first real test.

## Trying it alone

Open the island in two windows. The second says "You're already on the
island in another tab." Press "Walk here as a second person".

## What I didn't build

- Voice. Big Walk is built on it, but in one room it would feed back, and
  the room already has voices.
- Accounts. A cookie brings you back as the same bird.
- A chat history. A bubble lasts four seconds and is never stored.

## Still open

Behind the gate there is nothing yet, so once it is open the island is only
walking and talking. Fog the class uncovers together, signposts and more
puzzles would fill it. None of them exist.

## Sources

- House House, [Big Walk](https://bigwalk.game/presskit/), 2026.
- Clay Shirky, [Situated Software](http://shirky.com/essays/situated-software/), 2004.
