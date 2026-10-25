# Earshot

On this ship you can only work the station you are standing at. The sail
rises only while someone holds the mast, the helm turns only while someone
holds the wheel, the map shows only at the chart table, and what you type
reaches only people within 8 tiles, a little more than a ship's length.
One person can sail, badly, running between stations. More hands get
further, and sink less.

Earshot is a small online co-op game for a room of people. Whoever is here
crews the ship at the pier, each told which station is theirs in the order
they boarded,
and how far they got is kept with their names. Further out the rocks
thicken, and a holed hull wants one hand on the patch and one on the pump.

## What good means here

**What you can do, and what you know, depends on where your body is.**
Co-operation comes from that rule, not from a rule that counts heads.
Nothing waits for a number of players. You are told which station is
yours, but nothing stops you working another.

The distance rule comes from Big Walk (House House, 2026), where voices fade
as friends drift apart; its reviews name its fault, no solo mode. My first
version had the same fault: alone I could only walk. So one person can
always sail here.
Erickson and Kellogg (2000) found a limit works when everyone can see it;
the chart rule is the same for everyone, and each bird's station is
written above it for the whole crew to see. Several other student projects unlock features once enough
players are present ([114 class projects surveyed](docs/cohort-survey.md)); here
nothing unlocks, and a ship simply gets further the more hands it has
([the decision, written up](docs/decisions/0001-one-body-one-station.md)).

## How the rule is checked

Tested, by checks that drive a running server, sixteen claims in all
([the full list](docs/claims.md)), among them: one body holds one
station; only the body at the chart table is sent the map; a word reaches
8 tiles and no further; the record of every wreck and island landing
can't be changed or deleted;
the pier is the only way on or off; everyone aboard gets a job.

Measured, by simulated crews of one to four bots
([how](docs/tuning.md)): every crew size reaches the near and middle
islands. To the far island, a lone bot sank in 3 of 12 runs; with a
second bot aboard, none of 36 runs across two to four crew sank. Bots
never patch holes; people can.

Judged, by watching it played from the link alone. Three AI agents told
to play with no instructions knew within a minute it was a co-op sailing
game, and all three missed the same thing: nobody could tell they had
reached an island, and a sinking vanished into a fresh ship. Islands now
fly a flag with the crew's names, and a sinking stays on screen. My tutor
asked that a second or third person aboard should see what they are for,
so everyone now gets a job ([what changed](PROCESS.md)).

## What I didn't build

- Voice: in one room it would feed back; the room already has voices.
- Accounts, chat history, scores. The board lists crews by time, not by
  points; the wrecks, flags and notes are the record.
- Locked stations: a crew that loses its helmsman must still steer.

## Sources

- House House, [Big Walk](https://bigwalk.game/presskit/), 2026.
- Thomas Erickson and Wendy Kellogg, [Social Translucence](https://collablab.northwestern.edu//CollabolabDistro/nucmc/p59-erickson.pdf), ACM TOCHI 7(1), 2000.
- [Notes on 29 games and papers](docs/research.md) and [the class survey](docs/cohort-survey.md).
