"use client";
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send, Bot, User, Loader2, FileText, Copy,
  Edit3, Check, X, FileSpreadsheet,
  Paperclip, ChevronDown, CheckCircle2,
  FileUp, XCircle, Plus, AlertCircle, Cpu, Cloud, ChevronUp, Download
} from 'lucide-react';
import { TestCaseTable } from '@/components/testcase/TestCaseTable';
import { GenerateScriptBubble } from '@/components/testcase/GenerateScriptBubble';

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

export default function TestCasePage() {
  const [selectedModel, setSelectedModel] = useState<ModelType>('local');
  const [showModelPicker, setShowModelPicker] = useState(false);
  useEffect(() => {
    const savedModel = localStorage.getItem('preferred_model') as ModelType;
    if (savedModel === 'local' || savedModel === 'cloud') {
      setSelectedModel(savedModel);
    }
  }, []);

  const [noHfKeyWarning, setNoHfKeyWarning] = useState(false);
  const [hasHfKey, setHasHfKey] = useState(false);
  useEffect(() => {
    const key = localStorage.getItem('hf_key');
    setHasHfKey(!!key && key.startsWith('hf_'));
  }, []);

  const [messages, setMessages] = useState<{
    id: string,
    role: string,
    content: string,
    rawData?: any,
    columns?: string[],
    attachedFile?: { name: string, size: number },
    fileChatId?: number,   // which chat this file belongs to (for history)
  }[]>([]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState("");

  const [showCopyToast, setShowCopyToast] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customColInput, setCustomColInput] = useState("");

  const [allColumns, setAllColumns] = useState([
    'id', 'scenario', 'prerequisites', 'steps', 'data', 'expected', 'actual', 'status'
  ]);
  const [selectedColumns, setSelectedColumns] = useState([...allColumns]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const modelPickerRef = useRef<HTMLDivElement>(null);
  const [chatId, setChatId] = useState<number | null>(null);

  // helper: โหลด history จาก chatId
  const loadHistory = async (id: number) => {
    setMessages([]);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/chat/${id}/history`);
      if (!res.ok) return;
      const history: any[] = await res.json();
      const loadedMessages = history.map((msg, i) => {
        if (msg.role === 'assistant') {
          try {
            const rawData = JSON.parse(msg.content);
            return {
              id: `history-${i}`,
              role: 'assistant',
              content: '### 📋 Generated Test Case',
              rawData,
              columns: Array.isArray(rawData?.cases) && rawData.cases.length > 0
                ? Object.keys(rawData.cases[0])
                : Object.keys(rawData),
            };
          } catch {
            return { id: `history-${i}`, role: 'assistant', content: msg.content };
          }
        }
        return {
          id: `history-${i}`,
          role: 'user',
          content: msg.content,
          attachedFile: msg.file_name ? { name: msg.file_name, size: msg.file_size || 0 } : undefined,
          fileChatId: id,
        };
      });
      setMessages(loadedMessages as any);
    } catch (err) {
      console.error('Failed to load chat history', err);
    }
  };

  // โหลด chat ล่าสุดอัตโนมัติตอนเปิดหน้า
  useEffect(() => {
    const lastChatId = localStorage.getItem('last_testcase_chat_id');
    if (lastChatId) {
      const id = Number(lastChatId);
      setChatId(id);
      // notify SidebarRight ให้ highlight
      window.dispatchEvent(new CustomEvent('chat:restore', { detail: { chatId: id } }));
      loadHistory(id);
    }
  }, []);

  // บันทึก chatId ทุกครั้งที่เปลี่ยน
  useEffect(() => {
    if (chatId) {
      localStorage.setItem('last_testcase_chat_id', String(chatId));
    } else {
      localStorage.removeItem('last_testcase_chat_id');
    }
  }, [chatId]);

  const [userId, setUserId] = useState<number | null>(null);
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUserId(JSON.parse(userData).id);
  }, []);

  // รับ event เมื่อคลิก chat จาก SidebarRight
  useEffect(() => {
    const handleNewChat = () => {
      setChatId(null);
      setMessages([]);
      localStorage.removeItem('last_testcase_chat_id');
    };
    window.addEventListener('chat:new', handleNewChat);
    return () => window.removeEventListener('chat:new', handleNewChat);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const { chatId: selectedId } = (e as CustomEvent).detail;
      setChatId(selectedId);
      loadHistory(selectedId);
    };
    window.addEventListener('chat:selected', handler);
    return () => window.removeEventListener('chat:selected', handler);
  }, []);

  const scrollToBottom = () => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modelPickerRef.current && !modelPickerRef.current.contains(e.target as Node)) {
        setShowModelPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // --- Handlers ---
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 2000);
  };

  const handleOpenFile = async (fileChatId: number | null | undefined, fileName: string) => {
    const id = fileChatId ?? chatId;
    if (!id) return;
    const url = `http://127.0.0.1:8000/api/chat/${id}/file/${encodeURIComponent(fileName)}`;
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.status === 404) {
        setFileError(`File "${fileName}" not found — it may have been deleted`);
        setTimeout(() => setFileError(null), 3500);
        return;
      }
      if (!res.ok) {
        setFileError(`Failed to open file (${res.status})`);
        setTimeout(() => setFileError(null), 3500);
        return;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      setFileError('Cannot connect to server');
      setTimeout(() => setFileError(null), 3500);
    }
  };

  const startEdit = (id: string, content: string) => {
    setEditingId(id);
    setEditInput(content);
  };

  const saveEdit = async (id: string) => {
    if (!editInput.trim() || !chatId) { setEditingId(null); return; }

    setMessages(prev => {
      const updated = prev.map(msg => msg.id === id ? { ...msg, content: editInput } : msg);
      const lastAssistantIdx = [...updated].map((m, i) => m.role === 'assistant' ? i : -1).filter(i => i !== -1).pop();
      if (lastAssistantIdx === undefined) return updated;
      return updated.filter((_, i) => i !== lastAssistantIdx);
    });
    setEditingId(null);
    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/chat/test-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editInput, chat_id: chatId, columns: selectedColumns, model: selectedModel }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Generation failed');

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '### 📋 Generated Test Case',
        rawData: data,
        columns: [...selectedColumns],
      }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `❌ Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCsv = async (rawData: any) => {
    const cases = Array.isArray(rawData?.cases) ? rawData.cases
      : Array.isArray(rawData) ? rawData : [rawData];
    try {
      const res = await fetch('http://127.0.0.1:8000/api/chat/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cases: cases })
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'test_cases.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export CSV error:', err);
    }
  };

  const toggleColumn = (col: string) => {
    setSelectedColumns(prev =>
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  const addCustomColumn = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCol = customColInput.trim().toLowerCase();
    if (trimmedCol && !allColumns.includes(trimmedCol)) {
      setAllColumns(prev => [...prev, trimmedCol]);
      setSelectedColumns(prev => [...prev, trimmedCol]);
      setCustomColInput("");
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !selectedFile) return;
    if (!userId) return;

    const fileToAttach = selectedFile ? { name: selectedFile.name, size: selectedFile.size } : undefined;

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      attachedFile: fileToAttach
    }]);

    const currentInput = input;
    const currentFile = selectedFile;

    setInput("");
    setSelectedFile(null);
    setIsLoading(true);

    try {
      let activeChatId = chatId;
      if (!activeChatId) {
        const chatRes = await fetch('http://127.0.0.1:8000/api/chat/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: currentInput.slice(0, 50), user_id: userId }),
        });
        const newChat = await chatRes.json();
        activeChatId = newChat.id;
        setChatId(newChat.id);
      }

      // Upload file to Backend (Backend should save it tied to the chat_id)
      if (currentFile) {
        const formData = new FormData();
        formData.append('file', currentFile);
        formData.append('chat_id', String(activeChatId));
        await fetch('http://127.0.0.1:8000/api/chat/upload', { method: 'POST', body: formData });
      }

      const response = await fetch('http://127.0.0.1:8000/api/chat/test-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: currentInput,
          chat_id: activeChatId,
          columns: selectedColumns,
          model: selectedModel,
          file_name: currentFile ? currentFile.name : null,
          file_size: currentFile ? currentFile.size : null,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Generation failed");

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '### 📋 Generated Test Case',
        rawData: data,
        columns: [...selectedColumns],
      }]);

      window.dispatchEvent(new CustomEvent('chat:created'));
    } catch (error: any) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `❌ Error: ${error.message}` }]);
    } finally { setIsLoading(false); }
  };

  return (
    <div className="relative bg-slate-50 rounded-2xl shadow-xl flex-1 flex flex-col overflow-hidden h-full border border-gray-100">

      {/* Toast Notification */}
      {showCopyToast && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-60 bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 font-bold animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 size={18} /> Copied!
        </div>
      )}
      {fileError && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-60 bg-red-500 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 font-bold animate-in fade-in slide-in-from-top-4 whitespace-nowrap">
          <XCircle size={18} /> {fileError}
        </div>
      )}

      {/* Header */}
      <div className="p-6 border-b flex justify-between items-center bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><FileText size={24} /></div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">AI Test Case Generator</h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Mode: RAG Enabled</p>
          </div>
        </div>

        {/* Model Picker Button */}
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
                  <span className="text-red-400 text-xs font-bold">⚠️ HuggingFace API Key required — please add it in Profile Settings</span>
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
                          {isDisabled && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-900/50 text-red-400">
                              No Key
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-xs leading-snug">{model.desc}</p>
                        {isDisabled && (
                          <p className="text-red-400 text-[10px] mt-0.5">HF Key required. Please configure it in your Profile.</p>
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

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50/50 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4 opacity-40">
            <FileText size={64} strokeWidth={1} />
            <p className="text-sm font-bold tracking-wide">Describe the testcase or feature you want to create.</p>
          </div>
        )}
        {(() => {
          const lastUserIndex = messages.reduce((acc, m, i) => m.role === 'user' ? i : acc, -1);
          return messages.map((msg, index) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group animate-in fade-in duration-500`}>
              <div className={`flex gap-4 max-w-[95%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-blue-600'}`}>
                  {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                </div>

                <div className="flex flex-col gap-1 min-w-0 overflow-hidden">
                  <div className={`relative rounded-2xl p-4 shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'}`}>
                    
                    {/* ส่วนที่แสดงไฟล์แนบของ User */}
                    {msg.role === 'user' && msg.attachedFile && (
                      <button
                        type="button"
                        onClick={() => handleOpenFile(msg.fileChatId, msg.attachedFile!.name)}
                        title="Open attached file"
                        className="mb-2 p-2 bg-white/20 rounded-lg flex items-center gap-2 text-[10px] font-bold border border-white/30 backdrop-blur-sm hover:bg-white/30 transition-colors cursor-pointer w-full text-left"
                      >
                        <FileUp size={12} />
                        <span className="truncate max-w-37.5">{msg.attachedFile.name}</span>
                        <span className="opacity-60">({(msg.attachedFile.size / 1024).toFixed(1)} KB)</span>
                        <Download size={11} className="ml-auto opacity-70 shrink-0" />
                      </button>
                    )}
                    
                    {editingId === msg.id ? (
                      <div className="flex flex-col gap-2 min-w-52">
                        <textarea value={editInput} onChange={(e) => setEditInput(e.target.value)} className="w-full p-2 rounded-lg bg-white/10 text-white outline-none border border-white/20" rows={3} autoFocus />
                        <div className="flex justify-end gap-2 text-white">
                          <button onClick={() => saveEdit(msg.id)} className="p-1 hover:bg-white/20 rounded"><Check size={16} /></button>
                          <button onClick={() => setEditingId(null)} className="p-1 hover:bg-white/20 rounded"><X size={16} /></button>
                        </div>
                      </div>
                    ) : (
                      <article className={`prose prose-sm md:prose-base max-w-none overflow-hidden ${msg.role === 'user' ? 'prose-invert' : 'prose-slate'}`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                        {msg.rawData && msg.columns && (
                          <TestCaseTable data={msg.rawData} columns={msg.columns} />
                        )}
                      </article>
                    )}
                  </div>

                  {/* Toolbar & Info Section */}
                  <div className={`flex items-center mt-1 px-2 ${msg.role === 'user' ? 'flex-row-reverse justify-between' : 'justify-between'}`}>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {msg.role === 'user' ? 'YOU' : 'AI ASSISTANT'}
                    </span>

                    {msg.role === 'user' && (
                      <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button onClick={() => handleCopy(msg.content)} className="text-gray-400 hover:text-blue-600"><Copy size={14} /></button>
                        {index === lastUserIndex && !isLoading && (
                          <button onClick={() => startEdit(msg.id, msg.content)} className="text-gray-400 hover:text-blue-500"><Edit3 size={14} /></button>
                        )}
                      </div>
                    )}

                    {msg.role === 'assistant' && (
                      <div className="flex items-baseline gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-auto">
                        <div className="flex items-center gap-3 pr-4 mr-1">
                          <button onClick={() => handleCopy(msg.rawData ? JSON.stringify(msg.rawData?.cases ?? msg.rawData, null, 2) : msg.content)} className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-blue-600 transition-colors uppercase"><Copy size={14} /> Copy JSON</button>
                        </div>
                        {msg.rawData && (
                          <>
                            <button
                              onClick={() => handleExportCsv(msg.rawData)}
                              className="text-[10px] font-bold uppercase text-green-600 hover:text-green-700 flex items-center gap-1.5 transition-colors"
                            >
                              <FileSpreadsheet size={14} /> Export CSV
                            </button>

                            <GenerateScriptBubble
                              rawData={msg.rawData}
                              chatId={chatId}
                              model={selectedModel}
                            />
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ));
        })()}
        {isLoading && (
          <div className="flex items-center ml-14">
            <Loader2 className="animate-spin w-5 h-5 mr-2 text-blue-600" />
            <span className="text-blue-600 font-bold text-xs animate-pulse">GENERATING...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Section */}
      <div className="p-4 bg-white border-t space-y-3 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)]">
        {selectedFile && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-100 p-2 px-4 rounded-xl animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs truncate">
              <FileUp size={14} /> {selectedFile.name}
              <span className="text-[10px] opacity-60">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
            </div>
            <button onClick={() => setSelectedFile(null)} className="text-blue-400 hover:text-red-500"><XCircle size={18} /></button>
          </div>
        )}

        <form onSubmit={handleSend} className="flex gap-3 items-center">
          <button type="button" onClick={() => fileInputRef.current?.click()} className={`p-3.5 rounded-2xl transition-all shadow-sm ${selectedFile ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            <Paperclip size={20} />
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} />

          <div className="relative">
            <button type="button" onClick={() => setShowColumnDropdown(!showColumnDropdown)} className="px-4 py-3.5 bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm flex items-center gap-2 border border-gray-200">
              Columns ({selectedColumns.length}) <ChevronDown size={16} />
            </button>
            {showColumnDropdown && (
              <div className="absolute bottom-full mb-3 left-0 w-72 bg-white border border-gray-100 rounded-2xl shadow-2xl p-4 z-50 animate-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between mb-3 px-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Configuration</p>
                  <button onClick={() => setShowColumnDropdown(false)}><X size={14} /></button>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto mb-4">
                  {allColumns.map(col => (
                    <label key={col} className="flex items-center gap-3 p-2.5 hover:bg-blue-50 rounded-xl cursor-pointer">
                      <input type="checkbox" checked={selectedColumns.includes(col)} onChange={() => toggleColumn(col)} className="w-4 h-4 rounded text-blue-600" />
                      <span className="text-sm font-bold text-gray-700 capitalize">{col}</span>
                    </label>
                  ))}
                </div>
                <div className="pt-3 border-t flex gap-2">
                  <input value={customColInput} onChange={(e) => setCustomColInput(e.target.value)} placeholder="Add column..." className="flex-1 px-3 py-2 bg-gray-50 border rounded-xl text-xs font-bold text-black outline-none" />
                  <button type="button" onClick={addCustomColumn} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"><Plus size={16} /></button>
                </div>
              </div>
            )}
          </div>

          <input value={input} onChange={(e) => setInput(e.target.value)} disabled={isLoading} className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-black font-medium transition-all" placeholder="Describe requirements..." />
          <button disabled={isLoading || (!input.trim() && !selectedFile)} className="bg-blue-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 disabled:bg-gray-300">
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}