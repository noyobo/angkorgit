# Profiles are bound to a repository

Other Git clients switch a global identity and rewrite the user gitconfig. AngKorGit writes `user.name` / `user.email` and account bindings only into the open Repository's local config, so forgetting to "switch profile" cannot leak the wrong author onto another repo.

**Status**: accepted
