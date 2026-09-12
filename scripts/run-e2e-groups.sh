#!/bin/bash

set -e

echo "======================================"
echo "Running E2E Tests by Group"
echo "======================================"
echo

FAILED=0
PASSED=0

for file in tests/e2e/0*.test.ts; do
    echo "Running $(basename $file)..."
    if timeout 60 bunx rstest "$file" > /tmp/e2e-result.txt 2>&1; then
        TESTS=$(grep '"tests":' /tmp/e2e-result.txt | grep -o '[0-9]\+' | head -1)
        TIME=$(grep '"total":' /tmp/e2e-result.txt | grep -o '[0-9]\+' | head -1)
        echo "✓ $(basename $file): $TESTS tests passed in ${TIME}ms"
        PASSED=$((PASSED + 1))
    else
        echo "✗ $(basename $file): FAILED"
        tail -50 /tmp/e2e-result.txt
        FAILED=$((FAILED + 1))
    fi
    echo
done

echo "======================================"
echo "Summary: $PASSED passed, $FAILED failed"
echo "======================================"

exit $FAILED
