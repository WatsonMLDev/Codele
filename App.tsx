import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CodeleGame from './components/CodeleGame';
import ArchiveView from './components/ArchiveView';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col">
        <Routes>
          <Route path="/" element={<CodeleGame />} />
          <Route path="/problem/:date" element={<CodeleGame />} />
          <Route path="/archive" element={<ArchiveView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;