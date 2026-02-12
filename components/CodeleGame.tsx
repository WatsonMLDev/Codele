import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Play, RotateCcw, AlertCircle, Trophy, Terminal, FileText, Code, Activity, Calendar, Loader2 } from 'lucide-react';
import CodeEditor from './CodeEditor';
import ResultMatrix from './ResultMatrix';
import { MAX_ATTEMPTS } from '../constants';
import { ProblemService } from '../services/ProblemService';
import { usePythonRunner } from '../hooks/usePythonRunner';
import { Attempt, TestResult, DailyProblem } from '../types';

// --- Helper Functions ---

const getDifficultyColor = (diff: string) => {
  switch (diff) {
    case 'Easy': return 'text-green-400';
    case 'Medium': return 'text-yellow-400';
    case 'Hard': return 'text-red-400';
    default: return 'text-white';
  }
};

const parseMarkdown = (text: string) => {
  // Simple markdown parser for description
  const parts = text.split(/(```[\s\S]*?```)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      // Code Block
      const content = part.slice(3, -3).trim();
      return `<pre class="bg-gray-800/50 p-3 rounded-md my-3 overflow-x-auto border border-gray-700"><code class="text-sm font-mono text-gray-300">${content}</code></pre>`;
    } else {
      // Regular Text
      let html = part
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
        .replace(/`([^`]+)`/g, '<code class="bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-indigo-200 border border-gray-700/50">$1</code>')
        .replace(/^\s*-\s+(.*)$/gm, '<li class="ml-4 list-disc text-gray-300">$1</li>')
        .replace(/\n/g, '<br />');
        
      return `<span class="text-gray-300 leading-relaxed">${html}</span>`;
    }
  }).join('');
};

// --- Sub-Components ---

const MarkdownRenderer = memo(({ content }: { content: string }) => {
  const htmlContent = parseMarkdown(content);
  return (
    <div 
      className="prose prose-invert prose-sm max-w-none space-y-4"
      dangerouslySetInnerHTML={{ __html: htmlContent }} 
    />
  );
});

const ProblemPanel = memo(({ problem }: { problem: DailyProblem }) => (
  <div className="h-full flex flex-col bg-gray-900/50">
    <div className="flex-none p-6 border-b border-gray-800">
      <div className="flex items-center gap-2 mb-4">
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gray-800 text-xs font-mono text-gray-400 border border-gray-700">
            <Calendar className="w-3 h-3" />
            {problem.id}
          </span>
          <span className={`px-2.5 py-0.5 rounded-full bg-gray-800 text-xs font-medium border border-gray-700 ${getDifficultyColor(problem.difficulty)}`}>
              {problem.difficulty}
          </span>
      </div>
      <h2 className="text-xl md:text-2xl font-semibold text-white leading-tight">{problem.title}</h2>
    </div>
    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
      <MarkdownRenderer content={problem.description} />
    </div>
  </div>
));

interface EditorActionPanelProps {
  isRunning: boolean;
  gameState: 'PLAYING' | 'WON' | 'LOST';
  code: string;
  isEngineReady: boolean;
  onRun: () => void;
  onReset: () => void;
}

const EditorActionPanel = memo(({ isRunning, gameState, code, isEngineReady, onRun, onReset }: EditorActionPanelProps) => (
  <div className="flex-none p-4 bg-[#252526] border-t border-[#333] flex gap-3">
      <button 
          onClick={onRun}
          disabled={isRunning || gameState !== 'PLAYING' || !code.trim() || !isEngineReady}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-semibold text-sm transition-all shadow-lg
              ${isRunning || gameState !== 'PLAYING' || !isEngineReady
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20 active:scale-95'
              }`}
      >
          {isEngineReady ? (isRunning ? 'Running...' : 'Run Code') : 'Loading Engine...'}
          {!isRunning && isEngineReady && <Play className="w-4 h-4 fill-current" />}
      </button>
      <button 
          onClick={onReset}
          className="p-2.5 rounded-md bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600 border border-gray-600 transition-colors"
          title="Reset Code"
      >
          <RotateCcw className="w-5 h-5" />
      </button>
  </div>
));

interface EditorPanelProps {
  code: string;
  onChange: (val: string | undefined) => void;
  gameState: 'PLAYING' | 'WON' | 'LOST';
  isRunning: boolean;
  isMobile: boolean;
  actionProps: EditorActionPanelProps;
}

