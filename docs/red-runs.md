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

The same specs pass against the commits that followed each of them.
