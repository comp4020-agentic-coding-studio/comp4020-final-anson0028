# All Hands on Deck

All Hands on Deck is a sailing game for whoever is online. You start on a
pier with one ship tied up at it, and whoever turns up is its crew. The ship
has five stations, mainsail, foresail, helm, chart table and pump, and each
works only while somebody stands at it; step away and it stops. The crew's one goal is to
find the islands out there and reach them together, past rocks that tear
holes in the deck. A landing goes on the harbour board with your names.
You can talk to your ship, leave a note on the jetty, and wave.

## What good means here

**What you can do, and what you know, depends on where your body is.**
With other people aboard, that rule comes down to three things.

**Every job matters, and friends get a good hour together.** In Big Walk
your voice carries only a few steps, so a big group has to pass a clue from
person to person down the line. In PEAK the climber who still has strength
has to go up first and drop a rope for the others, or nobody reaches the
top. Here the ship runs only while people stand at its stations. Everyone
aboard heads for the same goal, and the funny things happen on the way
([decision 1](docs/decisions/0001-one-body-one-station.md),
[decision 7](docs/decisions/0007-everyone-aboard-has-a-job.md)).

**The sea gets harder the further out you go, and what you got through
leaves a mark.** R.E.P.O. sends stronger monsters the deeper you get.
Here the rocks get denser the further you sail and tear holes in the deck, so one person has
to patch the hole while another pumps the water out. Every landing plants a
flag with the crew's names on the island; every wreck is a line on the
harbour board, in order of time. Both are still there the next day
([decision 9](docs/decisions/0009-the-sea-gets-harder.md),
[decision 5](docs/decisions/0005-the-harbour-board-ranks-nothing.md)).

**A stranger has to be able to start.** The first screen says what the
game is in three short paragraphs, a red line walks you to the ship, and
you are given a station to start at, so there is something to do
([decision 10](docs/decisions/0010-a-stranger-has-to-be-able-to-start.md)).

## Enforced, and judged

Each line is a test in `spec/` that runs against the app
([all nineteen](docs/claims.md)):

- one body holds one station, and one station is held by one body
  (claim 1, `ship.test.ts`)
- a reef holes a moving hull where it struck; a body on the hole patches
  it (claim 4, `ship.test.ts`)
- a wreck names its crew, and no wreck or landing can be changed or
  deleted (claims 5 and 12, `ship.test.ts`, `harbour.test.ts`)
- only the body at the chart table is sent the map (claim 9,
  `ship.test.ts`)
- a move shows to everyone within a second, and a word reaches your ship
  and not the shore (claims 10 and 14, `walk.test.ts`, `harbour.test.ts`)
- everyone aboard has a job by order of boarding (claim 16,
  `ship.test.ts`)

Measured, by bot crews of one to four ([how](docs/tuning.md)): every crew
reaches the near and middle islands; to the far one, a bot alone sank in
3 of 12 runs, crews of two to four in none of 36. That was the October
deck; the big ship's own sweep is in the same file.

Judged, from what happened when people played. At crit 9 (12 October) the
pod found the sea too hard, and the board shows it: three landings, all on
the near island, and seven wrecks; the reefs were thinned that day (sweep
5 in [docs/tuning.md](docs/tuning.md), decision 9). At crit 10 (19 October)
a classmate arriving from the link said nothing was clear at the start;
the first screen became three short paragraphs and everyone now gets a
job on boarding (decision 10). That afternoon four of the six names on
the board reached the middle island together, and the one ship that sank
had one person aboard. On 9 November four AI testers played for twenty
minutes; thirteen faults were fixed that night
([the report](docs/testing/playtest-2026-11-09.md)).

## What I didn't build

- Accounts. A login slows the start; you type a name and go
  ([decision 4](docs/decisions/0004-names-are-typed.md)).
- Puzzles that only exactly two people can solve, as in Big Walk. Nothing
  here unlocks with a headcount, and the job you are given is a suggestion,
  not a lock.
- Voice chat. Between people who do not know each other it adds a risk
  that typed words do not.
- Coins or any reward for a landing. It would move the point of the game
  from a good time with friends to earning coins
  ([decision 11](docs/decisions/0011-no-reward-for-landing.md)).

## Sources

- [Big Walk](https://bigwalk.game/presskit/) (House House, 2026) and [its designers in Kotaku](https://kotaku.com/the-creators-of-big-walk-break-down-the-goty-contenders-development-puzzles-and-stunning-ending-2000725133).
- PEAK (Aggro Crab and Landfall, 2025): [Nick Kaman in PC Gamer](https://pcgamer.com/games/adventure/peak-boss-doesnt-mind-us-calling-it-friendslop-why-not-make-a-game-where-the-point-is-to-hang-out-with-your-friends); [GamingOnLinux on stamina and ropes](https://www.gamingonlinux.com/2025/07/co-op-climbing-game-peak-is-a-truly-great-time-with-friends/).
- R.E.P.O. (Semiwork, 2025): [PC Gamer on its difficulty](https://www.pcgamer.com/games/horror/repo-will-feature-moon-phases-as-part-of-the-new-update-ramping-up-the-difficulty-every-5-levels).
- [29 games and papers](docs/research.md); [the class survey](docs/cohort-survey.md).
