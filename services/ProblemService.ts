import { DailyProblem } from '../types';

const DAILY_PROBLEM: DailyProblem = {
  id: "2026-02-12",
  title: "Longest Harmonious Subsequence",
  difficulty: "Medium",
  description: `We define a harmonious array as an array where the difference between its maximum value and its minimum value is **exactly 1**.

Given an integer array \`nums\`, return the length of its longest harmonious subsequence among all its possible subsequences.

**Example 1:**
\`\`\`
Input: nums = [1,3,2,2,5,2,3,7]
Output: 5
Explanation: The longest harmonious subsequence is [3,2,2,2,3].
\`\`\`

**Constraints:**
- \`1 <= nums.length <= 10^5\`
`,
  starterCode: "def solve(nums):\n    # Write your solution here\n    pass",
  testCases: [
    { 
      id: 1, type: "basic", hint: "Check basic input case",
      input: "[1,3,2,2,5,2,3,7]", expected: "5"
    },
    { 
      id: 2, type: "edge", hint: "What if array is empty?", 
      input: "[]", expected: "0"
    },
    { 
      id: 3, type: "edge", hint: "Check negative numbers handling", 
      input: "[-1, -2, -2, -1]", expected: "4" 
    },
    { 
      id: 4, type: "logic", hint: "Check non-consecutive sequences", 
      input: "[1, 3, 5, 7]", expected: "0" 
    },
    { 
      id: 5, type: "logic", hint: "Single element array", 
      input: "[1]", expected: "0"
    },
    { 
      id: 6, type: "conciseness", 
      hint: "Your code is too long! Try to keep it under 15 lines.", 
      input: "N/A",
      expected: "15" 
    }
  ]
};

export const ProblemService = {
  getDailyProblem: async (): Promise<DailyProblem> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return DAILY_PROBLEM;
  }
};