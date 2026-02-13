import { DailyProblem, WeeklyTheme, CalendarDay } from '../types';

const API_BASE_URL = '/api/v1';

const MOCK_PROBLEM: DailyProblem = {
  "title": "Peak Performance Monitor",
  "difficulty": "Hard",
  "description": "Finding the maximum element in every sliding window of size k can be done in linear time using a monotonic queue. This data structure stores indices and ensures the elements are always in descending order.\n\nGiven an array nums and an integer k, return an array of the maximum values in each sliding window of size k.\n\nExample:\nInput: nums = [1,3,-1,-3,5,3,6,7], k = 3\nOutput: [3,3,5,5,6,7]\n\nExplanation: \nWindow [1,3,-1] -> max 3\nWindow [3,-1,-3] -> max 3\nWindow [-1,-3,5] -> max 5...",
  "starterCode": "from collections import deque\n\nclass Solution:\n    def maxSlidingWindow(self, nums: list[int], k: int) -> list[int]:\n        \"\"\"\n        Finds the maximum in each sliding window of size k.\n        \"\"\"\n        pass",
  "testCases": [
    {
      "id": 1,
      "type": "basic",
      "hint": "Use a deque to store indices of elements in descending order.",
      "input": "[1, 3, -1, -3, 5, 3, 6, 7], 3",
      "expected": "[3, 3, 5, 5, 6, 7]"
    },
    {
      "id": 2,
      "type": "edge",
      "hint": "If k=1, the output is the original array.",
      "input": "[1], 1",
      "expected": "[1]"
    },
    {
      "id": 3,
      "type": "logic",
      "hint": "Array sorted in descending order.",
      "input": "[5, 4, 3, 2, 1], 2",
      "expected": "[5, 4, 3, 2]"
    },
    {
      "id": 4,
      "type": "logic",
      "hint": "Array sorted in ascending order.",
      "input": "[1, 2, 3, 4, 5], 3",
      "expected": "[3, 4, 5]"
    },
    {
      "id": 5,
      "type": "edge",
      "hint": "Large window size equal to array length.",
      "input": "[1, -1], 2",
      "expected": "[1]"
    },
    {
      "id": 6,
      "type": "conciseness",
      "hint": "Pop indices from the back of the deque if the new element is larger.",
      "input": "Maximum lines for an O(N) monotonic queue solution.",
      "expected": "18"
    }
  ],
  "topics": [
    "Sliding Window",
    "Queue",
    "Monotonic Queue"
  ],
  "id": "2026-02-21"
};

export const ProblemService = {
  getDailyProblem: async (): Promise<DailyProblem> => {
    try {
      const response = await fetch(`${API_BASE_URL}/problem/today`);
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn("Failed to fetch daily problem, using mock data.", error);
      // Fallback for prototype / offline dev
      await new Promise(resolve => setTimeout(resolve, 500));
      return MOCK_PROBLEM;
    }
  },

  getProblemByDate: async (date: string): Promise<DailyProblem> => {
    try {
      const response = await fetch(`${API_BASE_URL}/problem/${date}`);
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
       console.error("Error fetching problem by date", error);
       throw error;
    }
  },

  getCalendar: async (month: string): Promise<CalendarDay[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/calendar?month=${month}`);
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching calendar", error);
      return [];
    }
  },

  getThemes: async (month?: string): Promise<WeeklyTheme[]> => {
    try {
      const query = month ? `?month=${month}` : '';
      const response = await fetch(`${API_BASE_URL}/themes${query}`);
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      
      const data = await response.json();
      // Map snake_case response to camelCase interface
      return data.map((item: any) => ({
        theme: item.theme,
        startDate: item.start_date,
        endDate: item.end_date,
        count: item.count,
        weekId: item.week_id,
      }));
    } catch (error) {
      console.error("Error fetching themes", error);
      return [];
    }
  }
};