// components/testcase/GenerateScriptBubble.tsx
"use client";
import { useState, useEffect, useRef } from 'react';
import { Terminal, Loader2, ChevronDown, ChevronUp, Download, Cpu, Cloud, Check, AlertCircle } from 'lucide-react';
import { CodeBlock } from '@/components/testscript/CodeBlock';

type ModelType = 'local' | 'cloud';

const MODELS: { id: ModelType; label: string; icon: React.ReactNode }[] = [
  { id: 'local', label: 'Local', icon: <Cpu size={12} /> },
  { id: 'cloud', label: 'Cloud', icon: <Cloud size={12} /> },
];

interface GenerateScriptBubbleProps {
  rawData: any;
  chatId: number | null;
  model: string; // default model passed from parent (used as initial value)
}

export function GenerateScriptBubble({ rawData, chatId, model: defaultModel }: GenerateScriptBubbleProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showError = (msg: string) => {
    setError(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setError(null), 4000);
  };

  // ── Model picker state ──
  const [selectedModel, setSelectedModel] = useState<ModelType>(
    (defaultModel === 'cloud' || defaultModel === 'local') ? defaultModel as ModelType : 'local'
  );
  const [hasHfKey, setHasHfKey] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showNoKeyWarning, setShowNoKeyWarning] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const key = localStorage.getItem('hf_key');
    setHasHfKey(!!key && key.startsWith('hf_'));
  }, []);

  // Close picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleGenerate = async () => {
    if (!chatId) return;

    // Guard: cloud requires key
    if (selectedModel === 'cloud' && !hasHfKey) {
      setShowNoKeyWarning(true);
      setTimeout(() => setShowNoKeyWarning(false), 3500);
      return;
    }

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
        body: JSON.stringify({ test_cases: cases, chat_id: chatId, model: selectedModel }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Generation failed');
      setCode(data.code);
      setExpanded(true);
    } catch (err: any) {
      showError(err.message);
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

        {/* ── Model Picker ── */}
        <div className="relative" ref={pickerRef}>
          <button
            type="button"
            onClick={() => setShowPicker(p => !p)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full text-[10px] font-bold border border-gray-200 transition-all"
          >
            {selectedModel === 'local' ? <Cpu size={11} /> : <Cloud size={11} />}
            {selectedModel === 'cloud' && !hasHfKey
              ? <span className="text-red-500">Cloud</span>
              : <span className="capitalize">{selectedModel}</span>
            }
            {showPicker ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </button>

          {showPicker && (
            <div className="absolute bottom-full mb-2 left-0 w-56 bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 py-2 z-50 animate-in fade-in slide-in-from-bottom-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 pt-1 pb-2">
                Model
              </p>
              {MODELS.map(m => {
                const isDisabled = m.id === 'cloud' && !hasHfKey;
                const isSelected = selectedModel === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      if (isDisabled) {
                        setShowNoKeyWarning(true);
                        setTimeout(() => setShowNoKeyWarning(false), 3500);
                        return;
                      }
                      setSelectedModel(m.id);
                      setShowPicker(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-2 transition-all
                      ${isDisabled ? 'opacity-40 cursor-not-allowed' : isSelected ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-white">{m.icon}</span>
                      <span className="text-white text-xs font-bold">{m.label}</span>
                      {isDisabled && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-900/50 text-red-400">
                          No Key
                        </span>
                      )}
                    </div>
                    {isSelected && !isDisabled && (
                      <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center shrink-0">
                        <Check size={9} className="text-gray-900" />
                      </div>
                    )}
                  </button>
                );
              })}
              {!hasHfKey && (
                <p className="text-[10px] text-gray-500 px-3 pt-2 pb-1 border-t border-gray-700 mt-1">
                  Add HF API Key in Profile to enable Cloud.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Primary: Generate button (shown when no code yet) */}
        {!code && (
          <button
            onClick={handleGenerate}
            disabled={isLoading || !chatId}
            className="flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 active:scale-95 text-purple-700 rounded-full text-xs font-bold border border-purple-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isLoading ? (
              <><Loader2 size={12} className="animate-spin" />Generating Script...</>
            ) : (
              <><Terminal size={12} />Generate Test Script</>
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


      </div>

      {/* No Key Warning */}
      {showNoKeyWarning && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl animate-in fade-in">
          <AlertCircle size={13} className="text-red-500 shrink-0" />
          <span className="text-xs font-bold text-red-500">
            HuggingFace API Key required — add it in Profile Settings.
          </span>
        </div>
      )}

      {/* Floating Error Toast */}
      {error && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-100 flex items-center gap-2.5 bg-red-600 text-white px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs animate-in fade-in slide-in-from-bottom-4 max-w-sm w-max">
          <AlertCircle size={15} className="shrink-0" />
          <span className="leading-snug">{error}</span>
        </div>
      )}

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