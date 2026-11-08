# The harness

What the agent must obey, and what catches it when it does not. Each part
is a file or a command in this repo.

| Part | What it does |
|---|---|
| `CLAUDE.md` | The rules. Each has a date and sits on a decision record; "never" rules first, then what every change must do, then facts about the stack. |
| `docs/decisions/0001` to `0013` | One record per decision: context, the options, what was chosen, what it costs. The README links to them instead of restating them. |
| `docs/claims.md` | The claims the README makes, numbered; each has a test. |
| `spec/*.test.ts` | Tests that drive a running server over HTTP and WebSocket. `spec/island.ts` starts a server on a free port with its own data directory and a fixed day, fast physics and the test-only `place` message; `spec/walker.ts` is a client that walks, boards and works a station. |
| `docs/red-runs.md` | Every test seen failing before the code that passes it, against a named commit, and the mutations (a rate set to 0, a rule switched off) that made it fail again. |
| `server/params.ts` | Every tuning number in one file, overridable by `SHIP_PARAMS` for tests and sweeps. A number changes by a sweep, recorded in `docs/tuning.md`, not by feel; the one exception is written down there. |
| `pnpm crews` (`scripts/crews.ts`) | Simulated crews of one to five bots, each run on its own server, twelve runs per cell. Its own faults are recorded in `docs/tuning.md`. |
| `pnpm check` | Typecheck, then the whole spec. CI runs it on every push and deploys only if it is green. |
| `pnpm check:evidence` | Fails if `PROCESS.md` still has the template comment, cites a commit that does not exist, or a crit reflection is missing. |
| `.githooks/pre-commit` | Blocks a commit that contains anything shaped like an API key. |
| `flyctl logs` | One line per act on the live server, `<time> <name>#<id> <did what>`, including refusals. Read at crit 10 and whenever the live app misbehaves. |
| Playwright at 1920 by 1080, 390 by 844 and keyboard only | Run before any UI change is done, per `CLAUDE.md`. Not a dependency of this repo: the scripts load it from the assignment 2 repo's `node_modules` and live in the agent's scratch directory, so they are not committed. |
| Humanizer (a user-level skill) | Every page of words, README, PROCESS, the records, goes through it before it ships, against the habits of agent prose: staged contrasts, one-line closers, dashes. |
| Two conversations | One session changes code; a fork of it keeps the words and is messaged when a piece of work lands. On the last two days they ran side by side and met at the merge. |
| Agents with no history | Cold readers, cold players, a marker, a tutor, a code reviewer, markers of `PROCESS.md`, each with a narrow brief and no access to the conversation. |
