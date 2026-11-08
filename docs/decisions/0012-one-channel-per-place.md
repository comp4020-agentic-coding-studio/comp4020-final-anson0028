# 12. One channel per place

Date: 8 November 2026. Status: accepted. Changes decision record 6 and
the 8-tile rule that gave the project its first name.

## Context

From 5 October to 8 November a word reached the people within 8 tiles of
the speaker and nobody else, filtered on the server. On the 7 by 4 deck
that was the whole ship; on the galleon (decision record 8) it split the
crew, the pumper in the bilge out of earshot of the helm. Playing it the
evening it landed, Anson judged that split a cost, not a feature: the
app is about a crew working one ship, the name is changing to All Hands
on Deck to say so, and a crew that cannot talk to itself is not a crew.
The distance rule came from Big Walk and from the first version, the
gate, where it was the whole game; here it had become a number to
explain.

## Options

1. **Keep 8 tiles.** The rule the tests already hold. It makes the
   galleon's ends deaf to each other, which the app would then have to
   turn into play (a runner, a speaking tube) to justify.
2. **No limit.** Everyone in the harbour hears everyone. The median chat
   room; the jetty hears the bilge.
3. **One channel per place.** A word or gesture reaches everyone aboard
   the speaker's ship, or everyone ashore if the speaker is ashore, and
   nobody else. Where you stand still decides what you hear, by the
   place you are in rather than by a radius.

## Decision

Option 3. `say` and `emote` are sent to the clients whose body is on the
same ship as the speaker, or to those ashore when the speaker is ashore.
There is no number to widen or narrow. Notes are unchanged: left ashore,
read within 1.5 tiles, shown within sight.

## Consequences

- The three tests that measured 8 tiles now measure places: the shore
  does not hear the ship, the ship hears its whole deck, and a gesture
  follows the same rule. Red first against the 8-tile server.
- The earshot ring on the ground, the "heard within 8 tiles" placeholder
  and `sayRange` in `hello` go.
- The README's claim becomes what you can do depends on where you stand;
  what you hear is the same rule said of a place. The history of the
  8-tile rule stays in this record, in decision record 6 and in
  `docs/process-log.md`.
