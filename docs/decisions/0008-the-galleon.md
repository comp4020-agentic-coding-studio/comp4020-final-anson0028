# 8. The galleon

Date: 8 November 2026. Status: accepted, except that visitors arrive on
the jetty, not aboard: that part was taken back the same night (see the
end of this record).

## Context

The ship was 7 by 4 tiles with four stations a few steps apart. The bot
ladder showed what that meant: one body could run between every station
fast enough to reach the near and middle islands every time, and the
only thing a second body bought was fewer sinkings on the far trip
(`docs/tuning.md`, sweep seven). The rule the whole app rests on, that
what you can do and know depends on where your body is, had almost no
distance to work with. The cold reads said the same from the player's
side: on a deck that small, "you only hear within 8 tiles" was never
felt, because nobody aboard was ever 8 tiles away.

A visitor also arrived on the pier and had to find the ship. On the
first screen the thing the app is about was a box in the distance.

## Options

1. **Keep the small ship and tune the numbers.** Slower sail rise, faster
   loosening. Seven sweeps had already shown the numbers alone do not
   make a ladder; the deck was the problem.
2. **A galleon, with places.** An 18 by 7 deck in three levels: the helm
   and chart table up on the quarterdeck at the stern, the mainsail on
   the main deck, the foresail on the forecastle at the bow, and the pump
   down a ladder in the bilge amidships. Two sails, so one body on the
   mainsail gets six tenths of the speed and a second on the foresail
   the rest. A new visitor wakes in the crew quarters on the forecastle
   of the ship at the berth, not on the pier. The pier becomes a jetty
   along the shore long enough for the hull to lie alongside, with a
   gangway amidships as the only way on or off.
3. **A galleon with a mess hall and a dice table.** The same deck with
   rooms where nothing sails: a long table where the harbour board is
   read, dice whose faces only the players at the table are sent. More
   places for the rule to work on, but each needs its own tests, words
   and reasons, and a dice table with no stakes is scenery while one with
   stakes is a score, which decision record 5 rules out.

## Decision

Option 2. Deck x in [-8, 10), y in [-3, 4). Stations: helm (-6, 0) and
chart (-4, 2) on the quarterdeck, sail (0, 1) on the main deck, pump
(3, -2) in the bilge, foresail (7, 1) on the forecastle. Helm to pump
is 9.2 tiles, helm to foresail 13: the pumper cannot hear the
helmsman, and the bow cannot hear the stern, so a word has to be carried
by whoever stands amidships. The hull is checked at five points along
the keel instead of three; a landing is the bow touching the shore, not
the centre; ships keep `SHIP_CLEARANCE` between their keels, measured as
the distance between two segments. The berth sits off a jetty from x 8
to 30 along y 30 to 32; the single ship moors at (20, 36.5) heading
east.

A new visitor wakes aboard. A returning one is where they left: aboard,
if they were aboard within two minutes (decision record 7's rejoin), or
on the jetty where they stepped off. (Taken back a few hours later: see
below.) Jobs gain the foresail: four aboard
is helm, mainsail, pump and patching, foresail; five adds the chart.

Option 3 is not built. It is written here so that the mess hall and the
dice are a recorded idea, not a forgotten one.

## Consequences

- Every fixed position in `spec/` moved, and the spec's positions were
  checked against the new map (`scratchpad/tiles.ts`, kept out of the
  repo). The red run for the four new tests is in `docs/red-runs.md`.
- The berth refills when the leaving ship's keel is clear of the slot,
  which for an 18-tile hull means some twenty tiles of sailing before the
  countdown starts. A room waiting on the jetty waits longer than before.
- The bot ladder from sweep seven is void; sweep eight re-measures it
  with crews of one to five.
- Islands are small beside the ship. The hull is checked only along the
  keel, so a reef under the beam does no harm. Honest in `docs/the-ship.md`.
- `README.md`, `CLAUDE.md`, `docs/claims.md` and `docs/the-ship.md` change
  in the same commit as the words that describe the deck.

## Taken back: waking aboard

Played the same evening, waking aboard felt wrong to Anson: a crew
should gather somewhere and then go, and a ship that fills with people
who never chose to board is not a crew. So a visitor arrives on the jetty
beside the ship, one press from the gangway, and the pier is the lobby;
the countdown to the next ship shows there. Claim 17 and its test
changed with it. The crew quarters stay on the forecastle as a place to
stand.
