# Earshot

Three ships at a pier, and a sea that gets harder the further out you go. Each
visitor is a coloured dot with a bird's name. Stand at a station and hold E: the
sail rises, the helm turns, the pump empties the hull. A body holds one station
at a time, and every station runs down the moment it is left. One person can
sail, slowly and badly. Two split the work. Further out, one pair of hands isn't
enough, and where a ship ends up is a record of how many people were aboard
together.

## What good means here

**What you can do, and what you know, depends on where your body is.** The sail
rises only while someone stands at the mast, the helm turns only while someone
stands at the wheel, and the whole sea is visible only to the body at the chart
table. Everyone else sees the water within 8 tiles, which is also how far what
you type carries.

The distance rule comes from Big Walk (House House, 2026), where voices fade as
friends drift apart. Its reviews name its fault too: no solo mode. My first
version copied that, and the crit 8 pod found it, so one person can always sail
here, the way one cook can run an Overcooked kitchen, badly. The stations come
from crewed ships like Sea of Thieves, without the 3D or the voice. Erickson and
Kellogg (2000) describe a room where sight and sound carried only part way, so
nobody could run it alone.

In the class, the six course agents built walls that only grow, and nobody makes
the number of people a thing needs change with how many are there. That is the
gap.

What holds each claim (`spec/ship.test.ts` unless noted):

1. A body holds one station at a time, and a station has one holder.
2. An unheld sail loosens and the ship slows.
3. Two bodies at sail and helm keep speed through a turn; one body running
   between them loses it.
4. Reefs flood the hull. A held pump empties it. At full water the ship sinks.
5. A sinking puts everyone ashore and writes a wreck naming everyone aboard,
   kept across restarts; the database refuses to change or delete it.
6. A ship nobody is aboard keeps running down.
7. Ships move independently, and the pier launches a new hull after a sinking.
8. The first landing on an island is written once with the crew's names and
   size; later visits are counted.
9. Only a body at the chart table is sent the whole map.
10. A bubble reaches 8 tiles. Nobody is sent another person's cookie. A move
    shows up in another window within a second, and your bird and where it stood
    survive a restart. (`spec/walk.test.ts`, `spec/persist.test.ts`)

Judged, not tested: how far one, two, three and four people get. That rests on
numbers I will tune with simulated crews and report here; until then the ladder
in `docs/the-ship.md` is a target. Also judged: whether sailing alone is a
challenge or a chore. My crit 9 pod is the first test.

## Trying it alone

Open the harbour in two windows. The second says "You're already on the island
in another tab." Press "Walk here as a second person". E near a ship boards it;
hold E at a station; Q puts you ashore.

## What I didn't build

- Voice. Big Walk is built on it, but in one room it would feed back, and the
  room already has voices.
- Accounts, a chat history, scores. A cookie brings you back as the same bird; a
  bubble lasts four seconds; the wrecks and plaques are the record.
- Wind, cards on deck, trade.

## Still open

The view is top-down for now; a block view over your bird's shoulder, with the
chart as the only map, is next. The numbers are untuned. Plaques show only on
the chart.

## Sources

- House House, [Big Walk](https://bigwalk.game/presskit/), 2026.
- Thomas Erickson and Wendy Kellogg, [Social Translucence](https://collablab.northwestern.edu//CollabolabDistro/nucmc/p59-erickson.pdf), ACM TOCHI 7(1), 2000.
- The games I read about and the class's work: [`docs/research.md`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/blob/main/docs/research.md), [`docs/cohort-survey.md`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/blob/main/docs/cohort-survey.md).
