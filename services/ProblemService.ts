import { DailyProblem, WeeklyTheme, CalendarDay } from '../types';

// Use Vite environment variable, fallback to relative path if not set
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api/v1';

const MOCK_PROBLEM: DailyProblem = {
  "title": "Peak Mountain Finder",
  "difficulty": "Medium",
  "description": "Binary search is typically associated with sorted lists, but it also works on any function with a discernible trend. A peak element is an element that is strictly greater than its neighbors.\n\nGiven an integer array nums where adjacent elements are never equal, find the index of any peak element. Imagine that nums[-1] and nums[n] are negative infinity.\n\nExample:\nInput: nums = [1, 2, 3, 1]\nOutput: 2\n\nExplanation: 3 is a peak element and its index is 2.",
  "starterCode": "def find_peak_element(nums: list[int]) -> int:\n    \"\"\"\n    Finds the index of a peak element in an unsorted array.\n    \"\"\"\n    pass",
  "testCases": [
    {
      "id": 1,
      "type": "basic",
      "hint": "If nums[mid] < nums[mid+1], a peak must exist to the right.",
      "input": "[[1, 2, 3, 1]]",
      "expected": "2"
    },
    {
      "id": 2,
      "type": "logic",
      "hint": "Check multiple peaks; any one is acceptable.",
      "input": "[[1, 2, 1, 3, 5, 6, 4]]",
      "expected": "5"
    },
    {
      "id": 3,
      "type": "edge",
      "hint": "The peak can be the last element.",
      "input": "[[1, 2]]",
      "expected": "1"
    },
    {
      "id": 4,
      "type": "edge",
      "hint": "The peak can be the first element.",
      "input": "[[2, 1]]",
      "expected": "0"
    },
    {
      "id": 5,
      "type": "logic",
      "hint": "Strictly increasing arrays have the peak at the end.",
      "input": "[[1, 2, 3, 4, 5]]",
      "expected": "4"
    },
    {
      "id": 6,
      "type": "conciseness",
      "hint": "Compare nums[mid] with nums[mid+1] to decide the search direction.",
      "input": "Code length check",
      "expected": "10"
    }
  ],
  "topics": [
    "Binary Search",
    "Array"
  ],
  "id": "2026-02-15"
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
      const data = await response.json();
      return data.days || [];
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