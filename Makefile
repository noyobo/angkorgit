.DEFAULT_GOAL := help

.PHONY: help
help: ## Show this help message with grouped commands
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z0-9_-]+:.*##/ { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Development

.PHONY: dev
dev: ## Start frontend development server (Rspack HMR)
	bun run --cwd apps/desktop dev

.PHONY: tauri-dev
tauri-dev: ## Start full Tauri development (hot reload)
	bun run --cwd apps/desktop tauri dev

##@ Quality

.PHONY: format
format: ## Format code with Biome (write changes)
	bun run format

.PHONY: format-check
format-check: ## Check code formatting (CI-friendly)
	bun run format:check

.PHONY: typecheck
typecheck: ## Run TypeScript type checking across workspace
	bun run typecheck

.PHONY: lint
lint: ## Run linters across workspace
	bun run lint

.PHONY: check
check: ## Run all quality checks (format → typecheck → test)
	bun run format:check
	bun run typecheck
	bun test ./tests/unit

##@ Testing

.PHONY: test
test: ## Run unit tests
	bun test ./tests/unit

.PHONY: test-watch
test-watch: ## Run unit tests in watch mode
	bun test ./tests/unit --watch

.PHONY: test-e2e
test-e2e: ## Run E2E tests (Rstest + Playwright)
	bun run test:e2e

##@ Build

.PHONY: build
build: ## Build frontend packages
	bun run --filter '*' build

SIGN_KEY := $(HOME)/.tauri/angkorgit.key

.PHONY: build-app
build-app: ## Build Tauri app (signing-aware, local install)
ifeq ($(TAURI_SIGNING_PRIVATE_KEY)$(wildcard $(SIGN_KEY)),)
	bun run --cwd apps/desktop tauri build --config '{"bundle":{"createUpdaterArtifacts":false}}'
else
	TAURI_SIGNING_PRIVATE_KEY="$${TAURI_SIGNING_PRIVATE_KEY:-$$(cat $(SIGN_KEY))}" \
	TAURI_SIGNING_PRIVATE_KEY_PASSWORD="$${TAURI_SIGNING_PRIVATE_KEY_PASSWORD-}" \
	bun run --cwd apps/desktop tauri build
endif

##@ Release (macOS)

.PHONY: release-mac
release-mac: build-app ## Build app and open DMG folder (macOS)
	open apps/desktop/src-tauri/target/release/bundle/dmg

.PHONY: install-mac
install-mac: ## Install built app to /Applications (macOS)
	rm -rf /Applications/AngKorGit.app
	ditto apps/desktop/src-tauri/target/release/bundle/macos/AngKorGit.app /Applications/AngKorGit.app
	open -a /Applications/AngKorGit.app

##@ Miscellaneous

.PHONY: icons
icons: ## Regenerate app icons from source
	bun scripts/generate-icons.mjs
