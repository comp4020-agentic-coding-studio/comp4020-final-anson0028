# 9. The sea gets harder the further out you go

Date: 8 November 2026, recording a decision made in steps between 12 and 18
October. Status: accepted.

## Context

A game has to get harder as it goes, or nobody needs anybody. R.E.P.O. sends
stronger monsters the deeper a crew gets, and the crews that come back are
the ones that worked together. The first ladder here, measured by simulated
crews on 12 October, had no ladder at all: with the numbers as shipped every
crew size landed everywhere, and no change to speed, leak or pump rates
alone produced one ([`0f828aa`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/0f828aa),
[`docs/tuning.md`](../tuning.md), sweep 1). Two rules made the difference:
an unheld helm wanders, and reefs come in clumps with lanes between them, so
a navigator has something to find.

The reef density then went wrong twice. At 32% of the sea the first phone
session found "mostly rock" and a holed ship past saving, which is where
holes in the deck and patching came from
([`20413e3`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/20413e3),
[`9a274f7`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/9a274f7)).
At 6%, after three cold players said the sea was still too dense, every crew
size reached every island in about a minute and the ladder was gone again
([`7eb0313`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/7eb0313),
sweep 6).

## Options

1. **An open sea.** Reefs only as scenery. Everyone lands, nobody is
   needed, and the board fills with identical lines.
2. **The same density everywhere.** The 12 October sea. A lone sailor
   sinks before the first island, and a crew of four finds the harbour
   mouth as dangerous as the far sea. Players called it rock, not sea.
3. **Reefs that scale with the crew.** PICO PARK rebuilds each level for
   the number of players. Here that would mean the server counting heads,
   which decision record 1 forbids: a ship that gets harder when a friend
   boards punishes the boarding.
4. **A sea that gets harder with distance.** Clear water round the pier and
   round each island, nothing at all within thirty tiles of the pier, then
   a scatter of rocks that thickens on the way out, and clumped fields with
   lanes further out. The first island is reachable alone; the far one
   wants more hands.

## Decision

Option 4, in two commits on 18 October
([`0b91d33`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/0b91d33),
[`45fc95a`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/45fc95a)).
The numbers live in `server/params.ts` and nowhere else: `REEF_FROM` 10,
`REEF_SLOPE` 50, `REEF_MAX` 0.5, `REEF_CLUMP` 1, `REEF_SCATTER_FROM` 30,
`REEF_SCATTER_MAX` 0.085, `REEF_SCATTER_SLOPE` 570; a reef holes a moving
hull where it struck at `REEF_DAMAGE` 15 scaled by sail, each hole caps at
`LEAK_CAP` 40, a body standing on it patches at `REPAIR_RATE` 20, and the
pump empties at `PUMP_RATE` 3 against `LEAK_PER_DAMAGE` 0.07 per point of
hull. The difficulty is in two hands at once: one on the hole, one on the
pump, while a third holds the sail so the hull keeps moving.

Measured on 18 October, twelve runs per cell: every crew size reaches the
near and middle islands; to the far island a bot alone sank in 3 of 12,
and with anyone else aboard none of 36 sank (`docs/tuning.md`, the numbers
table).

## Consequences

- The sea is the same for every crew. What changes with more hands is how
  far you can go and stay dry, not what the sea does.
- The bots never patch, so the ladder is a floor: a careful person alone
  does better than the lone bot, and a crew that patches does better still.
- `REPAIR_RATE` went from 10 to 20 by hand, from a live log of my own
  sinking, not from a sweep. It is the one number tuned by feel, and it is
  written down as such.
- A change to any of these numbers is a sweep first (`pnpm crews`), then a
  line in `docs/tuning.md`, then the commit. The spec pins its own fast
  numbers so a tuning change never moves a test.
- What the sea does is what persists: every landing is a flag with the
  crew's names and every wreck a line on the board, in order of time
  (decision record 5). The difficulty is what makes those lines worth
  reading, and the reason to come back and try the far island.
