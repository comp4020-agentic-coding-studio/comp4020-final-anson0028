# 6. Notes on the ground, and no channel wider than earshot

Date: 11 October 2026. Status: accepted.

## Context

A classmate's campus (Seongsu Kim, "ANU campus, unofficially") has two
things I wanted: a chat you press Enter for, scoped to the space you are
in, and sticky notes left on the floor where you stood. A first-time player
had just reported that Earshot's talk was nearly useless: forty characters
cut off silently, bubbles gone in seconds, no sign when nobody heard, and
nothing for a person on the pier to do. The borrowing had to survive the
rule that nothing carries a word further than 8 tiles.

## Options, for talk

1. **A harbour-wide channel.** Rejected: it is exactly the thing the 8-tile
   rule forbids, and Big Walk's reviewers said what happens when a game
   gives you a way round its own distance rule.
2. **What you heard, kept on your own screen for two minutes**, plus
   longer bubbles, a character count, a reply when nobody heard, and
   Shift+Enter aboard to speak to the crew only. The server stores no chat.

## Options, for traces

1. **Nothing new**: wrecks, plaques and the board are the record.
2. **Notes anywhere**, including the deck. A note on a deck travels with
   the ship and has to be stored in deck coordinates; not worth it yet.
3. **Notes ashore**, written where you stand, 60 characters, three per
   writer with the oldest replaced, read within 1.5 tiles, sent only
   within sight, fading over 14 days but never removed except by the writer.
4. **Notes on the islands**, which only a crew that gets there can read.
   The strongest version; it waits on being able to step off a landed ship.

## Decision

Talk 2 and traces 3, with 4 as the next step. Gestures, wave, jump, nod
and shake, came in the same day under the same rule: they carry 8 tiles,
plus the crew, and are not recorded.

## Consequences

- Notes are free text that persists. The caps and the writer-only removal
  are the whole moderation; accepted for a room, revisited if the URL
  spreads.
- Notes travel in `near`, so a reader has to walk to them. That is the
  point.
- "What you heard" is on the client only, so a reload loses it. Deliberate:
  the README still says there is no chat history.
- Crew-only talk is the one case where earshot is narrowed, never widened.