const EditorPanel = memo(({ code, onChange, gameState, isRunning, isMobile, actionProps }: EditorPanelProps) => (
  <div className="h-full flex flex-col bg-[#1e1e1e] border-l border-gray-800">
      <div className="flex-none px-4 py-2 bg-[#252526] border-b border-[#333] flex items-center justify-between">
          <span className="text-xs text-gray-400 uppercase font-mono flex items-center gap-2">
              <Terminal className="w-3 h-3" /> solution.py
          </span>
      </div>
      <div className="flex-1 relative min-h-0">
          <CodeEditor 
              code={code} 
              onChange={onChange} 
              readOnly={gameState !== 'PLAYING' || isRunning}
          />
      </div>
      {/* On Mobile, actions are here. */}
      {isMobile && <EditorActionPanel {...actionProps} />}
  </div>
));

interface ResultsPanelProps {
  attempts: Attempt[];
  testCases: any[];
  isRunning: boolean;
  gameState: 'PLAYING' | 'WON' | 'LOST';
  isMobile: boolean;
  actionProps: EditorActionPanelProps;
}

const ResultsPanel = memo(({ attempts, testCases, isRunning, gameState, isMobile, actionProps }: ResultsPanelProps) => (
  <div className="h-full flex flex-col bg-gray-900 border-l border-gray-800">
      <div className="flex-none p-4 border-b border-gray-800 bg-gray-900/95 backdrop-blur">
           <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4" /> Test Results
           </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <ResultMatrix 
              attempts={attempts} 
              testCases={testCases} 
              isRunning={isRunning}
          />

          <div className="mt-6 space-y-3">
              {attempts.length === 0 && !isRunning && (
                  <div className="p-3 rounded border border-gray-800 bg-gray-900/50 text-xs text-center text-gray-500">
                      Write your Python solution and run tests.
                  </div>
              )}
               {isRunning && (
                  <div className="p-3 rounded bg-indigo-900/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-center justify-center gap-2">
                      <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      Executing Python in Browser...
                  </div>
              )}
              {gameState === 'WON' && (
                  <div className="p-3 rounded bg-green-900/20 border border-green-500/30 text-green-300 text-center animate-pulse-fast">
                      <div className="flex items-center justify-center gap-2 mb-1">
                          <Trophy className="w-4 h-4" />
                          <span className="font-bold">Solved!</span>
                      </div>
                  </div>
              )}
              {gameState === 'LOST' && (
                  <div className="p-3 rounded bg-red-900/20 border border-red-500/30 text-red-300 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                          <AlertCircle className="w-4 h-4" />
                          <span className="font-bold">Failed</span>
                      </div>
                  </div>
              )}
          </div>
      </div>
      
      {/* Actions at bottom for Desktop */}
      {!isMobile && <EditorActionPanel {...actionProps} />}
  </div>
));

// --- Main Hook ---
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
};

