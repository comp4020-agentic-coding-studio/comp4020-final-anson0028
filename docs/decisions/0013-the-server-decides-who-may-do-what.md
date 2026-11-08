# 13. The server decides who may do what

Date: 9 November 2026, writing down a rule in force since 10 October.
Status: accepted. Crit 10 asked for one decision about how the app
behaves with several people in it, with reasoning; this is that
decision, gathered from the rules in `CLAUDE.md` and the tests in
`spec/`.

## Context

Every client is a stranger's browser. It can send anything: a hold on
a station someone else has, a word addressed to the whole harbour, a
note that is not its own, a request for the map, a second connection
for the same cookie. Whatever the page hides can be unhidden in dev
tools. The app's idea is that what you can do and know depends on where
your body is, so if the client decided any of it the idea would be a
suggestion.

## Options

1. **Trust the client, check nothing.** The median multiplayer page:
   the server relays. Fastest to build; one tab with the console open
   steers from the pier.
2. **Check on the server, hide on the client too.** Belt and braces,
   but two places to get wrong and the client's copy drifts.
3. **The client sends intent, the server decides everything, and filters
   before sending.** A held direction, a point to walk to, a word, board,
   ashore, hold, a note: the server works out what it means where that
   body stands, and each client is sent only what its body could know.

## Decision

Option 3. In particular:

- One body holds one station and one station has one holder; a second
  grip is refused with the holder's name, and the refusal is logged
  (`spec/ship.test.ts`, "stations").
- A word or a gesture reaches everyone in the speaker's place, the ship
  or the shore, and nobody else, whatever the client asks; a client-side
  "to" field is ignored (decision record 12, `spec/harbour.test.ts`).
- Only the body at the chart table is sent the map; islands travel in
  `near` only within sight (`spec/ship.test.ts`, "what you can see").
- A note is removed only by its writer, through the server
  (`spec/harbour.test.ts`).
- Boarding and stepping off happen only at the jetty; at sea the server
  refuses and says why (claim 15).
- A second connection with the same cookie is pinged; a live one is a
  second tab and is refused, a silent one is replaced (`spec/walk.test.ts`).
- Nobody is sent another's cookie or any part of it; public ids are a
  hash (`spec/walk.test.ts`).
- Every act and every refusal is one log line, `<time> <name>#<id> <what>`,
  so the live log alone tells people apart and shows who was told no.

## Consequences

- Latency is the server's: a move shows after a snapshot, measured at
  150–230 ms on Fly, never instantly. The page interpolates between
  snapshots to hide that.
- Jobs are labels, not permissions (decision record 7); the server
  assigns them but refuses nobody a free station because of them.
- Tests drive a running server over its socket and read raw frames,
  because that is the only place the rule can be checked.
