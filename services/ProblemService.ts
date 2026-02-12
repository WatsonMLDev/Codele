import { DailyProblem } from '../types';

// Helper to create a large array for performance testing (7000 elements)
// 7000 elements ensures O(n^2) solutions (~49M ops) take significant time (>2000ms) or timeout.
const generatePerfCase = () => {
  const arr = [];
  for(let i = 0; i < 7000; i++) {
    arr.push(i % 100); 
  }
  // Logic: 0..99 repeated 70 times each (7000 / 100 = 70).
  // Max harmonious subsequence is count(x) + count(x+1).
  // Each number appears 70 times. 70 + 70 = 140.
  return JSON.stringify(arr);
};

const DAILY_PROBLEM: DailyProblem = {
  id: "2026-02-12",
  title: "Longest Harmonious Subsequence",
  difficulty: "Medium",
  description: `We define a harmonious array as an array where the difference between its maximum value and its minimum value is **exactly 1**.

Given an integer array \`nums\`, return the length of its longest harmonious subsequence among all its possible subsequences.

A **subsequence** of array is a sequence that can be derived from the array by deleting some or no elements without changing the order of the remaining elements.

**Example 1:**
\`\`\`
Input: nums = [1,3,2,2,5,2,3,7]
Output: 5
Explanation: The longest harmonious subsequence is [3,2,2,2,3].
\`\`\`

**Constraints:**
- \`1 <= nums.length <= 10^5\`
- \`-10^9 <= nums[i] <= 10^9\`
`,
  starterCode: "def solve(nums):\n    # Write your solution here\n    pass",
  testCases: [
    { 
      id: 1, 
      type: "basic", 
      hint: "Check basic input case",
      input: "[1,3,2,2,5,2,3,7]",
      expected: "5"
    },
    { 
      id: 2, 
      type: "edge", 
      hint: "What if array is empty?", 
      input: "[]",
      expected: "0"
    },
    { 
      id: 3, 
      type: "edge", 
      hint: "Check negative numbers handling", 
      input: "[-1, -2, -2, -1]",
      expected: "4" 
    },
    { 
      id: 4, 
      type: "logic", 
      hint: "Check non-consecutive sequences", 
      input: "[1, 3, 5, 7]",
      expected: "0" 
    },
    { 
      id: 5, 
      type: "logic", 
      hint: "Single element array", 
      input: "[1]",
      expected: "0"
    },
    { 
      id: 6, 
      type: "performance", 
      hint: "Time Limit Exceeded! O(n²) detected. Target: O(n).", 
      input: generatePerfCase(),
      expected: "140"
    }
  ]
};

export const ProblemService = {
  getDailyProblem: async (): Promise<DailyProblem> => {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 800));
    return DAILY_PROBLEM;
  }
};