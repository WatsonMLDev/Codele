import { useState, useEffect, useRef } from 'react';
import { TestCase, TestResult } from '../types';

// The Worker code as a string
const WORKER_SCRIPT = `
importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js");

async function loadPyodideAndPackages() {
  self.pyodide = await loadPyodide();
}

let pyodideReadyPromise = loadPyodideAndPackages();

const INTROSPECTION_SCRIPT = \`
import inspect

def __find_entry_point__():
    # 1. Look for class Solution (LeetCode style)
    if 'Solution' in globals():
        try:
            Sol = globals()['Solution']
            sol_instance = Sol()
            # Find the first public method that isn't __init__
            methods = [m for m in inspect.getmembers(sol_instance, predicate=inspect.ismethod) if not m[0].startswith('_')]
            if methods:
                return methods[0][1]
        except Exception:
            pass

    # 2. Look for 'solve' function (Legacy style)
    if 'solve' in globals() and inspect.isfunction(globals()['solve']):
        return globals()['solve']

    # 3. Look for any user-defined function in __main__
    # We filter out imports and internal functions
    candidates = []
    for name, obj in globals().items():
        if inspect.isfunction(obj) and obj.__module__ == '__main__' and not name.startswith('_'):
             # Skip the finder function itself if it leaked into scope (though it shouldn't structurally)
             if name == '__find_entry_point__': continue
             candidates.append(obj)
    
    if candidates:
        # Return the last defined one (likely the user's code)
        return candidates[-1]
    
    return None

__ENTRY_POINT__ = __find_entry_point__()
\`;

self.onmessage = async (event) => {
  await pyodideReadyPromise;
  const { code, testCases } = event.data;
  const results = [];

  try {
    // 1. Run user code
    await self.pyodide.runPythonAsync(code);
    
    // 2. Find Entry Point
    await self.pyodide.runPythonAsync(INTROSPECTION_SCRIPT);
    const solve = self.pyodide.globals.get('__ENTRY_POINT__');

    if (!solve) {
        throw new Error("No launchable function found. Please define a function or 'class Solution'.");
    }

    // 3. Run Test Cases
    for (const test of testCases) {
        // Conciseness Check
        if (test.type === 'conciseness') {
             const trimmed = code.trim();
             const lines = trimmed === '' ? 0 : trimmed.split('\\n').length;
             const limit = parseInt(test.expected);
             
             let status = 'PASS';
             let message = \`Concise! (\${lines} lines)\`;
             
             if (lines > limit) {
                 status = 'WARN';
                 message = \`Used \${lines} lines. Target: \${limit}.\`;
             }
             
             results.push({
                 caseId: test.id,
                 status,
                 message,
                 durationMs: 0
             });
             continue;
        }

        let input;
        try {
            input = JSON.parse(test.input);
        } catch (e) {
             // Handle simple primitive inputs that might not be JSON strings
             input = test.input;
        }

        const expected = JSON.parse(test.expected);
        
        const startTime = performance.now();
        let actual;
        
        try {
             // Handle argument unpacking
             if (Array.isArray(input)) {
                 try {
                    actual = solve(...input);
                 } catch (e) {
                    actual = solve(input);
                 }
             } else {
                 actual = solve(input);
             }

        } catch (e) {
             throw new Error("Runtime Error: " + e.message);
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        let status = 'PASS';
        let message = 'Passed';
        
        // Deep Equality Check
        const isEq = JSON.stringify(actual) === JSON.stringify(expected);
        
        if (!isEq) {
            status = 'FAIL';
            message = \`Expected \${JSON.stringify(expected)}, but got \${JSON.stringify(actual)}\`;
        }
        
        results.push({
            caseId: test.id,
            status,
            message,
            durationMs: duration
        });
    }

  } catch (error) {
     const errorMsg = error.message;
     for (const test of testCases) {
         results.push({
             caseId: test.id,
             status: 'ERROR',
             message: errorMsg,
             durationMs: 0
         });
     }
  }

  self.postMessage(results);
};
`;

export const usePythonRunner = () => {
  const [isEngineReady, setIsEngineReady] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Initialize Worker
    const blob = new Blob([WORKER_SCRIPT], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));
    workerRef.current = worker;

    // We can assume it's "ready" for messages once created, 
    // though the internal pyodide load takes time.
    // Realistically we might want a ping/pong, but for this simplified scope:
    setIsEngineReady(true);

    return () => {
      worker.terminate();
    };
  }, []);

  const runCode = (code: string, testCases: TestCase[]): Promise<TestResult[]> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error("Worker not initialized"));
        return;
      }

      const worker = workerRef.current;

      // Safety Timer: 5 seconds max execution
      const timeoutId = setTimeout(() => {
        worker.terminate();

        // Re-create worker for next run since the old one is dead
        const blob = new Blob([WORKER_SCRIPT], { type: 'application/javascript' });
        workerRef.current = new Worker(URL.createObjectURL(blob));

        // Return Timeout Failure
        const timeoutResults: TestResult[] = testCases.map(tc => ({
          caseId: tc.id,
          status: 'FAIL' as const,
          message: 'Time Limit Exceeded (Infinite Loop?)',
          durationMs: 5000
        }));
        resolve(timeoutResults);
      }, 5000);

      const handleMessage = (event: MessageEvent) => {
        clearTimeout(timeoutId);
        worker.removeEventListener('message', handleMessage);
        resolve(event.data);
      };

      worker.addEventListener('message', handleMessage);
      worker.postMessage({ code, testCases });
    });
  };

  return { runCode, isEngineReady };
};