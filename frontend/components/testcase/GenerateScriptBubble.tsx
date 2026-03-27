// components/testcase/GenerateScriptBubble.tsx
"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Terminal, ChevronDown, ChevronUp, Cpu, Cloud, Check, AlertCircle } from 'lucide-react';

type ModelType = 'local' | 'cloud';

const MODELS: { id: ModelType; label: string; icon: React.ReactNode }[] = [
  { id: 'local', label: 'Local', icon: <Cpu size={12} /> },
  { id: 'cloud', label: 'Cloud', icon: <Cloud size={12} /> },
];

interface GenerateScriptBubbleProps {
  rawData: any;
  chatId: number | null;
  model: string;
}

export function GenerateScriptBubble({ rawData, chatId, model: defaultModel }: GenerateScriptBubbleProps) {
  const router = useRouter();

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

  const handleGenerate = () => {
    // Guard: cloud requires key
    if (selectedModel === 'cloud' && !hasHfKey) {
      setShowNoKeyWarning(true);
      setTimeout(() => setShowNoKeyWarning(false), 3500);
      return;
    }

    // Normalise to array
    const cases = Array.isArray(rawData?.cases)
      ? rawData.cases
      : Array.isArray(rawData)
        ? rawData
        : [rawData];

    // Store payload in sessionStorage so test-script page can pick it up
    sessionStorage.setItem(
      'testscript_autorun',
      JSON.stringify({
        json: JSON.stringify(cases),   // the raw JSON string to put into the textarea
        model: selectedModel,          // pre-select the right model
        sourceChatId: chatId,          // optional: for reference / future use
      })
    );

    // Navigate to test-script page — a new chat will be created there automatically
    router.push('/test-script');
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

        {/* Generate button — always shown (navigates to test-script) */}
        <button
          onClick={handleGenerate}
          disabled={!chatId}
          className="flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 active:scale-95 text-purple-700 rounded-full text-xs font-bold border border-purple-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <Terminal size={12} />
          Generate Test Script
        </button>
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
    </div>
  );
}