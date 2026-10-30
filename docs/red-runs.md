# Red runs

Each new claim went in as a test before the code. These are the runs that
showed the test failing against the server as it stood, kept because the
commits on 10 and 11 October landed in batches at the end of each evening
rather than one pair per claim. Each run used a worktree checked out at the
named commit with only the new spec files copied in.

| Spec | Against | Result |
|---|---|---|
| `spec/ship.test.ts`, the eleven ship claims | `46eedd6` (crit 8, the gate) | 11 of 11 failed in 57 s: no `board`, no ships in snapshots, the whole map in `hello` |
| the two turning tests with port/starboard helm input | `f8dfc80` (crit 9) | 2 of 2 failed: heading stayed 0 |
| "stop short of another ship" | `f8dfc80` | failed: the mover passed through to x 48.3 |
| `spec/harbour.test.ts`, names and the board | the working tree before `name`, `rename`, `visits` and `log` existed | 4 of 4 failed: no `rename` message, `hello.log` undefined |
| "refills a berth a few seconds after its ship leaves" | the working tree before `refillBerths` | failed: no `launched` message within 6 s |
| notes on the ground (two tests) and crew-only saying | `5a8ae7e` | 3 of 3 failed: no notes in `near`, no toast aboard, no `crew` flag on the bubble |
| gestures | the working tree before `emote` | failed: no `emote` message within 2 s |
| "open where the hull scraped … close under a body that patches them" | `356e559` (hull as one number) | failed: no snapshot with a hole within 6 s |
| the same test with `REPAIR_RATE` mutated to 0 | the working tree | failed: the hole never closed within 8 s |
| "… not under a ship lying still …" | `1fab797` (damage whenever a reef is under the hull) | failed: a ship placed on a reef with no sail had two holes after a second |
| "puts you aboard from the pier, onto the island beside the ship, …" | `5bcaae8` (no `jump` message) | failed: no snapshot aboard within 2 s |
| "reaches everyone within earshot and nobody else, whatever the client asks" | `3655dd7` (crew-only channel still served) | failed: the bubble came flagged `crew` and the pier never got it |
| one berth with a countdown; a derelict scuttled; a jump never boards from the pier | `7e1fe04` | 3 of 3 failed: three ships in `hello`, the empty ship still in the snapshot after 3 s, no refusal toast |
| the pier is the only way on or off; a jump is only a hop | `cef4054` (ashore allowed at sea) | failed: stepping off at sea swam you home instead of being refused |
| "give everyone aboard a job … the rest move up" and "nudge a body whose job is left unworked" | `6d66973` (no jobs) | 2 of 2 failed: `jobs` empty in the snapshot, no "Your job is" toast within 4 s |
| the nudge test with `nudgeIdle` switched off | the working tree | failed: no nudge within 4 s |
| `spec/a11y.test.ts` (language, one h1, landmarks, names, live regions, focus style) | the working tree with `lang` removed from the page, then with the help button stripped of its name | failed each time: no `lang`; a button with no name |
| `spec/robust.test.ts`: a directory request, a non-object message, a 64 KB frame | `d795967` | 3 of 3 failed: the server exited with EISDIR on `/vendor/`, with a TypeError on `null`, and the huge frame was accepted |
| the huge-frame test with `maxPayload` removed | the working tree | failed: no close 1009 within 30 s |
| "puts you back aboard your ship at sea if you come back within two minutes" | `2aebfee` | failed: the rejoining body was on the pier, not aboard |
| "… after the server restarts under you" with the shutdown write removed | the working tree | failed: the body came back ashore |

The same specs pass against the commits that followed each of them.
