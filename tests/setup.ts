// Bun test setup for React component testing
import { GlobalRegistrator } from '@happy-dom/global-registrator';
import '@testing-library/jest-dom';

// Register happy-dom global environment
// Provides DOM APIs (document, window, etc.) for tests
GlobalRegistrator.register();

// Cleanup after all tests complete
if (typeof afterAll !== 'undefined') {
  afterAll(() => {
    GlobalRegistrator.unregister();
  });
}
