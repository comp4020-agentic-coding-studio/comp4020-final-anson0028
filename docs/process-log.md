# Process log

The long account. `PROCESS.md` is the short one, rewritten at each crit to
fit 900 to 1100 words; this file keeps everything it leaves out, day by day,
with the commit behind each claim. Hashes link to the repository; the red
runs are in `docs/red-runs.md`, the numbers in `docs/tuning.md` and
`docs/load-test.md`, the big decisions in `docs/decisions/`.

Throughout, the split was the same: the agent (Claude, in Claude Code)
wrote nearly all the code and drafted every document; I set the direction
in chat, decided what to build and what to cut, played the builds, and sent
back what was wrong. Where a document below says "I decided", a chat
message of mine is behind it; where it says "the agent found", the agent
found it running something.

## Week 9, the gate (to 5 October, `46eedd6`)

The first Earshot was a flat island. Each visitor was a bird; what you
typed reached only the birds within eight tiles, filtered on the server;
a pressure plate twenty-one tiles from a keypad showed a three-digit code
only to the bird standing on it, and a second bird at the keypad had to type
it. The door relocked at Canberra midnight with a new code, and every
opening was written to a table that refused updates and deletes. Thirteen
tests drove a running server, thirty simulated walkers against Fly answered
in 146 ms at the 95th percentile, and crit 8 shipped it
([`46eedd6`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/46eedd6)).

What the pod did with it: opened the gate once, then stood around. Alone,
I could only walk. The tutor's note was that a borrowed idea (the distance
rule is Big Walk's) needs its own variation. That is the whole reason for
the next section.

## 10 October, from the gate to the ship

My two worries, written down before anything else: cooperation had not
been designed, only permitted, and the trace people left was too light.

**Research first.** Two agents read for a day: 29 games and papers on
cooperation at a distance, and the class's 114 READMEs, each with its
source checked
([`6c20b7a`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/6c20b7a),
`docs/research.md`, `docs/cohort-survey.md`). Both reports said the same
two things: the strong designs make a second person necessary by a rule,
not by a lock, and they keep an artefact that is the attributed record.
Half the class had built a shared canvas; that was the median answer and I
did not want it.

**Design before code.** The design note and the first decision record went
in first
([`5068bf0`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/5068bf0)).
The record weighs four ways to make hands matter and picks the third: one
person can do everything aboard, but only from where they stand, and
everything runs down when left. I changed three things in the agent's
draft before approving it: the view would be blocks over the bird's
shoulder, not top-down; there would always be ships at the pier, not a new
hull five minutes after a sinking; and one person must always be able to
sail, because Big Walk's reviews name its lack of a solo mode as its fault
and the crit 8 pod had just shown me the same thing.

**Red, then green.** Eleven tests for the ship went in as one commit
([`c5b36c4`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/c5b36c4)):
one holder per station, an unheld sail loosens, two bodies keep speed
through a turn where one running between them does not, reefs flood and a
pump empties, a sinking writes a wreck nobody can change, a ship nobody is
aboard keeps running down, the first landing is written once, only the
chart table is sent the map. Run against the gate server in a worktree
they failed 11 of 11 in 57 seconds. The server made them green
([`605d8f0`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/605d8f0)),
the top-down client followed
([`e72c8a4`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/e72c8a4)),
then README and CLAUDE.md
([`c8280f3`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/c8280f3))
and the crit 9 PROCESS and reflection
([`f8dfc80`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/f8dfc80)).

**Played the same night.** A script drove two real browsers, a 1600-wide
keyboard and a 390-wide phone, with a third socket watching. They reached
all three islands in seventy seconds and never touched the pump; alone, I
reached the near island in ten. The numbers were far too soft (a ship
crossed the whole sea in thirty seconds) and three smaller things came out
of the same run: a ship rammed an island in silence, so the crew are now
told "Aground"; a ship left at sea sank in sixty-four seconds and its
wreck read "nobody aboard aboard", fixed; and on the phone a toast covered
the Use button. The soft numbers waited for the simulator, two days later.

