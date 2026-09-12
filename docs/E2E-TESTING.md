# E2E Testing Guide

## Critical: Use Production Builds

**⚠️ E2E tests MUST run against production builds, not dev servers.**

### Why?

Rspack enables **lazy compilation** by default in development mode:
- Modules are compiled on-demand when accessed
- This causes **404 errors and MIME type issues** in CI environments
- JavaScript chunks fail to load, causing timeouts
- Documented in [Rspack Lazy Compilation Guide](https://rspack.rs/guide/advanced/lazy-compilation)

### Known Issues

From Rspack GitHub Issues:
- [#12444](https://github.com/web-infra-dev/rspack/issues/12444) - Lazy compilation doesn't work with changing dynamic entries
- [#10997](https://github.com/web-infra-dev/rspack/issues/10997) - Lazy compilation causes panics in E2E
- [#11843](https://github.com/web-infra-dev/rspack/pull/11843) - Flaky E2E tests with lazy compilation

**Official docs state**: *"Lazy compilation is only effective for dev builds and does not affect production builds."*

## Current Setup (Correct)

### CI Workflow (`.github/workflows/ci.yml`)

```yaml
- name: Serve production build and run tests
  run: |
    # Serve the production build with a simple HTTP server
    cd apps/desktop/dist
    python3 -m http.server 1420 &
    SERVER_PID=$!
    cd ../../..
    
    echo "Waiting for server..."
    for i in {1..30}; do
      if curl -s http://localhost:1420 > /dev/null; then
        echo "Server is ready"
        break
      fi
      sleep 1
    done
    
    bun run test:e2e
    kill $SERVER_PID || true
```

### Why This Works

✅ **No lazy compilation** - Production build is fully compiled  
✅ **No dynamic loading** - All JavaScript is static  
✅ **Fast & stable** - No on-demand compilation delays  
✅ **CI-friendly** - Static file serving is reliable  
✅ **Realistic** - Tests actual release artifacts

## Alternative (If You Must Use Dev Server)

If you have a specific need to test the dev server:

```javascript
// rspack.config.js
export default {
  lazyCompilation: false, // Disable for E2E tests
  // ... rest of config
}
```

Or via environment variable:

```javascript
export default {
  lazyCompilation: process.env.E2E_TEST ? false : true,
}
```

## Symptoms of Lazy Compilation Issues

If you see these errors in browser console during E2E tests:

```
Failed to load resource: 404
Refused to execute script from '...lazy-compilation-proxy.js'
because its MIME type ('text/html') is not executable
Loading chunk ... failed
```

**Solution**: Switch to production build immediately.

## Local Testing

### Run E2E tests (production build)
```bash
bun run build
cd apps/desktop/dist
python3 -m http.server 1420 &
cd ../../..
bun run test:e2e
```

### Run dev server (for development)
```bash
bun run dev
```

**Never** run E2E tests against `bun run dev` - it will work locally but fail in CI.

## Debugging E2E Failures

1. **Check browser console first** - Most issues show up there
2. **Look for 404s** - Usually indicates lazy compilation problems
3. **Check MIME type errors** - Another lazy compilation symptom
4. **Verify you're testing production build** - Check CI logs

## Lessons Learned (2026-09-12)

Initial E2E implementation used dev server, causing:
- All 3 smoke tests timing out in CI (30+ seconds)
- Browser console showed chunk loading failures
- Root cause: Rspack lazy compilation incompatible with CI

**Time wasted**: ~2 hours trying timeout increases before checking docs  
**Fix time**: 5 minutes after reading documentation  
**Lesson**: Always check official docs for known issues first

## References

- [Rspack Lazy Compilation](https://rspack.rs/guide/advanced/lazy-compilation)
- [Known Issue: Lazy compilation E2E problems](https://github.com/web-infra-dev/rspack/issues/12444)
- [CI fix examples](https://github.com/web-infra-dev/rspack/pull/11844)
