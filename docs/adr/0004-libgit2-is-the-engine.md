# libgit2 is the engine; git CLI is the oracle for remotes

The engine stays libgit2 (vendored `git2`) for the whole Repository: Graph, Working copy, and Fetch / Pull / Push / Clone. Size and in-process APIs (hunk staging, partial Stash, in-memory rebase, Account tokens in the credential callback) are why — not Push latency. GitHub Desktop's embedded git (dugite) and the user's PATH git were rejected: the former triples the download and still is not *their* git; the latter makes Windows-without-Git and Dock PATH into product bugs, and a libgit2 fallback on miss would restore the Drone-class dual-engine gap. Where libgit2 and `git` disagree on a Remote, CI compares **effects** on the same fixture (did the ref move, did receive-pack run, outcome class ok / up_to_date / rejected). A production surprise adds a row; it does not switch engines.

**Status**: accepted

**Considered options**: PATH git for Fetch/Pull/Push/Clone only · embed dugite · keep libgit2 and treat `git` as the Remote-effect oracle (chosen).