## 11 October, the weekend

**The block view.** three.js 0.186.1 vendored into `public/vendor/` (MIT,
two megabytes, 418 KB gzipped; the server gzips static files keyed by
mtime), loaded through an import map with no bundler
([`f5c28f6`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/f5c28f6)).
The camera sits over the bird's shoulder and turns with the ship; WASD is
relative to the camera and arrives at the server as a unit vector in deck
coordinates. That changed a rule: the helm now turns on the port/starboard
part of the holder's input, and the two turning tests, rerun against the
crit 9 server, went red (heading stayed 0) before the server fixed it
([`a00c0be`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/a00c0be)
red,
[`a201e65`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/a201e65),
[`6586fcd`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/6586fcd)).

**Four things from a phone on the house wifi.** I played the block view on
a phone against the laptop and sent four faults. The deck flickered when I
dragged the view: coplanar faces (hull top and deck, rails and deck side,
the water slab's underside), fixed by small offsets. Three ships sat on top
of each other: berths went to y 26, 32 and 38, and a moored ship found off
its berth at startup is put back. Ships passed through each other: the
hull is now three points (centre, bow 3.5 ahead, stern 2.5 behind) checked
against land and reef, and ships keep five tiles apart; the test "stop
short of another ship" failed against the crit 9 server (the mover passed
through to x 48.3) before it passed. And "I'm taking water without touching
anything": only the ship's centre tile had been checked, and reefs were
invisible under the deck; now all three points are checked, the crew are
told "Reef under the hull", and the status line shows the hull. Landing
range widened from 1.2 to 4.5 tiles so a bow at the shore counts.

**Names and the board.** I asked for a first-visit card, a typed name, and
a ranking in the top-right corner. The agent argued for a log instead of a
ranking (a ranking is the thing the README says it will not build) and I
agreed: the harbour board lists every landing and wreck with names, crew
size and day, newest first, no points
([`a201e65`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/a201e65),
[`6586fcd`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/6586fcd),
decision records 4 and 5). Names are free text, NFKC-normalised, letters
and digits only, sixteen characters; the server keeps no account. The
tests for names and the board failed 4 of 4 before the server had `rename`
and `visits`.