// --- Main Component ---
const CodeleGame: React.FC = () => {
  const [problem, setProblem] = useState<DailyProblem | null>(null);
  const [code, setCode] = useState("");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [gameState, setGameState] = useState<'PLAYING' | 'WON' | 'LOST'>('PLAYING');
  
  // Real Execution Engine
  const { runCode, isEngineReady } = usePythonRunner();
  
  // Layout State
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<'problem' | 'code' | 'results'>('problem');
  const [leftWidth, setLeftWidth] = useState(35);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load Problem
  useEffect(() => {
    const fetchProblem = async () => {
        const data = await ProblemService.getDailyProblem();
        setProblem(data);
        setCode(data.starterCode);
    };
    fetchProblem();
  }, []);

  // Resize Logic
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    setLeftWidth(Math.min(Math.max(newWidth, 20), 60));
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);


  // Game Logic
  const handleRunCode = useCallback(async () => {
    if (isRunning || gameState !== 'PLAYING' || !problem) return;
    setIsRunning(true);
    if (isMobile) setActiveTab('results');

    try {
      const rawResults: TestResult[] = await runCode(code, problem.testCases);
      
      const processedResults = rawResults.map(r => {
        const definition = problem.testCases.find(tc => tc.id === r.caseId);
        if (definition?.type === 'performance' && r.status === 'PASS') {
             if ((r.durationMs || 0) > 2000) {
                 return { ...r, status: 'WARN' as const, message: `Correct logic, but too slow (${Math.round(r.durationMs || 0)}ms). Target: <2000ms.` };
             }
        }
        return r;
      });

      const newAttempt: Attempt = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        results: processedResults
      };
      
      setAttempts(prev => {
        const updated = [...prev, newAttempt];
        const allPassed = processedResults.every(r => r.status === 'PASS');
        
        if (allPassed) setGameState('WON');
        else if (updated.length >= MAX_ATTEMPTS) setGameState('LOST');
        
        return updated;
      });
      
    } catch (error) {
      console.error("Execution failed", error);
    } finally {
      setIsRunning(false);
    }
  }, [isRunning, gameState, isMobile, runCode, code, problem]);

  const handleReset = useCallback(() => {
    if (problem) {
        setCode(problem.starterCode);
        setAttempts([]);
        setGameState('PLAYING');
    }
  }, [problem]);

  const handleCodeChange = useCallback((val: string | undefined) => {
    setCode(val || '');
  }, []);

  const actionProps: EditorActionPanelProps = {
    isRunning,
    gameState,
    code,
    isEngineReady,
    onRun: handleRunCode,
    onReset: handleReset
  };

  // --- Loading State ---
  if (!problem) {
    return (
        <div className="h-screen w-full bg-gray-950 flex flex-col items-center justify-center text-gray-400 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            <span className="text-sm font-mono tracking-wide">Initializing Codele Challenge...</span>
        </div>
    );
  }

  // --- Renders ---

  const renderMobile = () => (
    <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 relative overflow-hidden">
            {activeTab === 'problem' && <div className="h-full overflow-hidden"><ProblemPanel problem={problem} /></div>}
            {activeTab === 'code' && (
                <div className="h-full overflow-hidden">
                    <EditorPanel 
                        code={code} 
                        onChange={handleCodeChange} 
                        gameState={gameState} 
                        isRunning={isRunning} 
                        isMobile={true} 
                        actionProps={actionProps} 
                    />
                </div>
            )}
            {activeTab === 'results' && (
                <div className="h-full overflow-hidden">
                    <ResultsPanel 
                        attempts={attempts} 
                        testCases={problem.testCases} 
                        isRunning={isRunning} 
                        gameState={gameState} 
                        isMobile={true} 
                        actionProps={actionProps} 
                    />
                </div>
            )}
        </div>
        
        <nav className="flex-none h-16 bg-gray-900 border-t border-gray-800 flex items-center justify-around pb-safe z-30">
            <button 
                onClick={() => setActiveTab('problem')}
                className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'problem' ? 'text-indigo-400' : 'text-gray-500'}`}
            >
                <FileText className="w-5 h-5" />
                <span className="text-[10px] font-medium uppercase tracking-wide">Problem</span>
            </button>
            <button 
                onClick={() => setActiveTab('code')}
                className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'code' ? 'text-indigo-400' : 'text-gray-500'}`}
            >
                <Code className="w-5 h-5" />
                <span className="text-[10px] font-medium uppercase tracking-wide">Code</span>
            </button>
            <button 
                onClick={() => setActiveTab('results')}
                className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'results' ? 'text-indigo-400' : 'text-gray-500'}`}
            >
                <Activity className="w-5 h-5" />
                <span className="text-[10px] font-medium uppercase tracking-wide">Results</span>
            </button>
        </nav>
    </div>
  );

  const renderDesktop = () => (
    <div ref={containerRef} className="flex h-full w-full overflow-hidden">
        <div style={{ width: `${leftWidth}%` }} className="flex-none h-full min-w-[250px]">
            <ProblemPanel problem={problem} />
        </div>

        <div 
            onMouseDown={handleMouseDown}
            className={`w-1 h-full cursor-col-resize hover:bg-indigo-500 transition-colors z-10 flex flex-col justify-center items-center group
                ${isDragging ? 'bg-indigo-500' : 'bg-gray-800'}`}
        >
            <div className="h-8 w-1 group-hover:bg-white/50 rounded-full transition-colors" />
        </div>

        <div className="flex-1 flex h-full min-w-0">
            <div className="flex-1 h-full min-w-0">
                <EditorPanel 
                    code={code} 
                    onChange={handleCodeChange} 
                    gameState={gameState} 
                    isRunning={isRunning} 
                    isMobile={false} 
                    actionProps={actionProps} 
                />
            </div>
            <div className="w-[320px] xl:w-[380px] h-full flex-none border-l border-gray-800">
                <ResultsPanel 
                    attempts={attempts} 
                    testCases={problem.testCases} 
                    isRunning={isRunning} 
                    gameState={gameState} 
                    isMobile={false} 
                    actionProps={actionProps} 
                />
            </div>
        </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen w-full bg-gray-950 text-gray-200 overflow-hidden font-sans">
      <header className="flex-none h-14 border-b border-gray-800 bg-gray-900 flex items-center justify-between px-4 md:px-6 z-20">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-lg">
                 <Terminal className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-white hidden md:block">Codele</h1>
            <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">Daily Challenge</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
             <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700">
                <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Attempts</span>
                <span className={`font-mono font-bold ${attempts.length >= MAX_ATTEMPTS - 1 ? 'text-red-400' : 'text-white'}`}>
                    {attempts.length}/{MAX_ATTEMPTS}
                </span>
             </div>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden">
        {isMobile ? renderMobile() : renderDesktop()}
      </main>
    </div>
  );
};

export default CodeleGame;