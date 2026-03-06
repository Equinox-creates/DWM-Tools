import React, { useState, useEffect, useRef } from 'react';
import { DiscordWebhookMessage } from '@/types';
import Editor from '@monaco-editor/react';
import { AlertCircle, Check, Copy, Undo, Redo } from 'lucide-react';
import { toast } from 'sonner';
import { playButtonSound } from '@/utils/sounds';

interface CodeEditorProps {
  message: DiscordWebhookMessage;
  onChange: (message: DiscordWebhookMessage) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ message, onChange, onUndo, onRedo, canUndo, canRedo }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isTyping = useRef(false);

  const messageToPython = (msg: DiscordWebhookMessage) => {
    try {
      const json = JSON.stringify(msg, null, 4);
      return json
        .replace(/true/g, 'True')
        .replace(/false/g, 'False')
        .replace(/null/g, 'None');
    } catch {
      return '';
    }
  };

  useEffect(() => {
    if (!isTyping.current) {
      setCode(messageToPython(message));
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
  }, [message]);

  const handleCodeChange = (newCode: string | undefined) => {
    if (newCode === undefined) return;
    setCode(newCode);
    isTyping.current = true;
    try {
      const jsonString = newCode
        .replace(/True/g, 'true')
        .replace(/False/g, 'false')
        .replace(/None/g, 'null')
        .replace(/'/g, '"')
        .replace(/,(\s*[}\]])/g, '$1');

      const parsed = JSON.parse(jsonString);
      setError(null);
      onChange(parsed);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    }
    
    setTimeout(() => {
      isTyping.current = false;
    }, 1000);
  };

  const copyCode = () => {
    playButtonSound();
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard");
  };

  return (
    <div className="h-full flex flex-col bg-zinc-50 dark:bg-[#1e1e1e] rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xl">
      {/* VS Code Header */}
      <div className="bg-white dark:bg-[#252526] px-4 py-2 border-b border-zinc-200 dark:border-[#1e1e1e] flex justify-between items-center select-none">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
          <span className="ml-2 text-zinc-600 dark:text-zinc-400 text-xs font-mono">webhook.py</span>
        </div>
        <div className="flex items-center gap-2">
           {onUndo && (
             <button onClick={() => { playButtonSound(); onUndo(); }} disabled={!canUndo} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-30">
               <Undo className="w-3 h-3" />
             </button>
           )}
           {onRedo && (
             <button onClick={() => { playButtonSound(); onRedo(); }} disabled={!canRedo} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-30">
               <Redo className="w-3 h-3" />
             </button>
           )}
           <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1" />
           {error ? (
             <span className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs bg-red-100 dark:bg-red-900/20 px-2 py-0.5 rounded" title={error}>
               <AlertCircle className="w-3 h-3" /> Syntax Error
             </span>
           ) : (
             <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs bg-green-100 dark:bg-green-900/20 px-2 py-0.5 rounded">
               <Check className="w-3 h-3" /> Valid
             </span>
           )}
           <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1" />
           <button 
             onClick={copyCode}
             className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
             title="Copy Code"
           >
             <Copy className="w-3 h-3" />
           </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="python"
          theme="vs-dark"
          value={code}
          onChange={handleCodeChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            formatOnPaste: true,
          }}
        />
      </div>
    </div>
  );
};
