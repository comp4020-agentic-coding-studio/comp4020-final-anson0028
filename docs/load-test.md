# Load test, 30 September 2026

`pnpm sim 30 20` opens 30 WebSockets, sends each one a random move four times a
second for 20 seconds, and times each input from when it is sent to when a
snapshot from the server carries its sequence number. The numbers below were
copied from the terminal at the time.

| Run | Where | p50 | p95 | Max | Server memory |
|---|---|---|---|---|---|
| 1 | laptop, before | 52 ms | 99 ms | 106 ms | 75 MB |
| 2 | Fly, before | 102 ms | 1256 ms | 3702 ms | 90 MB |
| 3 | Fly, 5 walkers only | 82 ms | 163 ms | 196 ms | 90 MB |
| 4 | Fly, after | 88 ms | 146 ms | 206 ms | 89 MB |

"Before" snapshots sent every player's name and colour with every position,
ten times a second. "After" sends names once, on join, and snapshots carry
ids and positions. Run 3 ruled out the network: with five walkers the long
tail was gone, so it grew with the number of players. Run 4 also reported a
send backlog of 0 bytes on every socket.

The spike was not yet committed during these runs; the "after" version is
the first commit, 8611c0b. The simulated walkers stay in the live database.

## 10 October, the ship build

The same `pnpm sim 30 20` against the ship server on the laptop, with three
ships moored and the walkers on the pier: p50 58 ms, p95 104 ms, max
105 ms, 73 MB, a tick taking 1.14 ms at the 95th percentile, and a send
backlog of 0 bytes. Snapshots now also carry each ship's position, heading,
sail, water, state, four holder ids and the hull. Run 2 above showed a
laptop number is not evidence for Fly, so the ship build was run against
Fly on 12 October, after the tuned numbers deployed:

| Run | Where | p50 | p95 | Max | Server memory | Tick p95 |
|---|---|---|---|---|---|---|
| 5 | Fly, the block-view build, 30 walkers on the pier | 75 ms | 92 ms | 97 ms | 102 MB | 1.4 ms |

Better than run 4 despite the bigger snapshot, with a send backlog of 0
bytes; the difference is most likely the time of day. Sixty simulated
walkers from the two runs that day sit in the live players table under
bird names.
