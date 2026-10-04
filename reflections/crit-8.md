# Crit 8 — It's alive!

**The breakthrough.**

The spike worked. Two browsers saw each other, bubbles stopped at 8 tiles,
the gate opened, the tests were green. Then I wrote down the claim the whole
project rests on, that the plate is out of earshot of the keypad, and the
test failed straight away. The plate was 5 tiles from the keypad. Two people
could stand still and type the code to each other. The 8-tile rule was in
the code and tested, and the puzzle never needed it.

Moving the plate 21 tiles away was the breakthrough. Now someone has to walk
the code over, or two people stand in a chain and pass it along. In a real
room someone just shouts, and that is still the game: the screen decides who
knows the code, and people have to talk to get it across.

**What it changed.**

Twice this week I trusted the wrong signal. Thirty bots on my laptop came
back within 99 ms. The same bots against the real machine took 1.26 s, and
the cause was snapshots I had never looked at. Then I broke a rule on
purpose and no test went red. The plate-holder can never reach the keypad,
so that rule never runs.

So I've changed two habits. I run the simulator against the deployed
machine before I believe a number. And the first test I write is for the
rule the idea rests on, before I build anything on top of it.
