// components/testcase/GenerateScriptBubble.tsx
"use client";
import { useState } from 'react';
import { Terminal, Loader2, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { CodeBlock } from '@/components/testscript/CodeBlock';

interface GenerateScriptBubbleProps {
  rawData: any;
  chatId: number | null;
  model: string;
}

export function GenerateScriptBubble({ rawData, chatId, model }: GenerateScriptBubbleProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const handleGenerate = async () => {
    if (!chatId) return;
    const cases = Array.isArray(rawData?.cases)
      ? rawData.cases
      : Array.isArray(rawData)
        ? rawData
        : [rawData];

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/chat/test-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_cases: cases, chat_id: chatId, model }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Generation failed');
      setCode(data.code);
      setExpanded(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!code) return;
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'test.spec.ts';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-0 space-y-3">
      {/* Action Row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Primary: Generate button (shown when no code yet) */}
        {!code && (
          <button
            onClick={handleGenerate}
            disabled={isLoading || !chatId}
            className="flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 active:scale-95 text-purple-700 rounded-full text-xs font-bold border border-purple-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Generating Script...
              </>
            ) : (
              <>
                <Terminal size={12} />
                Generate Test Script
              </>
            )}
          </button>
        )}

        {/* Re-generate + toggle after code exists */}
        {code && (
          <>
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Terminal size={12} />
              {expanded ? 'Hide Script' : 'Show Script'}
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full text-xs font-bold transition-all disabled:opacity-50"
            >
              {isLoading ? <Loader2 size={12} className="animate-spin" /> : '↻'}
              Regenerate
            </button>
            {expanded && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full text-xs font-bold transition-all ml-auto"
              >
                <Download size={12} /> .spec.ts
              </button>
            )}
          </>
        )}

        {/* Error */}
        {error && (
          <span className="text-xs text-red-500 font-bold">❌ {error}</span>
        )}
      </div>

      {/* Expanded Code Block */}
      {code && expanded && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 mb-2 px-1">
            <Terminal size={12} className="text-purple-500" />
            <span className="text-[11px] font-black text-purple-500 uppercase tracking-widest">
              Playwright Test Script
            </span>
          </div>
          <CodeBlock code={code} language="typescript" />
        </div>
      )}
    </div>
  );
}
