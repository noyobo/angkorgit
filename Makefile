.PHONY: build-app

SIGN_KEY := $(HOME)/.tauri/angkorgit.key

build-app:
ifeq ($(TAURI_SIGNING_PRIVATE_KEY)$(wildcard $(SIGN_KEY)),)
	bun run --cwd apps/desktop tauri build --config '{"bundle":{"createUpdaterArtifacts":false}}'
else
	TAURI_SIGNING_PRIVATE_KEY="$${TAURI_SIGNING_PRIVATE_KEY:-$$(cat $(SIGN_KEY))}" \
	TAURI_SIGNING_PRIVATE_KEY_PASSWORD="$${TAURI_SIGNING_PRIVATE_KEY_PASSWORD-}" \
	bun run --cwd apps/desktop tauri build
endif
