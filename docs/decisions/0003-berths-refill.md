# 3. Berths refill; hulls are not replaced

Date: 11 October 2026. Status: accepted.

## Context

The first rule was "a sunk ship is gone; the pier launches a new hull five
minutes later", so there were never more than three ships. A reviewer
reading the brief as a marker then showed the harbour can die: leave all
three ships at sea with Q and an intact hull, and nothing ever sinks them,
nothing brings them back, and the next visitor finds "No ship close enough
to board". A marker who comes back the next day could be unable to do the
one thing the app is for.

## Options

1. **Keep the rule and add a base leak to abandoned ships**, so an intact
   ship left at sea sinks in time and its berth is eventually replaced.
   This changes what absence means: a ship left as it was is one of the
   things the design promises the next visitor finds.
2. **Tow abandoned ships back to the pier** after a while. Honest, but a
   ship that teleports home breaks the record: where it was left is part of
   what the crew did.
3. **Refill the berth, not the hull.** A berth that has been empty for a
   few seconds, because its ship sailed or sank, gets a new ship, up to a
   cap on the fleet. Ships at sea stay where they were left.
4. **Make Q from a ship at sea impossible**, so ships come home or sink.
   Punishing on a phone that loses its connection.

## Decision

Option 3: `LAUNCH_DELAY_S` is 5, `MAX_SHIPS` is 12. Each berth faces open
water (east, with the outer two angled away from the islands), because a
ship that moves the moment its sail rises should not point at a reef.

## Consequences

- The fleet grows with every departure. Twelve ships in every snapshot is
  cheap; twelve abandoned ships at sea is clutter, and when the cap is
  reached with all of them at sea the harbour can still die. The next step
  is a day-old abandoned ship becoming a wreck named "nobody aboard".
- A solo sailor who leaves a berth and swims back finds a new ship, so the
  cost of abandoning one is nothing. That is deliberate for now: the record
  is the ship left at sea, not a penalty.
- The "building" state and the five-minute hull are gone; old rows are
  dropped at boot.

## Revised, 18 October 2026

Three berths refilling in five seconds produced the opposite problem: a
pier crowded with hulls, some drifted off their berths, some half boarded,
all colliding, and no one sure which to take. Now there is one berth, the
next ship comes ten seconds after the last one is clear of it, everyone on
the pier sees the countdown over their head, and a ship left empty away
from the berth for five minutes is scuttled without a record. A queue of
one is also where a crew forms: people wait together, and board together.
