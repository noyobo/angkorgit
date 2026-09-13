# AngKorGit Documentation Hub

> **For AI assistants**: This is the central documentation index. Use section categories to find relevant docs quickly.

## 📚 Document Categories

### 🚀 Getting Started (New Contributors)

Start here if you're new to the project:

1. **[Getting Started](./Getting-Started.md)** — First-time setup and overview
2. **[Development](./Development.md)** — Daily workflow and commands
3. **[Contributing](./Contributing.md)** — How to contribute code

### 🏗️ Architecture & Design

Understand how AngKorGit is built:

1. **[Architecture](./Architecture.md)** — System design and component structure
2. **[UI Guidelines](./UI-Guidelines.md)** — Design system and UI patterns
3. **[Coding Standards](./Coding-Standards.md)** — Code style and conventions

### ✅ Quality Assurance

Maintain code quality and prevent issues:

1. **[Quality Checklist](./Quality-Checklist.md)** ⭐ — Systematic quality gates (design → deployment)
2. **[Testing Guide](./Testing-Guide.md)** ⭐ — Test pyramid, strategies, best practices
3. **[Launch Checklist](./Launch-Checklist.md)** — Pre-release verification

### 📦 Distribution & Release

Ship the product:

1. **[Distribution](./Distribution.md)** — Building, signing, and releasing
2. **[Roadmap](./Roadmap.md)** — Feature planning and priorities

### 🔄 Migration & Compatibility

Handle transitions:

1. **[From GitHub Desktop](./From-GitHub-Desktop.md)** — Migration guide
2. **[PARITY](./PARITY.md)** — Feature parity tracking with upstream

### 🤖 For AI Assistants

Special documents optimized for AI understanding:

1. **[CLAUDE.md](../CLAUDE.md)** ⭐⭐⭐ — **Primary knowledge base** (comprehensive project context)
2. **[Quality Checklist](./Quality-Checklist.md)** — Lessons from production issues
3. **[Testing Guide](./Testing-Guide.md)** — When to write what tests

---

## 🎯 Quick Navigation by Task

### "I want to..."

#### Add a New Feature
1. Read [Architecture](./Architecture.md) → understand subsystems
2. Follow [Quality Checklist](./Quality-Checklist.md) → design → test → implement
3. Check [Testing Guide](./Testing-Guide.md) → write unit tests first
4. Update [Roadmap](./Roadmap.md) → mark as shipped
5. Follow PR template checklist

#### Fix a Bug
1. Check [Testing Guide](./Testing-Guide.md) → debugging strategies
2. Write failing test first (unit > e2e)
3. Fix the bug
4. Verify test passes
5. Add to [Quality Checklist](./Quality-Checklist.md) if it's a recurring pattern

#### Review Code
1. Use [Quality Checklist](./Quality-Checklist.md) → PR checklist section
2. Verify [Coding Standards](./Coding-Standards.md) compliance
3. Check [Testing Guide](./Testing-Guide.md) → test coverage appropriate?
4. Ensure [UI Guidelines](./UI-Guidelines.md) followed (for UI changes)

#### Understand the Codebase
1. Start with [Architecture](./Architecture.md) → system overview
2. Check [CLAUDE.md](../CLAUDE.md) → detailed subsystem docs
3. Look at [Development](./Development.md) → commands and workflow
4. Review [Coding Standards](./Coding-Standards.md) → conventions

#### Prepare for Release
1. Follow [Launch Checklist](./Launch-Checklist.md)
2. Update [Roadmap](./Roadmap.md) → move shipped features
3. Verify [Distribution](./Distribution.md) → build process
4. Update CHANGELOG.md

---

## 📋 Document Metadata

| Document | Type | Audience | Last Major Update | AI Priority |
|----------|------|----------|-------------------|-------------|
| [CLAUDE.md](../CLAUDE.md) | Reference | AI, All | 2026-09 | ⭐⭐⭐ Primary |
| [Quality-Checklist.md](./Quality-Checklist.md) | Process | Developers | 2026-09-13 | ⭐⭐ High |
| [Testing-Guide.md](./Testing-Guide.md) | Reference | Developers | 2026-09-13 | ⭐⭐ High |
| [Architecture.md](./Architecture.md) | Reference | All | 2026-09 | ⭐⭐ High |
| [Development.md](./Development.md) | Guide | Developers | 2026-09-13 | ⭐ Medium |
| [Getting-Started.md](./Getting-Started.md) | Tutorial | New Contributors | 2026-09 | ⭐ Medium |
| [Contributing.md](./Contributing.md) | Guide | Contributors | 2026-09 | ⭐ Medium |
| [Coding-Standards.md](./Coding-Standards.md) | Reference | Developers | 2026-09 | ⭐ Medium |
| [UI-Guidelines.md](./UI-Guidelines.md) | Reference | UI Developers | 2026-09 | ⭐ Medium |
| [Launch-Checklist.md](./Launch-Checklist.md) | Checklist | Maintainers | 2026-09 | Medium |
| [Distribution.md](./Distribution.md) | Guide | Maintainers | 2026-09 | Medium |
| [Roadmap.md](./Roadmap.md) | Planning | All | 2026-09 | Medium |
| [From-GitHub-Desktop.md](./From-GitHub-Desktop.md) | Guide | Users | 2026-09 | Low |
| [PARITY.md](./PARITY.md) | Tracking | Maintainers | 2026-09 | Low |

