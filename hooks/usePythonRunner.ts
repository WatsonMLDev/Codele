import { useState, useEffect, useRef } from 'react';
import { TestCase, TestResult } from '../types';

// The Worker code as a string
const WORKER_SCRIPT = `
importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js");

async function loadPyodideAndPackages() {
  self.pyodide = await loadPyodide();
}

let pyodideReadyPromise = loadPyodideAndPackages();

self.onmessage = async (event) => {
  await pyodideReadyPromise;
  const { code, testCases } = event.data;
  const results = [];

  try {
    // 1. Run user code to define the function
    await self.pyodide.runPythonAsync(code);
    
    // 2. Check if 'solve' is defined
    const solve = self.pyodide.globals.get('solve');
    if (!solve) {
        throw new Error("Function 'solve' not found. Please define 'def solve(nums):'");
    }

    // 3. Run Test Cases
    for (const test of testCases) {
        const input = JSON.parse(test.input);
        const expected = JSON.parse(test.expected);
        
        const startTime = performance.now();
        let actual;
        
        try {
             // Pass input array to python function
             // Pyodide automatically converts JS arrays to Python lists
             actual = solve(input);
        } catch (e) {
             throw new Error("Runtime Error: " + e.message);
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        let status = 'PASS';
        let message = 'Passed';
        
        if (actual !== expected) {
            status = 'FAIL';
            message = \`Expected \${expected}, but got \${actual}\`;
        }
        
        results.push({
            caseId: test.id,
            status,
            message,
            durationMs: duration
        });
    }

  } catch (error) {
     // Global error (Syntax or Missing Function)
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
