# Earshot

Earshot is a small online game for a room of people: whoever is here right
now crews one of three sailing ships together. One person can do everything
aboard, but only from where they stand, so the more of you aboard, the
further the ship gets. How far it got is kept with the names of who was
aboard.

You play as a small block bird. Stand at a station and hold E: the sail
rises, the helm turns, the pump empties the hull. Every station stops the
moment it is left. One person can sail, badly. Two split the work. Further
out, the reefs thicken and one pair of hands can't keep up.

## What good means here

**What you can do, and what you know, depends on where your body is.** The
sail rises only while someone is at the mast, the helm turns only while
someone is at the wheel, and the map shows only at the chart table. Everyone
else sees 8 tiles of water, which is as far as what you type carries.

The distance rule comes from Big Walk (House House, 2026), where voices fade
as friends drift apart. Its reviews name its fault: no solo mode. My first
version copied that and the crit 8 pod found it, so one person can always
sail here, badly. Erickson and Kellogg (2000) found a limit works when
everyone can see it; the chart rule is the same for everyone. Some of the
class unlock things by headcount
([`docs/cohort-survey.md`](docs/cohort-survey.md)); here the hands a ship
needs grow with distance from the pier, and the server never counts heads
([the decision record](docs/decisions/0001-one-body-one-station.md)).

What holds each claim (`spec/ship.test.ts` unless noted):

1. One body, one station; one holder per station.
2. An unheld sail loosens and the ship slows.
3. Sail and helm held by two bodies keep speed through a turn; one body
   running between them loses it.
4. A reef under a moving hull holes it where it struck, and a ship lying
   still takes no more; a body standing on the hole patches it; open holes
   take water, a held pump empties it, and at full water the ship sinks.
5. A sinking puts everyone ashore and writes a wreck naming them that
   nothing can change or delete.
6. A ship nobody is aboard keeps running down.
7. Ships move independently and stop short of each other; an empty berth is
   refilled in five seconds.
8. An island's first landing is written once, with the crew; later visits
   are counted.
9. Only a body at the chart table is sent the map.
10. Bubbles and gestures reach 8 tiles; nobody is sent another's cookie; a
    move shows within a second; your bird survives a restart.
    (`spec/walk.test.ts`, `spec/persist.test.ts`, `spec/harbour.test.ts`)
11. A typed name goes on every record after it.
12. Every landing and wreck is a kept line on the harbour board, with crew
    and day.
13. A note left ashore is seen within sight, kept, and taken up only by its
    writer.
14. Shift+Enter aboard speaks to the crew alone; a word nobody heard says
    so. (11–14: `spec/harbour.test.ts`)
15. A jump boards the nearest moored ship, lands you on the island beside
    your ship, or puts you in the sea and home to the pier.

Measured, not promised: with the numbers in `server/params.ts`, simulated
crews of one and two reach the near and middle islands and wreck short of
the far one; three reach the far island a third of the time; four, with
one at the chart table, reach it every time
([`docs/tuning.md`](docs/tuning.md)). The bots never patch a hole; whether
people, who can, match them is for the crit 10 pod.

## Trying it alone

A first-visit card says this, lists the keys and asks your name; ? brings it
back. For a second person, open another window and press "Walk here as a
second person".

## What I didn't build

- Voice: in one room it would feed back, and the room already has voices.
- Accounts, chat history, scores. A cookie brings you back as the same bird;
  the last two minutes you heard stay only on your screen; the board,
  wrecks, plaques and notes are the record, and nothing is ranked.
- Wind, cards on deck, trade.

## Still open

The numbers are tuned by bots, not yet by a pod; the block view has not met
a phone in a real hand.

## Sources

- House House, [Big Walk](https://bigwalk.game/presskit/), 2026.
- Thomas Erickson and Wendy Kellogg, [Social Translucence](https://collablab.northwestern.edu//CollabolabDistro/nucmc/p59-erickson.pdf), ACM TOCHI 7(1), 2000.
- The games I read about and the class's work: [`docs/research.md`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/blob/main/docs/research.md), [`docs/cohort-survey.md`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/blob/main/docs/cohort-survey.md).