**Three reviews with borrowed eyes.** Three agents read the deployed app
with narrow briefs: a marker with the final brief open, the tutor who had
marked my first two assignments, and a classmate playing it cold. The
marker found that three ships abandoned intact at sea left the harbour
empty for good; I decided berths refill five seconds after their ship
leaves and face open water
([`a201e65`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/a201e65);
the refill test failed before `refillBerths` existed). The tutor found the
fault my first two assignments had: the point was not on the first screen.
The README's first paragraph was rewritten around one sentence from that
review, "one person can do everything aboard, but only from where they
stand", and the card carries it too. The player could not find the helm on a phone,
was told "Aground" at the edge of the chart, and read their own sinking as
news about someone else; those became signs over the stations, "The chart
ends here", and a second-person toast
([`40c9d1c`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/40c9d1c)
red,
[`662499b`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/662499b),
[`8327c0b`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/8327c0b),
[`df59caf`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/df59caf)).
The same pass moved the test server to a free port (8770 was taken by
macOS's own sharing daemon), spread arrivals across the pier by a hash of
the public id so names stop overlapping, and started `docs/red-runs.md`.

**Notes, the crew channel, gestures.** I decided notes on the ground stay
and are removed only by their writer, and that chat gets a "what you heard"
panel but not a harbour-wide channel: a wider channel would undo the
earshot rule, and the decision record says so
([`b6cb1ef`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/b6cb1ef)).
Shift+Enter speaks to the crew alone and a word nobody heard says so. Four
gestures (wave, jump, nod, shake) are borrowed from a classmate's campus
prototype, with the source named in the design note. All three went in red
first (3 of 3 failed against the previous commit, no `emote` within two
seconds) and then green
([`59df9e0`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/59df9e0),
[`3b901bf`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/3b901bf),
[`4461cfb`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/4461cfb)).

**Small commits from here.** The crit 9 judge said work landed in batches
reads as "only said". From this evening each change is its own pair: the
six decision records one by one
([`57fa83b`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/57fa83b)
to
[`b6cb1ef`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/b6cb1ef)),
the log for crit 10
([`f1f1dac`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/f1f1dac)
red,
[`bb48b3d`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/bb48b3d)
green; the test reads the server's stdout and expects a refusal line by
name and id), and the simulator
([`b6fb61b`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/b6fb61b),
[`b5d7677`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/b5d7677)).

## 12 October, small hours: tuning by simulated crews

`pnpm crews` starts its own server per run at five times real time (a
test-only switch, physics per tick so only the waiting changes), boards one
to four bots with a fixed strategy per headcount, and records landed,
wrecked or timed out, the time, and the furthest point. Four sweeps, in
`docs/tuning.md`.

The first sweep said the problem was not the numbers: with the shipped
numbers everyone landed everywhere, solo to the far island in 27 s, and
making the ship slower and the reefs nastier only made the solo far run
fail. Two rules were wrong. The heading held itself when the helm was let
go, so a two-crew ship (one on the sail, one setting a course and then
pumping) was as good as three; and reefs were spread evenly, so a navigator
at the chart table had nothing to find. The helm now wanders when unheld
and the reefs come in clumps with lanes
([`0f828aa`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/0f828aa)),
and a ladder appeared.

The simulator had three faults of its own on the way, each found by a
table that made no sense: a ship that sank in the same instant its snapshot
vanished was counted as a timeout, which hid most of the wrecks; the
navigator's path search compared its estimate with its cost and never found
a route, so the "four-crew" had been steering straight all along; and the
route out of the harbour ran along the row of berths into the next ship.
All three in one commit
([`b845fd9`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/b845fd9)),
then the numbers and the README's "measured, not promised" paragraph
([`a24afba`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/a24afba)).
The spec pins its own fast numbers, so a tuning change never moves a test;
that rule went into CLAUDE.md the same night.

Then the Fly load run for this build (thirty walkers, 92 ms at the 95th
percentile, 102 MB), PROCESS rewritten for crit 10
([`42984c1`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/42984c1)),
the reflection
([`29ad6ca`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/29ad6ca)),
and the `crit-9` tag moved to that commit before the cutoff.

## 12 October, afternoon: the phone, the holes, and a leak of my own

I played the deployed build on a phone and sent three things. A new ship
appeared in the berth before mine had left, and they collided: a berth now
refills only once nothing is within seven tiles of it
([`eeafda7`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/eeafda7)).
The dark-blue tiles meant nothing to me: reefs are now grey rocks in a ring
of white water, and the card says what they do
([`356e559`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/356e559)).
And my ship was still taking water with nothing in sight.

Then I asked for the change that defined the afternoon: the reefs were too
dense and a holed ship sank with nothing to be done about it, so the hull
should be holed where it struck, the spot should show, and a person should
be able to walk there and repair it, alone if need be, without touching the
earlier rules. The agent wrote the test first (a scrape opens a hole at the
part that hit; a body standing on it and holding closes it; the water
stops rising), ran it against the deployed commit and watched it fail (no
hole within six seconds), then built it: holes per deck tile, two spots
each for bow, centre and stern, the hull as their sum, water rising only
while a hole is open, a `leaks` column added to the ships table behind a
guard, the snapshot's thirteenth field, log lines for holed and patched
([`f6f7488`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/f6f7488)
red,
[`20413e3`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/20413e3),
[`a2e7799`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/a2e7799),
[`52267b4`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/52267b4)).
Before accepting it the agent broke the rule once, repair rate set to zero,
and watched the test go red again. Screenshots at 1280 and 390 are how the
red tiles, the sign and the hint were checked, as for every visual change.

**Thinner reefs, and the measurement that was wrong.** Four thinner seas
were measured, and the tables came back strange: median landing times
doubled, four-crew runs timing out. The cause was in the simulator: a run
that ended by landing or wrecking returned before stopping its server, so
every such run left a process behind, and by the time the load average
said so there were 398 of them on ten cores. Every table of the session
had been taken on a machine that was getting slower. The strays were
killed, the leak fixed with a `finally`
([`1fab797`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/1fab797)),
and the shipped numbers were measured again on a quiet machine: the same
ladder as the published table, within a run or two per cell, so that table
stood. Then five candidate seas, twelve runs per cell. Every thinner sea
let a solo bot reach the middle island, and a harder scrape did not bring
that rung back, so the thinnest sea was kept and the README now says what
is measured: one and two reach the near and middle islands, three the far
island a third of the time, four every time, and no bot ever patches a hole
([`0e43732`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/0e43732)).
The sea is 21% reef instead of 32%.

**Reading my own sinking.** "I stand on the damaged spot and can't repair
it," I said. The agent read the live log of that run rather than guessing:
three holes opened in one second because all three hull points were over
rock; I patched one in 1.3 s, held the second for 0.9 s and left for the
pump; the ship, still lying on the reef, kept being torn while I patched;
and the pump line shows takes and lets-go 100 to 250 ms apart, a finger
sliding off a button. Four changes, each from a line of that log: a reef
now holes a moving hull as fast as it is going and a ship lying still takes
no more (test first, red against the previous commit: a still ship had two
holes after a second; two older tests that had relied on a still ship
being holed were rewritten rather than kept passing by accident);
repair twice as fast, set by hand from the log since no bot patches; the
hint shows "Patching the hole… 27%" and the red tile shrinks; and the Use
and walk buttons capture the pointer
([`3d2bf04`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/3d2bf04)
red,
[`9a274f7`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/9a274f7),
[`6eb7c63`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/6eb7c63)).
PROCESS caught up
([`cca2106`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/cca2106)).

## 14 October: words, after the A2 mark

Assignment 2 came back with the same comment as assignment 1: the marker
could not tell what it was about. So before touching the app again, an
agent with no context at all was given the deployed URL and asked what
this is, what you do in it, and why other people make it better. It
scored the first screen 3 of 5: it could infer a multiplayer sailing game
but no page said "game", "online" or that other real people were here;
"body" and "runs down" were never defined; the start button and the Q key
both said "ashore". The card and the README now open with a plain sentence
and the rest was reworded
([`f87d651`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/f87d651)).
A second cold read scored 4 of 5 and left three smaller snags, fixed the
same hour
([`2cb79bc`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/2cb79bc)).
The same check is now the last step before any crit.

## 14 to 18 October: played cold, and three reversals

Three agents with no context played the deployed build (a laptop alone, a
phone, two friends on two laptops) and reported in the first person. They
knew what it was within a minute and could not say what counted as
success. From their lists: flags on the islands that name the first crew
([`729c7c8`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/729c7c8)), a sinking that stays on screen and ships with seabird
names ([`7429834`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/7429834)), a click on a station sign that walks to the
middle of its tile ([`4e62725`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/4e62725)), three buttons that never move and a
board grouped by day ([`3655dd7`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/3655dd7)), and the crew-only channel removed,
test first ([`ed65651`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/ed65651), [`8c35c89`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/8c35c89)).

Three things I asked for and then took back, each after watching it:

- **The open sea.** I asked for far fewer reefs and a far island anyone
  could reach; the bots then landed everywhere at any crew size, and the
  ladder the README argued for was gone ([`7eb0313`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/7eb0313)). Played, it was
  empty. A thin scatter that thickens on the way out came back, nothing
  within thirty tiles of the pier, measured twice ([`0b91d33`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/0b91d33),
  [`45fc95a`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/45fc95a)): near and middle for everyone, the far island alone
  three times in four and with anyone else aboard every time.
- **The jump.** Space boarded a ship, landed you on an island beside it,
  or put you in the sea ([`6f29ed6`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/6f29ed6) red, [`6f18d05`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/6f18d05),
  [`8407841`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/8407841)). Boarding by jump felt like teleporting, and a Space
  press aboard put me in the sea by accident. Four days later the pier is
  the only way on or off, by E, and Space is a hop again ([`682c79f`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/682c79f)
  red, [`66f786e`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/66f786e)).
- **Three berths.** They had filled the pier with drifted, half-boarded
  hulls. One berth now, a countdown over everyone waiting, derelicts
  scuttled after five minutes ([`a0262da`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/a0262da) red, [`ef82d9f`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/ef82d9f)).

One rule caught me: island positions went into `hello` for the flags and
the chart test went red, since nobody but the body at the table is sent
the map. The islands travel with `near` now, only within sight
([`fd3a03b`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-anson0028/commit/fd3a03b)). The same days, all 125 of the class's final sites were
read by four agents and the strongest seven compared against this one; the
finding that stuck was that their first sentence is the rule itself.

## How the work was directed

- **CLAUDE.md is the README as rules**, and each rule has a date and a
  reason: never gate play on a headcount (decision record 1), never widen
  earshot (record 6), numbers change by simulation and the spec pins its
  own (the tuning night), a new act gets a log line in the same commit
  (crit 10's brief), words in the README match the code in the same commit.
- **Red before green, then break it once.** Every claim went in as a
  failing test against the server as it stood; `docs/red-runs.md` records
  each run. After a check passed, the rule it protects was broken once to
  see the test fail; the one that stayed green in week 9 (the keypad
  standing-on-the-plate rule, guarded by a database check instead) is
  written down as unreachable rather than quietly dropped.
- **Agents with narrow briefs** did the reading and the reviewing: two for
  research, three for review, two for cold reads, each told whose eyes to
  use and to find what I had missed. Their reports changed the README's
  first paragraph, the berth rule, the harbour board and a dozen smaller
  things; they did not decide.
- **Measure, don't feel.** Numbers came from `pnpm crews`; the load from
  thirty walkers against Fly; visual changes from Playwright screenshots at
  1280 and 390 and a keyboard-only pass; the player's complaints from the
  live log. The one number set by hand, the repair rate, says so.
- **Small commits, in order.** From the second evening, one change per
  commit pair, pushed as they happen; CI checks and deploys each push and
  the live URL is probed afterwards.

## The stack, and what it costs

Unchanged from crit 8: Node 24 runs the `.ts` files directly, `ws` carries
one socket per visitor, `node:sqlite` holds the state on the Fly volume,
three.js draws the view, and there is no framework, bundler or build step.
The obvious alternative was the Astro site of assignment 2 with a socket
server beside it, or a React client with Socket.io. Against them: the app
is one page and one process; a server that steps the ships twenty times a
second from who holds which station wants to own the state, not share it
with a framework; and every added layer is one more place a reef or a
pump could be computed on the wrong side. The costs are real and listed in
PROCESS: hand-written routing, an experimental SQLite module, two
megabytes of vendored three.js, and tests that must start their own
server. The machine has 256 MB and Node runs with a 160 MB heap; the load
runs are how that was checked rather than assumed.

## What was thrown away

The gate puzzle; the top-down view (one day old); "a new hull five minutes
after a sinking" in favour of berths that refill; a ranking in favour of a
log; a harbour-wide channel; the first simulator tables (wrong twice: once
for the simulator's own faults, once for the machine it ran on); a
harder-scrape set that took the far island away from four crews; and
reflections and process drafts rewritten at each crit rather than
appended, as the brief asks.

## Thin spots, honestly

The commits of 10 and 11 October were cut from one working tree at the end
of each evening; they are small and in order, but the red runs for them
are a table rather than one pair per claim. The ladder is bots: no crew of
strangers has sailed it, and the bots never patch. The block view has met
one phone in a real hand, mine. The fleet can grow to twelve ships left at
sea. The agent wrote most of the code and drafted this file and the
others; what is mine is the direction, the corrections, and the cuts.
