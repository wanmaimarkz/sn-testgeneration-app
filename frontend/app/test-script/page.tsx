"use client";
import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Terminal, Loader2, Copy, Download, Trash2,
  Code2, ChevronDown, AlertCircle, Cpu, Cloud, Check, ChevronUp,
  User, Bot // เพิ่ม Import User และ Bot
} from 'lucide-react';
import { CodeBlock } from '@/components/testscript/CodeBlock';

type ModelType = 'local' | 'cloud';

const MODELS: { id: ModelType; label: string; desc: string; badge: string; badgeColor: string }[] = [
  {
    id: 'local',
    label: 'Local',
    desc: 'Runs on your device. Requires model download before use.',
    badge: 'On-device',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
  {
    id: 'cloud',
    label: 'Cloud',
    desc: 'Uses API tokens. Ready to use immediately with faster performance.',
    badge: 'API',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
];

type Message = {
  id: string;
  role: 'user' | 'assistant';
  jsonInput?: string;
  code?: string;
  error?: string;
};

export default function TestScriptPage() {
  const [selectedModel, setSelectedModel] = useState<ModelType>('local');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [noHfKeyWarning, setNoHfKeyWarning] = useState(false);
  const [hasHfKey, setHasHfKey] = useState(false);

  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const [chatId, setChatId] = useState<number | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  const modelPickerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
      const savedModel = localStorage.getItem('preferred_model') as ModelType;
      if (savedModel === 'local' || savedModel === 'cloud') {
        setSelectedModel(savedModel);
      }
    }, []);

  // Check for HF Key and User Info
  useEffect(() => {
    const key = localStorage.getItem('hf_key');
    setHasHfKey(!!key && key.startsWith('hf_'));

    const userData = localStorage.getItem('user');
    if (userData) setUserId(JSON.parse(userData).id);
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Close model picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modelPickerRef.current && !modelPickerRef.current.contains(e.target as Node)) {
        setShowModelPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Listen to Sidebar Chat Selection ──
  useEffect(() => {
    const handler = async (e: Event) => {
      const { chatId: selectedId } = (e as CustomEvent).detail;

      if (!selectedId) return;

      setChatId(selectedId);
      setMessages([]);
      setIsLoading(true);

      try {
        const res = await fetch(`http://127.0.0.1:8000/api/chat/${selectedId}/history`);
        if (!res.ok) throw new Error('Failed to load history');

        const history: { role: string; content: string }[] = await res.json();

        const loadedMessages: Message[] = history.map((msg, i) => {
          if (msg.role === 'assistant') {
            return {
              id: `history-${i}`,
              role: 'assistant',
              code: msg.content,
            };
          }
          return {
            id: `history-${i}`,
            role: 'user',
            jsonInput: msg.content,
          };
        });

        setMessages(loadedMessages);

      } catch (err) {
        console.error('Failed to load chat history', err);
        setMessages([{
          id: 'error-msg',
          role: 'assistant',
          error: 'Failed to load chat history.',
        }]);
      } finally {
        setIsLoading(false);
      }
    };

    window.addEventListener('chat:selected', handler);
    return () => window.removeEventListener('chat:selected', handler);
  }, []);

  const searchParams = useSearchParams();

  // Load chat from ?chatId= query param (navigated from sidebar)
  useEffect(() => {
    const paramId = searchParams.get('chatId');
    if (!paramId) return;
    const id = Number(paramId);
    setChatId(id);
    window.dispatchEvent(new CustomEvent('chat:restore', { detail: { chatId: id } }));
    setMessages([]);
    setIsLoading(true);
    fetch(`http://127.0.0.1:8000/api/chat/${id}/history`)
      .then(r => r.json())
      .then((history: { role: string; content: string }[]) => {
        setMessages(history.map((msg, i) => ({
          id: `init-${i}`,
          role: msg.role as 'user' | 'assistant',
          ...(msg.role === 'assistant' ? { code: msg.content } : { jsonInput: msg.content }),
        })));
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const validateJson = (text: string): any[] | null => {
    try {
      const parsed = JSON.parse(text);
      const arr = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.cases)
          ? parsed.cases
          : null;
      if (!arr) throw new Error('Expected a JSON array or { "cases": [...] }');
      return arr;
    } catch (e: any) {
      setJsonError(e.message);
      return null;
    }
  };

  // ── Core submit logic — shared by manual form and auto-run ──
  const submitJson = useCallback(async (
    rawText: string,
    overrideModel?: ModelType,
    overrideUserId?: number | null,
  ) => {
    setJsonError(null);
    const trimmed = rawText.trim();
    if (!trimmed) return;

    const cases = validateJson(trimmed);
    if (!cases) return;

    const activeModel  = overrideModel  ?? selectedModel;
    const activeUserId = overrideUserId !== undefined ? overrideUserId : userId;

    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', jsonInput: trimmed }]);
    setIsLoading(true);

    try {
      let activeChatId = chatId;
      if (!activeChatId && activeUserId) {
        const chatRes = await fetch('http://127.0.0.1:8000/api/chat/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: `Script Session – ${new Date().toLocaleTimeString()}`, user_id: activeUserId, chat_type: 'test_script' }),
        });
        const newChat = await chatRes.json();
        activeChatId = newChat.id;
        setChatId(newChat.id);
      }

      const response = await fetch('http://127.0.0.1:8000/api/chat/test-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_cases: cases, chat_id: activeChatId, model: activeModel }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Generation failed');

      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', code: data.code }]);
      setJsonInput('');
    } catch (err: any) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', error: err.message }]);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModel, userId, chatId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitJson(jsonInput);
  };

  // ── Auto-run: pick up payload left by GenerateScriptBubble ──
  useEffect(() => {
    if (userId === null) return;

    const raw = sessionStorage.getItem('testscript_autorun');
    if (!raw) return;
    sessionStorage.removeItem('testscript_autorun'); // consume immediately

    try {
      const { json, model } = JSON.parse(raw) as { json: string; model: ModelType; sourceChatId: number | null };

      if (model === 'local' || model === 'cloud') setSelectedModel(model);
      setJsonInput(json); // pre-fill textarea for visual feedback
      submitJson(json, model, userId);
    } catch {
      // malformed payload — ignore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);


  const handleDownload = (code: string) => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'test.spec.ts';
    a.click();
    URL.revokeObjectURL(url);
  };

  const prettyJson = (raw: string) => {
    try { return JSON.stringify(JSON.parse(raw), null, 2); }
    catch { return raw; }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl flex-1 flex flex-col overflow-hidden h-full border border-gray-100">

      {/* ── Header ── */}
      <div className="p-6 border-b flex justify-between items-center bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
            <Terminal size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">AI Test Script Generator</h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Input: Test Case JSON → Output: Playwright Script</p>
          </div>
        </div>

        {/* Model Picker */}
        <div className="relative" ref={modelPickerRef}>
          <button
            type="button"
            onClick={() => setShowModelPicker(p => !p)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-700 transition-all shadow-md"
          >
            {selectedModel === 'local' ? <Cpu size={16} /> : <Cloud size={16} />}
            {MODELS.find(m => m.id === selectedModel)?.label}
            {showModelPicker ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showModelPicker && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-gray-900 rounded-3xl shadow-2xl z-50 p-2 border border-gray-700 animate-in fade-in slide-in-from-top-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 pt-3 pb-2">
                Select Model
              </p>

              {noHfKeyWarning && (
                <div className="mx-2 mb-2 px-3 py-2.5 bg-red-500/20 border border-red-500/40 rounded-xl flex items-center gap-2 animate-in fade-in">
                  <AlertCircle size={14} className="text-red-400 shrink-0" />
                  <span className="text-red-400 text-xs font-bold">⚠️ HF Key required. Please check Profile Settings.</span>
                </div>
              )}

              {MODELS.map(model => {
                const isDisabled = model.id === 'cloud' && !hasHfKey;
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      if (isDisabled) {
                        setNoHfKeyWarning(true);
                        setTimeout(() => setNoHfKeyWarning(false), 3500);
                        return;
                      }
                      setSelectedModel(model.id);
                      localStorage.setItem('preferred_model', model.id);
                      setShowModelPicker(false);
                    }}
                    className={`w-full text-left px-4 py-3.5 rounded-2xl transition-all flex items-start justify-between gap-3 group
                      ${isDisabled ? 'opacity-40 cursor-not-allowed' : selectedModel === model.id ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 p-1.5 rounded-lg ${selectedModel === model.id ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                        {model.id === 'local' ? <Cpu size={14} className="text-white" /> : <Cloud size={14} className="text-white" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-white font-bold text-sm">{model.label}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${model.badgeColor}`}>
                            {model.badge}
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs leading-snug">{model.desc}</p>
                        {isDisabled && (
                          <p className="text-red-400 text-[10px] mt-0.5 font-bold">HF Key required in Profile.</p>
                        )}
                      </div>
                    </div>
                    {selectedModel === model.id && !isDisabled && (
                      <div className="shrink-0 mt-1 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                        <Check size={11} className="text-gray-900" />
                      </div>
                    )}
                  </button>
                );
              })}
              <div className="px-4 py-3 border-t border-gray-700 mt-1">
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  {selectedModel === 'local'
                    ? '⚡ Local: Data stays on-device, but requires high RAM usage'
                    : '☁️ Cloud: Requires API token and internet connection'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Chat / Output Area ── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4 opacity-40">
            <Code2 size={64} strokeWidth={1} />
            <p className="text-sm font-bold tracking-wide">Paste your test case JSON below to generate a Playwright script.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group animate-in fade-in duration-500`}>
            <div className={`flex gap-4 max-w-[95%] w-full ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm ${msg.role === 'user' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white border-gray-200 text-purple-600'}`}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>

              {/* Message Content */}
              <div className={`flex flex-col gap-1 min-w-0 overflow-hidden ${msg.role === 'user' ? 'w-auto' : 'w-full'}`}>
                <div className={`relative rounded-2xl p-4 shadow-sm ${msg.role === 'user' ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none w-full'}`}>
                  
                  {msg.role === 'user' && msg.jsonInput && (
                    <>
                      <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-70">Test Case JSON</p>
                      <pre className="text-xs font-mono overflow-x-auto max-h-32 whitespace-pre leading-relaxed opacity-90">
                        {prettyJson(msg.jsonInput).slice(0, 400)}{prettyJson(msg.jsonInput).length > 400 ? '\n...' : ''}
                      </pre>
                    </>
                  )}

                  {msg.role === 'assistant' && (
                    <>
                      {msg.error ? (
                        <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-600 rounded-2xl p-4">
                          <AlertCircle size={18} className="shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-black uppercase tracking-widest mb-1">Error</p>
                            <p className="text-sm font-medium">{msg.error}</p>
                          </div>
                        </div>
                      ) : msg.code ? (
                        <CodeBlock code={msg.code} language="typescript" />
                      ) : null}
                    </>
                  )}
                </div>

                {/* Toolbar Bubble & Info */}
                <div className={`flex items-center mt-1 px-2 ${msg.role === 'user' ? 'flex-row-reverse justify-between' : 'justify-between'}`}>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {msg.role === 'user' ? 'YOU' : 'AI ASSISTANT'}
                  </span>

                  {/* Tools */}
                  <div className={`flex items-baseline gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${msg.role === 'assistant' ? 'ml-auto' : ''}`}>
                    {msg.role === 'assistant' && msg.code && (
                      <>
                        <button onClick={() => navigator.clipboard.writeText(msg.code!)} className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-purple-600 uppercase transition-colors">
                          <Copy size={14} /> Copy
                        </button>
                        <button onClick={() => handleDownload(msg.code!)} className="flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-800 uppercase transition-colors">
                          <Download size={14} /> .spec.ts
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center ml-14 gap-3 text-purple-600 font-bold text-xs animate-pulse">
            <Loader2 size={16} className="animate-spin" /> WRITING PLAYWRIGHT SCRIPT...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* ── Input Area ── */}
      <form onSubmit={handleSubmit} className="p-4 bg-white border-t space-y-3 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)]">
        <div className="relative">
          <textarea
            value={jsonInput}
            onChange={(e) => { setJsonInput(e.target.value); setJsonError(null); }}
            disabled={isLoading}
            rows={5}
            className={`w-full p-4 bg-gray-50 border rounded-2xl outline-none resize-none font-mono text-xs text-gray-700 transition-all focus:bg-white disabled:opacity-50 ${jsonError ? 'border-red-400 focus:ring-2 focus:ring-red-300' : 'border-gray-200 focus:ring-2 focus:ring-purple-500'
              }`}
            placeholder={`Paste your test case JSON here, e.g.\n[\n  { "id": "TC-01", "scenario": "Login", "steps": [...], "expected": [...] },\n  ...\n]`}
          />
          {jsonInput && !jsonError && (
            <span className="absolute bottom-3 right-3 text-[10px] font-bold text-gray-300 pointer-events-none">
              {jsonInput.length} chars
            </span>
          )}
        </div>

        {jsonError && (
          <div className="flex items-center gap-2 text-xs text-red-500 font-bold px-1 animate-in fade-in">
            <AlertCircle size={13} /> Invalid JSON: {jsonError}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            Accepts: <code className="bg-gray-100 px-1 rounded">{'[{...}]'}</code> or <code className="bg-gray-100 px-1 rounded">{'{"cases":[...]}'}</code>
          </p>
          <button
            type="submit"
            disabled={isLoading || !jsonInput.trim()}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-purple-100 active:scale-95 transition-all disabled:bg-gray-300"
          >
            {isLoading ? (
              <><Loader2 size={16} className="animate-spin" /> Generating...</>
            ) : (
              <><Terminal size={16} /> Generate Script</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}