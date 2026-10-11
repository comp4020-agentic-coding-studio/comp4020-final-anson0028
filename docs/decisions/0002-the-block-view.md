# 2. The block view, over the bird's shoulder

Date: 10 October 2026, built the same night. Status: accepted; the first
phone in a real hand is still to come.

## Context

The crit 9 build drew the harbour top-down. Everyone saw every tile within
8 of their bird from above, so the chart table, which is the one place the
whole sea is sent, felt like a bigger version of what you already had. I
wanted the rule to be literal: what you can see is what is in front of your
body. I also wanted blocks, because a classmate's driving game showed 3D
runs on this stack and on a phone, and because a deck with a mast and a
wheel on it reads as a ship in a way that four circles on a rectangle does
not.

## Options

1. **Keep the top-down view.** Cheapest, safe on phones, every test already
   drove it. But it gives away the map for free and the ship is a diagram.
2. **First person.** The most literal "where you stand". But you can't see
   your own bird, the deck layout vanishes, and on a phone a camera you
   steer by dragging the same screen you tap to walk is a fight.
3. **Third person over the shoulder, blocks, the chart table as the only
   map.** You see the deck around you and the water ahead. The camera
   turns with the ship so "forward" stays the bow.
4. **Isometric.** Prettier than 1 and still a map; it has the same fault.

## Decision

Option 3, with three.js vendored into the repo (no CDN, no bundler),
WASD relative to the camera, arrow keys or a drag to look, a click or tap
to walk there, and the phone's pad and Use button kept. The helm turns on
the port/starboard part of the holder's input, because with a camera that
turns with the ship, "left" is a side of the ship, not a side of the deck.

## Consequences

- Two megabytes of three.js in the repo, gzipped on request to 420 KB. No
  cache headers yet, so every reload pays it.
- Software renderers are slow, so the browser harness sends keys in short
  pulses and the client sends movement on the key event, not the next frame.
- The 8-tile limit is harder to feel in 3D than on a map: the fog is the
  only sign of it. Open.
- A low/high quality switch, like the campus has, is the likely fix for old
  phones. Not built.
- The server did not change for drawing. Everything it sends is the same
  small state; the chart is still the 2D renderer this replaced.
