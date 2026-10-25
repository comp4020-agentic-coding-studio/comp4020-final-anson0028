# Earshot: rules for working in this repo

The idea, from README.md: what you can do and what you know depends on
where your body is. Every rule here protects that. If a change needs one of
them broken, change README.md first and say why.

## Never

- Never send a client something its person shouldn't know. Filter on the
  server before sending; hiding it in the page doesn't count. That covers
  bubbles beyond 8 tiles, the map beyond 8 tiles for anyone not standing at
  the chart table, and anything about other people beyond their public id,
  name, colour, position and which ship they are on. The harbour board is
  public: every landing and wreck, with names, crew size and day, goes to
  everyone.
- Never send a cookie, or any part of one, to anyone but its owner. Public
  ids are a hash of the cookie.
- Never let the client decide the world. It sends intent: a held direction,
  a point to walk to, a message, board, ashore, jump, hold. The server decides
  positions, who holds a station, how a ship moves, floods, sinks and lands.
- Never gate play on a headcount. Nothing checks how many people are
  present. One body in one place, stations tiles apart, and things that run
  down when unheld are what make more hands matter.
- Never turn a job into a lock. Jobs (decision record 7) are labels the
  server gives by order of boarding; any body may still hold any free
  station, and a crew short of its helmsman must still be able to steer.
- Never update or delete a row in `wrecks` or `landings`. Triggers refuse
  it; don't work around them.
- Never point the spec at the live app. `spec/ship.test.ts` and
  `spec/persist.test.ts` start their own server on a temporary DATA_DIR
  (`spec/island.ts`). The rest use APP_URL, which is never the Fly URL. The
  simulator may run against Fly only when asked; its walkers stay in that
  database.
- Never add voice, accounts, a chat history or scores. README.md says why
  each one isn't built. A typed name is not an account, and the harbour
  board is not a ranking: no points, and no order but time. What a client
  heard may stay on that client for two minutes; the server keeps no chat.
- Never update or delete a row in `visits` either; it is the board. A note
  in `notes` is removed only by its writer, through the server.
- Never widen earshot, and never narrow it either: one channel, 8 tiles.
  Nothing carries a word or a gesture further (the crew always sees a
  gesture), and a note is read within 1.5. The crew-only channel was
  removed on 14 October: two channels that looked the same confused
  players.
- Never ship a test hook that works without `WALK_TEST=1`.

## Every change

- Each numbered claim in `docs/claims.md` (README.md names the enforced
  ones and links there) has a test in `spec/` that drives a
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
  simulation (`pnpm crews`, recorded in `docs/tuning.md`), not by feel. The
  spec pins its own fast numbers, so a tuning change never moves a test;
  if it does, the test was about a number, not a rule.
- Snapshots carry public ids, positions, each body's input number and ship,
  and each ship's position, heading, sail, water, hull, open holes, state,
  holders and jobs. Names and colours travel once, on join.
- Before a UI change is done: board, walk to a station, raise the sail, turn
  the ship and turn the camera at 390 × 844 by touch (d-pad and drag), at
  1920 × 1080 with a mouse with a resize halfway, and with the keyboard only
  (WASD, arrows, E, Q), and read the first-visit card and the board at both
  sizes. E and Q must not submit anything.
- Words in README.md match the code. Change both in the same commit.

## Facts about the stack

- Node 24 runs the `.ts` files directly. Imports name the `.ts` file. No
  build step, no framework.
- `ws` for sockets, `node:sqlite` for storage. The view is three.js,
  vendored in `public/vendor/` (MIT, `three.LICENSE`) and loaded through an
  import map, no bundler; the chart is a 2D canvas. The server gzips `.js`,
  `.css` and `.html` when asked.
- Movement is camera-relative on the client and arrives at the server as a
  unit vector in deck coordinates when aboard. The helm turns on the
  port/starboard part of the holder's input.
- The Fly machine has 256 MB. Node runs with `--max-old-space-size=160`.
  Check memory with `/health` after anything that adds per-player or
  per-ship state.
- The sea is generated from a fixed seed in `server/world.ts`; the spec
  relies on the pier at (9.5, 31.5), one berth at (13.5, 32) facing open
  water, and the near island at (34, 20). The berth, once its ship is
  clear, is refilled after `LAUNCH_DELAY_S` while the fleet is under
  `MAX_SHIPS`; a ship left empty away from it is scuttled after
  `DERELICT_S`. Nothing lies within 30 tiles of the pier.
- A ship is three points, centre, bow 3.5 ahead and stern 2.5 behind. Land
  and reefs are checked at all three, ships keep 5 tiles between centres
  (`SHIP_CLEARANCE`), and the crew are told when the hull is stopped or
  scraped. Reefs start `REEF_FROM` tiles from the pier, thicken by
  `REEF_SLOPE` to `REEF_MAX`, in clumps with lanes (`REEF_CLUMP`). An
  unheld helm wanders (`HELM_DRIFT`). The spec's fixed positions were
  checked to be open water under the shipped map.
- Deck coordinates are local to the ship: x in [-3, 4), y in [-2, 2).
  Stations: helm (-3, 0), sail (0, 1), chart (3, 0), pump (0, -2).
- A name is what the visitor typed, cleaned on the server to letters, digits
  and spaces, 16 at most; the bird name is the default. The board is
  `visits` and `wrecks` merged, newest first, 40 on hello. Notes travel in
  `near` (within `SIGHT`), 60 characters, three per writer; the client
  fades them over 14 days and never hides them. Gestures are four kinds
  (`EMOTES`), one per 400 ms per body, animated on the client, never
  stored.
- The server logs one line per act to stdout, `<iso time> <name>#<id> <did
  what>`, including refusals (a second tab, a held station, a note that
  isn't yours) and the ship events (launched, aground, scrape, landing,
  sinking). Positions and inputs are never logged. `flyctl logs` is the
  crit 10 narration and the first thing to read when the live app
  misbehaves. A new act gets a log line in the same commit.
- `DATA_DIR` is `/data` on Fly. `WALK_TODAY` overrides the Canberra date,
  `SHIP_PARAMS` overrides tuning, `WALK_TEST=1` enables the test-only
  `place` message. All three exist for tests only.
- No comments in code.
- Commit messages say what changed. Don't push or deploy without asking.
