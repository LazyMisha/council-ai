# Test Current Diff

Inspect the current git diff, identify meaningful behavior changes, and add or update tests.

## Steps

1. Inspect git diff
   - Run `git diff` to see what changed.
   - Identify changed source files and the behavior being modified.

2. Find related tests
   - Look for existing test files adjacent to changed source files.
   - Check `*.test.ts` and `*.test.tsx` files.
   - Note which existing tests cover the changed areas.

3. Add meaningful tests
   - Add or update tests that cover the changed logic or UI behavior.
   - Prefer testing user-visible outcomes and data transformations.
   - Avoid brittle snapshots and Tailwind CSS class assertions.
   - Keep tests focused on behavior, not implementation details.

4. Run tests
   - Run `npm run test`.
   - Fix any failing tests caused by the changes.

5. Run quality checks
   - Run `npm run quality`.
   - Fix lint or type errors if needed.

6. Summarize
   - List which behavior is now covered by tests.
   - Note any remaining gaps or risks.

