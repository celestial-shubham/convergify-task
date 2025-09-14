// AI: Test setup file (Claude assisted)

// Global test timeout
jest.setTimeout(30000);

// Suppress console logs during tests unless there's an error
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = () => {};
});

afterAll(() => {
  console.log = originalConsoleLog;
});

// Helper to wait for async operations
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Test constants
export const TEST_CONFIG = {
  USER_SERVICE_URL: 'http://localhost:3001/graphql',
  CHAT_SERVICE_URL: 'http://localhost:3002/graphql',  // We'll test with instance 1
  WS_URL: 'ws://localhost:3002/graphql',
  TEST_TIMEOUT: 10000,
};