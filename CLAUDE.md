# Earshot: rules for working in this repo

The idea, from README.md: what you can do and what you know depends on
where your body is. Every rule here protects that. If a change needs one of
them broken, change README.md first and say why.

## Never

- Never send a client something its person shouldn't know. Filter on the
  server before sending; hiding it in the page doesn't count. That covers
  bubbles beyond 8 tiles, the map beyond 8 tiles for anyone not standing at
  the chart table, and anything about other people beyond their public id,
  bird name, colour, position and which ship they are on.
- Never send a cookie, or any part of one, to anyone but its owner. Public
  ids are a hash of the cookie.
- Never let the client decide the world. It sends intent: a held direction,
  a point to walk to, a message, board, ashore, hold. The server decides
  positions, who holds a station, how a ship moves, floods, sinks and lands.
- Never gate play on a headcount. Nothing checks how many people are
  present. One body in one place, stations tiles apart, and things that run
  down when unheld are what make more hands matter.
- Never update or delete a row in `wrecks` or `landings`. Triggers refuse
  it; don't work around them.
- Never point the spec at the live app. `spec/ship.test.ts` and
  `spec/persist.test.ts` start their own server on a temporary DATA_DIR
  (`spec/island.ts`). The rest use APP_URL, which is never the Fly URL. The
  simulator may run against Fly only when asked; its walkers stay in that
  database.
- Never add voice, accounts, a chat history or scores. README.md says why
  each one isn't built.
- Never ship a test hook that works without `WALK_TEST=1`.

## Every change

- Each numbered claim in README.md has a test in `spec/` that drives a
  running server, or reads its database once it stops. A new claim lands as
  a failing test first, then the code that makes it pass, in separate
  commits.
- A test that needs a known day, fast physics or a ship placed somewhere
  starts its own server with `WALK_TODAY`, `SHIP_PARAMS` and `WALK_TEST`.
  Tests on the shared server use fresh birds each run. Never let a test pass
  because an earlier run left state.
- After writing a check, break the rule it protects once and watch that test
  go red. If it stays green, the check is wrong, or the rule can't be
  reached.
- Tuning numbers live in `server/params.ts` and nowhere else. They change by
  simulation, with the runs recorded under `docs/`, not by feel.
- Snapshots carry public ids, positions, each body's input number and ship,
  and each ship's position, heading, sail, water, state and holders. Names
  and colours travel once, on join.
- Before a UI change is done: board, raise the sail and turn at 390 × 844 by
  touch, at 1920 × 1080 with a mouse with a resize halfway, and with the
  keyboard only. E and Q must not submit anything.
- Words in README.md match the code. Change both in the same commit.

## Facts about the stack

- Node 24 runs the `.ts` files directly. Imports name the `.ts` file. No
  build step, no framework.
- `ws` for sockets, `node:sqlite` for storage, plain Canvas for drawing.
- The Fly machine has 256 MB. Node runs with `--max-old-space-size=160`.
  Check memory with `/health` after anything that adds per-player or
  per-ship state.
- The sea is generated from a fixed seed in `server/world.ts`; the spec
  relies on the pier at (9.5, 31.5), three slots at x 13.5 and the near
  island at (34, 20).
- Deck coordinates are local to the ship: x in [-3, 4), y in [-2, 2).
  Stations: helm (-3, 0), sail (0, 1), chart (3, 0), pump (0, -2).
- `DATA_DIR` is `/data` on Fly. `WALK_TODAY` overrides the Canberra date,
  `SHIP_PARAMS` overrides tuning, `WALK_TEST=1` enables the test-only
  `place` message. All three exist for tests only.
- No comments in code.
- Commit messages say what changed. Don't push or deploy without asking.
