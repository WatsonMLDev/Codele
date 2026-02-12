import React from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  code: string;
  onChange: (value: string | undefined) => void;
  readOnly?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange, readOnly = false }) => {
  return (
    <div className="h-full w-full rounded-md overflow-hidden border border-gray-700 bg-[#1e1e1e] shadow-inner">
      <Editor
        height="100%"
        defaultLanguage="python"
        theme="vs-dark"
        value={code}
        onChange={onChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          scrollBeyondLastLine: false,
          readOnly: readOnly,
          lineNumbers: 'on',
          automaticLayout: true,
          padding: { top: 16, bottom: 16 },
          fontFamily: "'Fira Code', 'Menlo', 'Monaco', 'Courier New', monospace",
        }}
      />
    </div>
  );
};

export default CodeEditor;
