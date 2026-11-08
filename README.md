# All Hands on Deck

On this ship you can only work the station you are standing at. The
mainsail rises only while someone holds the mast, the helm turns only
while someone holds the wheel, the map shows only at the chart table,
the pump runs only while someone is down in the bilge, and what you say
is heard by your ship and not ashore. One person can sail, badly,
running the deck. More hands get there faster.

All Hands on Deck is a small online co-op game for a room of people. You
play a block bird on a pier with a galleon tied up beside it; whoever is
online gathers there, boards, and sails. Each of you is told which
station is yours, and how far you get is kept with your names. Further out the
rocks hole the deck, and a hole wants one hand on the patch and one on
the pump.

## What good means here

**What you can do depends on where your body is.** Co-operation comes
from that rule, not from one that counts heads; nothing waits for a
number of players.

The rule began as a distance: after Big Walk (House House, 2026), a word
reached eight tiles, and the project was called Earshot. On this deck
that split the crew, so the rule is now the place: your ship hears you,
the shore does not
([decision record 9](docs/decisions/0009-one-channel-per-place.md)).
Erickson and Kellogg (2000) found a limit works when everyone can see
it; the chart rule is the same for everyone, and each station is written
above its holder's head. Other projects in this course unlock
features once enough players are present
([survey](docs/cohort-survey.md)); here nothing unlocks ([decision
records 1](docs/decisions/0001-one-body-one-station.md) and
[8](docs/decisions/0008-the-galleon.md)).

## How the rule is checked

Tested, by checks that drive a running server, nineteen claims
([the full list](docs/claims.md)), among them: one body holds one
station; only the body at the chart table is sent the map; a word
reaches your ship and not the jetty beside it; no wreck or landing can
be changed or deleted; everyone aboard gets a job.

Measured, by simulated crews of one to five bots
([how](docs/tuning.md)): every crew reaches the nearer islands in about
fifty seconds. To the far island, one to four bots take two
minutes and a lone bot ran out of time twice in twelve; a fifth hand on
the foresail makes it in seventy-five seconds. Bots never patch a hole;
people can.

Judged, by watching it played from the link alone. On the smaller deck
before this one, three AI agents told nothing knew within a minute what
it was, and all missed the same thing: nobody could tell they had reached an island, and a
sinking vanished into a fresh ship. Islands now
fly a flag with the crew's names, and a sinking stays on screen. A
reviewer asked that a second person aboard see what they are for, so
everyone gets a job. The galleon is a day old; only I and one
agent have sailed it ([what changed](PROCESS.md)).

## What I didn't build

- Voice: in one room it would feed back.
- Accounts, chat history, scores. The board lists crews by time, not by
  points; the wrecks, flags and notes are the record.
- Locked stations: a crew that loses its helmsman must still steer.
- A mess hall and a dice table ([why not](docs/decisions/0008-the-galleon.md)).

## Sources

- House House, [Big Walk](https://bigwalk.game/presskit/), 2026.
- Thomas Erickson and Wendy Kellogg, [Social Translucence](https://collablab.northwestern.edu//CollabolabDistro/nucmc/p59-erickson.pdf), ACM TOCHI 7(1), 2000.
- [Notes on 29 games and papers](docs/research.md) and [the class survey](docs/cohort-survey.md).
