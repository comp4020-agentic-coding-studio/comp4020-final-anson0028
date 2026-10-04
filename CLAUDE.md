# Earshot: rules for working in this repo

The idea, from README.md: where you stand decides what you know and who you
can tell. Every rule here protects that. If a change needs one of them
broken, change README.md first and say why.

## Never

- Never send a client something its person shouldn't know. Filter on the
  server before sending; hiding it in the page doesn't count. That covers
  bubbles beyond 8 tiles, the plate's code, and anything about other people
  beyond their public id, bird name, colour and position.
- Never send a cookie, or any part of one, to anyone but its owner. Public
  ids are a hash of the cookie.
- Never let the client decide the world. It sends intent: a held direction,
  a point to walk to, a message, a code. The server decides positions, who
  is on the plate, whether a code is right and whether the gate opens.
- Never update or delete a row in `openings`. Triggers refuse it; don't work
  around them.
- Never point the spec at the live app. `spec/gate.test.ts` and
  `spec/persist.test.ts` start their own server on a temporary DATA_DIR
  (`spec/island.ts`). The rest use APP_URL, which is never the Fly URL. The
  simulator may run against Fly only when asked; its walkers stay in that
  database.
- Never add voice, accounts or a chat history. README.md says why each one
  isn't built.

## Every change

- Each numbered claim in README.md has a test in `spec/` that drives a
  running server, or reads its database once it stops. A new claim lands as
  a failing test first, then the code that makes it pass, in separate
  commits.
- A test that needs a known day or a shut gate starts its own server with
  `WALK_TODAY`. Walk tests use fresh birds each run. Never let a test pass
  because an earlier run left state.
- After writing a check, break the rule it protects once and watch that test
  go red. If it stays green, the check is wrong, or the rule can't be
  reached.
- Snapshots carry public ids, positions, each body's input number and
  whether the plate is held. Names and colours travel once, on join.
- Before a UI change is done: walk the puzzle at 390 × 844 by tapping, at
  1920 × 1080 with a mouse with a resize halfway, and with the keyboard
  only. Enter and E must move focus without submitting anything.
- Words in README.md match the code. Change both in the same commit.

## Facts about the stack

- Node 24 runs the `.ts` files directly. Imports name the `.ts` file. No
  build step, no framework.
- `ws` for sockets, `node:sqlite` for storage, plain Canvas for drawing.
- The Fly machine has 256 MB. Node runs with `--max-old-space-size=160`.
  Check memory with `/health` after anything that adds per-player state.
- `DATA_DIR` is `/data` on Fly. `WALK_TODAY` overrides the Canberra date and
  exists for tests only.
- No comments in code.
- Commit messages say what changed. Don't push or deploy without asking.
