export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface TestCase {
  id: number;
  type: 'basic' | 'edge' | 'logic' | 'conciseness';
  hint: string;
  input: string; // JSON string representation of arguments
  expected: string; // JSON string representation of expected return value
}

export interface DailyProblem {
  id: string;
  title: string;
  difficulty: Difficulty;
  description: string;
  starterCode: string;
  testCases: TestCase[];
}

export type TestStatus = 'PASS' | 'FAIL' | 'WARN' | 'PENDING' | 'EMPTY' | 'ERROR';

export interface TestResult {
  caseId: number;
  status: TestStatus;
  message?: string; // specific error or feedback
  durationMs?: number;
}

export interface Attempt {
  id: string;
  timestamp: number;
  results: TestResult[];
}

export interface UserStats {
  currentStreak: number;
  maxStreak: number;
  lastWinDate: string | null;
  gamesPlayed: number;
  gamesWon: number;
  winDistribution: number[]; // Index 0 = 1 attempt, Index 5 = 6 attempts
}