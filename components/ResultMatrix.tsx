import React from 'react';
import { Attempt, TestCase, TestStatus, TestResult } from '../types';
import { MAX_ATTEMPTS } from '../constants';
import { AlertTriangle, Check, X, Clock, AlignLeft } from 'lucide-react';

interface ResultMatrixProps {
  attempts: Attempt[];
  testCases: TestCase[];
  isRunning: boolean;
  gameState?: 'PLAYING' | 'WON' | 'LOST';
  lastSandboxResult?: TestResult[];
}

interface ResultCellProps {
  status: TestStatus;
  hint?: string;
  isConciseness?: boolean;
  isLastColumn?: boolean;
}

const StatusIcon = ({ status, isConciseness }: { status: TestStatus; isConciseness?: boolean }) => {
  switch (status) {
    case 'PASS':
      return <Check className="w-5 h-5 text-white" />;
    case 'FAIL':
      return <X className="w-5 h-5 text-white" />;
    case 'WARN':
      // Use different icon for conciseness warning if desired, or generic clock/alert
      if (isConciseness) return <AlignLeft className="w-5 h-5 text-yellow-900" />;
      return <Clock className="w-5 h-5 text-yellow-900" />;
    case 'ERROR':
      return <AlertTriangle className="w-5 h-5 text-red-200" />;
    case 'PENDING':
      return <div className="w-4 h-4 border-2 border-gray-500 border-t-white rounded-full animate-spin" />;
    default:
      return null;
  }
};

const ResultCell: React.FC<ResultCellProps> = ({ status, hint, isConciseness, isLastColumn }) => {
  // Determine cell styling based on status
  let bgClass = 'bg-gray-800 border-gray-700';
  let borderClass = 'border-gray-700';

  if (status === 'PASS') {
    bgClass = 'bg-green-500 border-green-600';
  } else if (status === 'FAIL') {
    bgClass = 'bg-red-500 border-red-600';
  } else if (status === 'WARN') {
    bgClass = 'bg-yellow-400 border-yellow-500';
  } else if (status === 'ERROR') {
    bgClass = 'bg-red-900 border-red-800'; // Dark red for Syntax/Runtime Errors
  } else if (status === 'PENDING') {
    bgClass = 'bg-gray-700 border-gray-600';
  }

  // Tooltip positioning logic
  // If last column, anchor right to prevent overflow. Otherwise center.
  const tooltipPositionClass = isLastColumn
    ? "right-0 translate-x-0"
    : "left-1/2 -translate-x-1/2";

  const arrowPositionClass = isLastColumn
    ? "right-4"
    : "left-1/2 -translate-x-1/2";

  return (
    <div className="relative group">
      <div
        className={`w-full aspect-square border-2 rounded-md flex items-center justify-center transition-all duration-300 ${bgClass} ${borderClass}`}
      >
        <StatusIcon status={status} isConciseness={isConciseness} />
      </div>

      {/* Tooltip for Errors/Warnings */}
      {(status === 'FAIL' || status === 'WARN' || status === 'ERROR') && (
        <div className={`absolute z-50 top-full ${tooltipPositionClass} mt-2 w-56 px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg shadow-xl text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none break-words`}>
          <div className="font-bold mb-1 flex items-center gap-2">
            {status === 'WARN'
              ? (isConciseness ? 'Conciseness Check' : 'Warning')
              : (status === 'ERROR' ? 'Runtime Error' : 'Test Failed')}
          </div>
          <p className="font-mono text-[10px] leading-relaxed opacity-90">{hint || "Unknown error occurred"}</p>
          {/* Tooltip Arrow (pointing up, attached to top of tooltip) */}
          <div className={`absolute bottom-full ${arrowPositionClass} border-8 border-transparent border-b-gray-900`}></div>
        </div>
      )}
    </div>
  );
};

