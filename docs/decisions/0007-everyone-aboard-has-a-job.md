# 7. Everyone aboard has a job

Date: 23 October 2026. Status: accepted.

## Context

The crit 10 tutor's note: make the cooperation, the multi-user part, more
visible; everyone should have a job, nobody should stand around. The cold
plays said the same from the other side: two friends could not tell
whether they were on the same ship, and a third body aboard often stood
on the deck waiting to be told what to do. The rules already make hands
matter (decision record 1), but nothing in the app says whose hands go
where.

## Options

1. **Leave it to the crew.** Talking it out is the game. It works for
   friends in one room and fails for strangers, who stand still.
2. **Lock stations to people.** Each body can only work its own station.
   Clear, but a crew whose helmsman drops out cannot steer, and it breaks
   the first rule: one person can always sail, badly.
3. **Assign a job, don't enforce it.** The server gives each body a job by
   the order they boarded, shows everyone's job over their heads and in a
   crew list, and nudges a body whose job has been left empty. Anyone can
   still work any station.

## Decision

Option 3. Jobs by order of boarding and crew size:

| aboard | first | second | third | fourth | fifth and on |
|---|---|---|---|---|---|
| 1 | everything | | | | |
| 2 | sail and helm | pump and patch | | | |
| 3 | helm | sail | pump and patch | | |
| 4 | helm | sail | pump and patch | chart | |
| 5+ | helm | sail | pump | chart | patch |

When someone steps off or is washed ashore, the rest move up. A body
whose job is unworked for `JOB_NUDGE_S` while the ship is at sea is told
so, once per `JOB_NUDGE_S`, and the log says who was nudged to what. The
ship at the pier says which job the next body aboard will take.

## Consequences

- Jobs travel in the snapshot with public ids, like holders. They are a
  label, not a permission: the server's rules about who may hold what are
  unchanged.
- The order is the order of boarding, so arriving early is the only
  privilege; nobody chooses or is chosen.
- A solo sailor's job is everything and is never nudged.
- Nothing counts heads to unlock anything; the table is advice the crew
  can ignore, which keeps decision record 1 intact.
