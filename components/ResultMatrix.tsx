import React from 'react';
import { Attempt, TestCase, TestStatus } from '../types';
import { MAX_ATTEMPTS } from '../constants';
import { AlertTriangle, Check, X, Clock } from 'lucide-react';

interface ResultMatrixProps {
  attempts: Attempt[];
  testCases: TestCase[];
  isRunning: boolean;
}

interface ResultCellProps {
  status: TestStatus;
  hint?: string;
  isPerf?: boolean;
}

const StatusIcon = ({ status }: { status: TestStatus }) => {
  switch (status) {
    case 'PASS':
      return <Check className="w-5 h-5 text-white" />;
    case 'FAIL':
      return <X className="w-5 h-5 text-white" />;
    case 'WARN':
      return <Clock className="w-5 h-5 text-yellow-900" />; // Darker icon for contrast on yellow bg
    case 'PENDING':
      return <div className="w-4 h-4 border-2 border-gray-500 border-t-white rounded-full animate-spin" />;
    default:
      return null;
  }
};

const ResultCell: React.FC<ResultCellProps> = ({ status, hint, isPerf }) => {
  // Determine cell styling based on status
  let bgClass = 'bg-gray-800 border-gray-700';
  let borderClass = 'border-gray-700';

  if (status === 'PASS') {
    bgClass = 'bg-green-500 border-green-600';
  } else if (status === 'FAIL') {
    bgClass = 'bg-red-500 border-red-600';
  } else if (status === 'WARN') {
    bgClass = 'bg-yellow-400 border-yellow-500';
  } else if (status === 'PENDING') {
    bgClass = 'bg-gray-700 border-gray-600';
  }

  return (
    <div className="relative group">
      <div
        className={`w-full aspect-square border-2 rounded-md flex items-center justify-center transition-all duration-300 ${bgClass} ${borderClass}`}
      >
        <StatusIcon status={status} />
      </div>
      
      {/* Tooltip for Errors/Warnings */}
      {(status === 'FAIL' || status === 'WARN') && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg shadow-xl text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="font-bold mb-1">
                {status === 'WARN' ? 'Performance Warning' : 'Test Failed'}
            </div>
            <p>{hint || "Unknown error occurred"}</p>
            {isPerf && status === 'WARN' && (
                <p className="mt-1 text-yellow-300 font-mono">Target: O(n)</p>
            )}
            {/* Tooltip Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

const ResultMatrix: React.FC<ResultMatrixProps> = ({ attempts, testCases, isRunning }) => {
  // We render MAX_ATTEMPTS rows. 
  // Fill existing attempts, then maybe a loading row, then empty rows.
  
  const rows = [];

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const attempt = attempts[i];
    
    // If we are on the current row and the game is running (simulating)
    const isCurrentLoadingRow = isRunning && i === attempts.length;

    const cells = testCases.map((tc, idx) => {
      let status: TestStatus = 'EMPTY';
      let hint = tc.hint;

      if (attempt) {
        status = attempt.results[idx]?.status || 'EMPTY';
      } else if (isCurrentLoadingRow) {
        status = 'PENDING';
      }

      return (
        <ResultCell 
            key={`${i}-${tc.id}`} 
            status={status} 
            hint={hint}
            isPerf={tc.type === 'performance'}
        />
      );
    });

    rows.push(
      <div key={i} className="grid grid-cols-6 gap-2 mb-2">
        {cells}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header Row */}
      <div className="grid grid-cols-6 gap-2 mb-2 text-center text-xs text-gray-400 font-mono uppercase tracking-wider">
        <div>Basic</div>
        <div>Edge</div>
        <div>Edge</div>
        <div>Logic</div>
        <div>Logic</div>
        <div className="text-yellow-500 font-bold">Perf</div>
      </div>
      {rows}
    </div>
  );
};

export default ResultMatrix;