---

## 🤖 AI Assistant Guidelines

### When to Read What

**For Code Changes**:
1. Always check [CLAUDE.md](../CLAUDE.md) first (§6 for frontend, §5 for Rust)
2. Follow [Quality Checklist](./Quality-Checklist.md) → design phase
3. Write tests per [Testing Guide](./Testing-Guide.md)
4. Verify [Coding Standards](./Coding-Standards.md) compliance

**For Bug Fixes**:
1. [CLAUDE.md](../CLAUDE.md) § 8 (Gotchas) → known issues
2. [Testing Guide](./Testing-Guide.md) § 6 (Debugging) → strategies
3. [Quality Checklist](./Quality-Checklist.md) § 6 (Debugging) → visual techniques

**For Architecture Questions**:
1. [CLAUDE.md](../CLAUDE.md) § 1-3 (What/Stack/Layout)
2. [Architecture.md](./Architecture.md) → high-level overview
3. Grep codebase for actual implementation

**For Testing Questions**:
1. [Testing Guide](./Testing-Guide.md) → comprehensive reference
2. [Quality Checklist](./Quality-Checklist.md) § 2 (Test Pyramid)
3. Check `tests/unit/` and `tests/e2e/` for examples

### Document Relationships

```
CLAUDE.md (Primary: all subsystems)
    ↓
    ├─→ Architecture.md (High-level design)
    ├─→ Quality-Checklist.md (Quality processes)
    │   └─→ Testing-Guide.md (Test details)
    ├─→ Coding-Standards.md (Style rules)
    ├─→ UI-Guidelines.md (Design patterns)
    └─→ Development.md (Daily workflow)
        ├─→ Getting-Started.md (First-time setup)
        └─→ Contributing.md (Contribution process)
            └─→ Launch-Checklist.md (Release)
                └─→ Distribution.md (Build & ship)
```

### Search Strategies

**By Topic**:
- **Git operations**: CLAUDE.md § 5 (Rust engine)
- **React components**: CLAUDE.md § 6 (Frontend), UI-Guidelines.md
- **Testing**: Testing-Guide.md (comprehensive), Quality-Checklist.md (process)
- **Accessibility**: Quality-Checklist.md § 1, Testing-Guide.md § 1
- **CI/CD**: Quality-Checklist.md § 7, Distribution.md
- **Commands**: Development.md § 2 (table)

**By File Path**:
- `apps/desktop/src/` → CLAUDE.md § 6 (Frontend)
- `apps/desktop/src-tauri/` → CLAUDE.md § 5 (Rust)
- `packages/core/` → CLAUDE.md § 3 (Core logic)
- `tests/` → Testing-Guide.md

---

## 📝 Contributing to Docs

### Adding a New Document

1. Create the document with clear frontmatter:
   ```markdown
   # Document Title
   
   > **Purpose**: One-sentence summary for AI assistants
   > **Audience**: Who should read this
   > **Related**: Links to related docs
   ```

2. Add entry to this README.md:
   - Categorize appropriately
   - Add to metadata table
   - Update relationship diagram if needed

3. Update cross-references in related docs

4. Add to [Development.md](./Development.md) Quick Links if relevant

### Document Quality Standards

✅ **Good Documentation**:
- Clear purpose statement at top
- Hierarchical structure (## → ### → ####)
- Code examples with context
- Cross-references to related docs
- Updated date in metadata

❌ **Avoid**:
- Duplicate information (link instead)
- Outdated examples
- Vague titles ("Misc", "Other")
- Missing context

---

## 🔄 Maintenance

### When to Update

- **After major features**: Update relevant docs + CLAUDE.md
- **After bug fixes**: Add to Quality-Checklist.md if pattern emerges
- **Quarterly reviews**: Check for outdated info
- **Before releases**: Verify all checklists

### Review Schedule

| Document | Review Frequency | Owner |
|----------|------------------|-------|
| CLAUDE.md | After each major feature | Maintainers |
| Quality-Checklist.md | After production issues | All developers |
| Testing-Guide.md | Quarterly | QA/Testing team |
| Roadmap.md | Monthly | Product owner |
| Others | As needed | Relevant contributors |

---

## 🆘 Getting Help

**Can't find what you need?**

1. Search this document for keywords
2. Check [CLAUDE.md](../CLAUDE.md) (most comprehensive)
3. Grep the `docs/` directory
4. Ask in team chat with context

**Found outdated info?**

1. Create an issue or PR to fix it
2. Tag with `documentation` label
3. Update this index if structure changed

---

## 📊 Documentation Stats

- **Total Documents**: 14 markdown files
- **Lines of Documentation**: ~15,000+ lines
- **Primary Reference**: CLAUDE.md (~1,500 lines)
- **Latest Addition**: Quality-Checklist.md + Testing-Guide.md (2026-09-13)

**Coverage**:
- ✅ Architecture: Comprehensive
- ✅ Development: Complete
- ✅ Testing: Detailed (new!)
- ✅ Quality Process: Documented (new!)
- ⚠️ User Guides: Basic
- ⚠️ API Docs: In code comments

---

*Last Updated: 2026-09-13*  
*Maintainer: Team*  
*Questions? Check [Contributing.md](./Contributing.md)*
