import { TestCase, TestResult, TestStatus } from '../types';
import { MOCK_EXECUTION_DELAY } from '../constants';

// Helper to generate a random delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockRunCode = async (code: string, testCases: TestCase[]): Promise<TestResult[]> => {
  await delay(MOCK_EXECUTION_DELAY + Math.random() * 500);

  // Simple heuristic simulation based on code length or random chance
  // This allows the user to see different states by just clicking run multiple times 
  // (simulating debugging progress)
  
  const results: TestResult[] = [];
  
  // Decide the "outcome" of this run randomly for demo purposes
  const outcomeRoll = Math.random();
  
  let scenario: 'syntax_error' | 'logic_fail' | 'perf_fail' | 'all_pass' = 'logic_fail';

  if (outcomeRoll > 0.85) scenario = 'all_pass';
  else if (outcomeRoll > 0.55) scenario = 'perf_fail';
  else if (outcomeRoll > 0.2) scenario = 'logic_fail';
  else scenario = 'syntax_error';

  // Override: If code is very short (likely default), fail early
  if (code.length < 50) scenario = 'syntax_error';

  for (const tc of testCases) {
    let status: TestStatus = 'PASS';
    let message = 'Passed';
    let duration = Math.floor(Math.random() * 50);

    if (scenario === 'syntax_error') {
        // Fail everything or fail early
        status = 'FAIL';
        message = 'SyntaxError: unexpected EOF while parsing';
    } 
    else if (scenario === 'logic_fail') {
        // Fail specific types
        if (tc.type === 'edge' && Math.random() > 0.5) {
            status = 'FAIL';
            message = tc.hint;
        } else if (tc.type === 'logic' && Math.random() > 0.6) {
             status = 'FAIL';
             message = tc.hint;
        }
    }
    else if (scenario === 'perf_fail') {
        // Pass everything except performance
        if (tc.type === 'performance') {
            status = 'WARN';
            message = tc.hint;
            duration = 2500; // Slow!
        }
    }
    
    // In all_pass scenario, everything stays PASS (default)

    results.push({
      caseId: tc.id,
      status,
      message,
      durationMs: duration
    });
  }

  return results;
};
