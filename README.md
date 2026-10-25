# Earshot

On this ship you can only do what you are standing at. The sail rises only
while someone holds the mast, the helm turns only while someone holds the
wheel, the map shows only at the chart table, and what you type carries 8
tiles. One person can sail, badly, running between stations. More hands get
further.

Earshot is a small online co-op game for a room of people. Whoever is here
crews the ship at the pier together, each with a job by the order they
boarded, and how far it got is kept with their names. You play as a block
bird: walk to a station and hold E. Every station stops the moment it is
left. Further out the rocks thicken, and a holed hull wants one hand on the
patch and one on the pump.

## What good means here

**What you can do, and what you know, depends on where your body is.**
Co-operation comes from that rule, not from a lock: nothing counts heads,
and a job is a label, never a gate.

The distance rule comes from Big Walk (House House, 2026), where voices fade
as friends drift apart. Its reviews name its fault: no solo mode. My first
version copied that and the crit 8 pod found it, so one person can always
sail here. Erickson and Kellogg (2000) found a limit works when everyone can
see it; the chart rule is the same for everyone, and every job shows over
its owner's head. Some of the class unlock things by headcount
([`docs/cohort-survey.md`](docs/cohort-survey.md)); here the hands a ship
needs grow with distance from the pier
([decision record 1](docs/decisions/0001-one-body-one-station.md)).

## Enforced, measured, judged

Enforced by tests that drive a running server, sixteen claims in all
([`docs/claims.md`](docs/claims.md)), among them: one body holds one
station; only the body at the chart table is sent the map; a word reaches
8 tiles and no further; wrecks and landings can't be changed or deleted;
the pier is the only way on or off; everyone aboard gets a job.

Measured by simulated crews ([`docs/tuning.md`](docs/tuning.md)): every
crew size reaches the near and middle islands; alone, the far island three
times in four, with anyone else aboard every time. The bots never patch a
hole, so a careful person alone can do better.

Judged, by watching people: whether strangers find their job without being
told, whether the crew list makes a second person feel needed, and whether
the board reads as a record rather than a ranking. Three cold players and a
crit pod are the evidence so far ([`PROCESS.md`](PROCESS.md)).

## Trying it alone

A first-visit card says this and lists the keys; ? brings it back. For a
second person, open another window and press "Walk here as a second
person".

## What I didn't build

- Voice: in one room it would feed back, and the room already has voices.
- Accounts, chat history, scores. A cookie brings you back as the same bird;
  the board, wrecks, flags and notes are the record, and nothing is ranked.
- Locked roles: a crew that loses its helmsman must still be able to steer.

## Sources

- House House, [Big Walk](https://bigwalk.game/presskit/), 2026.
- Thomas Erickson and Wendy Kellogg, [Social Translucence](https://collablab.northwestern.edu//CollabolabDistro/nucmc/p59-erickson.pdf), ACM TOCHI 7(1), 2000.
- The games I read about and the class's work: [`docs/research.md`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/blob/main/docs/research.md), [`docs/cohort-survey.md`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/blob/main/docs/cohort-survey.md).