const ResultMatrix: React.FC<ResultMatrixProps> = ({ attempts, testCases, isRunning, gameState, lastSandboxResult }) => {
  // We render MAX_ATTEMPTS (6) rows fixed.
  // If attempts > 6, we render a 7th row that always shows the LATEST attempt.

  const rows = [];
  const isSandboxMode = gameState === 'WON';
  const showExtraRow = !isSandboxMode && (attempts.length > MAX_ATTEMPTS || (attempts.length === MAX_ATTEMPTS && isRunning));

  // Render the fixed rows (0 to 5)
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const attempt = attempts[i];
    const isCurrentLoadingRow = i === attempts.length && isRunning && !isSandboxMode;

    const cells = testCases.map((tc, idx) => {
      let status: TestStatus = 'EMPTY';
      let hint = tc.hint;
      const isLast = idx === testCases.length - 1;

      if (attempt) {
        const result = attempt.results[idx];
        if (result) {
          status = result.status;
          if (result.message && (status === 'ERROR' || status === 'FAIL' || status === 'WARN')) {
            hint = result.message;
          }
        }
      } else if (isCurrentLoadingRow) {
        status = 'PENDING';
      }

      return (
        <ResultCell
          key={`${i}-${tc.id}`}
          status={status}
          hint={hint}
          isConciseness={tc.type === 'conciseness'}
          isLastColumn={isLast}
        />
      );
    });

    rows.push(
      <div key={i} className="grid grid-cols-6 gap-2 mb-2">
        {cells}
      </div>
    );
  }

  // Render the Dynamic 7th Row if needed (Infinite attempts mode)
  if (showExtraRow) {
    const attemptToShow = isRunning ? undefined : attempts[attempts.length - 1];
    const isPending = isRunning;

    const cells = testCases.map((tc, idx) => {
      let status: TestStatus = 'EMPTY';
      let hint = tc.hint;
      const isLast = idx === testCases.length - 1;

      if (attemptToShow) {
        const result = attemptToShow.results[idx];
        if (result) {
          status = result.status;
          if (result.message && (status === 'ERROR' || status === 'FAIL' || status === 'WARN')) {
            hint = result.message;
          }
        }
      } else if (isPending) {
        status = 'PENDING';
      }

      return (
        <ResultCell
          key={`extra-${tc.id}`}
          status={status}
          hint={hint}
          isConciseness={tc.type === 'conciseness'}
          isLastColumn={isLast}
        />
      );
    });

    rows.push(
      <div key="extra-row" className="grid grid-cols-6 gap-2 mb-2 pt-2 border-t border-gray-800 relative">
        <div className="absolute -left-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-mono w-4 text-right">
          {attempts.length + (isRunning ? 1 : 0)}
        </div>
        {cells}
      </div>
    );
  }

  // --- Sandbox Mode Row ---
  const showSandboxRow = isSandboxMode && (lastSandboxResult || isRunning);

  return (
    <div className="w-full">
      {/* Header Row */}
      <div className="grid grid-cols-6 gap-2 mb-2 text-center text-xs text-gray-400 font-mono uppercase tracking-wider">
        <div>Basic</div>
        <div>Edge</div>
        <div>Edge</div>
        <div>Logic</div>
        <div>Logic</div>
        <div className="text-yellow-500 font-bold">Lines</div>
      </div>
      {rows}

      {/* Sandbox Indicator & Row */}
      {showSandboxRow && (
        <div className="mt-8 pt-4 border-t-2 border-dashed border-gray-800">
          <div className="flex items-center gap-2 mb-3 px-2">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
              Sandbox Run
            </div>
            <div className="text-[10px] text-gray-500 italic">Results not saved to stats</div>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {testCases.map((tc, idx) => {
              const result = lastSandboxResult?.find(r => r.caseId === tc.id);
              return (
                <ResultCell
                  key={`sandbox-${tc.id}`}
                  status={isRunning ? 'PENDING' : (result ? result.status : 'EMPTY')}
                  hint={result?.message || tc.hint}
                  isConciseness={tc.type === 'conciseness'}
                  isLastColumn={idx === testCases.length - 1}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultMatrix;