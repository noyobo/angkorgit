# Outdated Packages Report

Generated: 2026-09-12  
**Updated: 2026-09-12 after Phase 1 completion**

This document lists all packages that have newer major versions available compared to the currently installed versions.

## ✅ Phase 1 Complete: Low-Risk Upgrades

Successfully upgraded the following packages with all 231 unit tests passing:
- **lucide-react**: 0.577.0 → **1.45.0** (stable v1 release)
- **sonner**: 1.7.4 → **2.0.8** (v2 toast notifications)
- **@xterm/xterm**: 5.5.0 → **6.0.0** (terminal v6)
- **@xterm/addon-fit**: 0.10.0 → **0.11.0**

## Desktop App (`apps/desktop`)

### Production Dependencies

| Package | Current | Latest | Notes |
|---------|---------|--------|-------|
| `@xterm/addon-fit` | 0.10.0 | **0.11.0** | Minor version update |
| `@xterm/xterm` | 5.5.0 | **6.0.0** | Major version (v6) |
| `framer-motion` | 11.18.2 | **13.2.0** | Major version jump (v11 → v13) |
| `lucide-react` | 0.577.0 | **1.45.0** | Major version (v0 → v1) |
| `react` | 18.3.1 | **19.3.0** | Major version (React 19) |
| `react-dom` | 18.3.1 | **19.3.0** | Major version (React 19) |
| `react-resizable-panels` | 2.1.9 | **4.12.4** | Major version (v2 → v4) |
| `react-router-dom` | 6.30.6 | **7.18.3** | Major version (v6 → v7) |
| `sonner` | 1.7.4 | **2.0.8** | Major version (v2) |

### Dev Dependencies

| Package | Current | Latest | Notes |
|---------|---------|--------|-------|
| `@types/react` | 18.3.31 | **19.3.0** | React 19 types |
| `@types/react-dom` | 18.3.7 | **19.3.0** | React 19 types |
| `tailwindcss` | 3.4.19 | **4.3.3** | Major version (Tailwind v4) |

## Website (`apps/website`)

| Package | Current | Latest | Notes |
|---------|---------|--------|-------|
| `astro` | 5.18.2 | **7.3.2** | Major version (v5 → v7) |
| `sharp` (dev) | 0.33.5 | **0.35.4** | Minor version updates |
| `tailwindcss` (dev) | 3.4.19 | **4.3.3** | Major version (Tailwind v4) |

## Root Package

No outdated packages detected at root level.

## Upgrade Recommendations

### High Priority (Breaking Changes Expected)

1. **React 19** (`react`, `react-dom`, `@types/react`, `@types/react-dom`)
   - Major version with new features and breaking changes
   - Requires careful testing of all React components
   - Many ecosystem packages may not yet support React 19

2. **Tailwind CSS v4** (`tailwindcss`)
   - Major rewrite with new engine
   - Likely requires configuration changes
   - Affects both desktop and website builds

3. **React Router v7** (`react-router-dom`)
   - Significant API changes
   - May require route refactoring

### Medium Priority

4. **Astro v7** (`astro`)
   - Website-only dependency
   - Check changelog for breaking changes

5. **framer-motion v13** (`framer-motion`)
   - Two major versions behind (v11 → v13)
   - Check for animation API changes

6. **react-resizable-panels v4** (`react-resizable-panels`)
   - Two major versions behind (v2 → v4)
   - Used for layout panels

### Low Priority (Likely Safe)

7. **lucide-react v1** (`lucide-react`)
   - Icon library moving to stable v1
   - Usually backward compatible

8. **sonner v2** (`sonner`)
   - Toast notification library
   - Check changelog for API changes

9. **@xterm/xterm v6** (`@xterm/xterm`, `@xterm/addon-fit`)
   - Terminal emulator update
   - Check terminal functionality after upgrade

## Action Items

### Option 1: Conservative Approach (Recommended)
- Keep current versions for stability
- Upgrade selectively after testing in a separate branch
- Focus on security patches only

### Option 2: Aggressive Upgrade
- Create a separate "upgrade-major-deps" branch
- Upgrade and test each major package individually
- Expect significant breaking changes with React 19 + Tailwind v4

### Option 3: Staged Rollout
1. **Phase 1**: ✅ COMPLETED - Upgraded low-risk packages (lucide-react 1.45.0, sonner 2.0.8, xterm 6.0.0)
2. **Phase 2**: TODO - Upgrade medium-risk packages (framer-motion, react-resizable-panels)
3. **Phase 3**: TODO - Upgrade high-risk packages (React 19, React Router 7)
4. **Phase 4**: TODO - Upgrade build tools (Tailwind v4, Astro v7)

## Notes

- All current versions are on their latest minor/patch releases within their major version
- `bun update -r` successfully updated all packages to their latest compatible versions
- Major version upgrades require manual intervention due to potential breaking changes
- Consider creating a testing branch for major upgrades before merging to main
