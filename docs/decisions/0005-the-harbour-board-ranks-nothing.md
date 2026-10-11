# 5. The harbour board ranks nothing

Date: 11 October 2026. Status: accepted.

## Context

I wanted a leaderboard in the top right: if you went to sea with someone,
both your names are up there. The records already existed, wrecks and
first landings, but only the chart table showed them, and a new visitor
saw no history at all. The README had also said "no scores", and the
research notes had a list of what rewards do to shared places: rated
messages that favour jokes, a canvas captured by the largest crowd, credit
going to whoever finished rather than everyone who helped.

## Options

1. **A leaderboard**: crews ordered by distance or points. The thing I
   first asked for. It would turn the sea into a race and the record into a
   target.
2. **Nothing new**: the chart stays the only record. Too hidden; a stranger
   never finds it.
3. **A log, newest first, with the day**: every landing and every wreck,
   with the crew and its size, and one summary line, who got furthest
   today. No points, no order but time.
4. **The log, but only visible ashore** and on the chart, so it obeys "what
   you know depends on where you stand". I proposed this; I then decided I
   wanted it in the corner the whole time.

## Decision

Option 3, always visible at the top right (collapsed to a button on a
phone). Every landing now goes into a `visits` table, not only the first on
each island, and the board is `visits` and `wrecks` merged. The one
comparative line resets each day, so it cannot be farmed over weeks.

## Consequences

- The board is public information not gated by position, an exception to
  the rule the project stands on. The justification: it is the harbour's
  record, not live knowledge about the sea, and the sea itself is still
  seen only from the chart table.
- "Furthest today" is still a small ranking. If people start sailing for
  it rather than for the island, it goes.
- The board is a list. A map of it, or a page per day, would read better;
  a classmate's archive does "past days are read-only", which is the
  natural next step.
