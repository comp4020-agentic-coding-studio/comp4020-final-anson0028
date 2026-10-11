# 4. Names are typed, free, and not accounts

Date: 11 October 2026. Status: accepted.

## Context

Every visitor got a bird's name, unique and assigned by hash of their
cookie. It kept the app free of accounts and gave strangers something to
call each other. But the record it produced was anonymous: "first landing:
lucky magpie, brisk magpie" means nothing to the crit pod a day later, and
the research found that the strong classmates' designs (a seal per writer,
a shelf with both names) work because the names are the people's own.
Reviewers of my first two assignments said the same thing about everything
else: a stranger has to be able to tell what they are looking at.

## Options

1. **Bird names only.** Anonymous, safe, meaningless on the plaque.
2. **A typed name with the bird kept as a suffix**, "Anson the magpie".
   Keeps a trace of the system's naming; longer plaques; nobody asked for
   the bird.
3. **A typed name, free text, cleaned to letters, digits and spaces, 16 at
   most, duplicates allowed, the bird as the default.** The cookie stays
   the identity; the name is what the record shows.
4. **Accounts.** The README says why not: the room already knows who you
   are.

## Decision

Option 3. The first-visit card asks "What should the crew call you?" with
the bird name filled in; ? brings the card back for a change. The server
cleans the name and broadcasts the change; every record after it uses the
new name, and the old records keep the old one.

## Consequences

- Two people can be "Anson". Accepted: this is Shirky's situated software,
  a room of people who can see each other. If the URL ever leaves the
  course, this is the first thing to revisit.
- Emoji and punctuation are stripped silently. A character counter would
  help; not built.
- Nothing stops a rude name beyond its length. Same accepted risk as the
  bubbles.
- Records are strings of names, so renaming does not rewrite history. That
  is a feature: the plaque says what you were called when you landed.
