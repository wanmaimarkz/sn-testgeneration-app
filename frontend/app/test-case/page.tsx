"use client";
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Send, Bot, User, Loader2, FileText, Copy, 
  Trash2, Edit3, Check, X, FileSpreadsheet,
  Paperclip, ChevronDown, CheckCircle2,
  FileUp, XCircle, Plus, AlertCircle
} from 'lucide-react';

export default function TestCasePage() {
  const [messages, setMessages] = useState<{ 
    id: string, 
    role: string, 
    content: string, 
    rawData?: any,
    attachedFile?: { name: string, size: number } 
  }[]>([]);
  
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState("");
  
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customColInput, setCustomColInput] = useState("");
  
  const [allColumns, setAllColumns] = useState([
    'id', 'scenario', 'prerequisites', 'steps', 'data', 'expected', 'actual', 'status'
  ]);
  const [selectedColumns, setSelectedColumns] = useState([...allColumns]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatId = "session-test-001";

  const scrollToBottom = () => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
  useEffect(() => { scrollToBottom(); }, [messages]);

  // --- Handlers ---
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 2000);
  };

  const confirmDelete = () => {
    if (deleteTargetId) {
      setMessages(prev => prev.filter(msg => msg.id !== deleteTargetId));
      setDeleteTargetId(null);
    }
  };

  const startEdit = (id: string, content: string) => {
    setEditingId(id);
    setEditInput(content);
  };

  const saveEdit = (id: string) => {
    setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, content: editInput } : msg));
    setEditingId(null);
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
      if (currentFile) {
        const formData = new FormData();
        formData.append('file', currentFile);
        formData.append('chat_id', chatId);
        await fetch('http://127.0.0.1:8000/api/chat/upload', { method: 'POST', body: formData });
      }

      const response = await fetch('http://127.0.0.1:8000/api/chat/test-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: currentInput, chat_id: chatId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Generation failed");

      let tableHeader = `| ${selectedColumns.map(c => c.toUpperCase()).join(' | ')} |`;
      let tableDivider = `| ${selectedColumns.map(() => '---').join(' | ')} |`;
      let tableRow = `| ${selectedColumns.map(col => {
        const val = data[col];
        return Array.isArray(val) ? val.join('<br>') : (val || '-');
      }).join(' | ')} |`;

      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: `### 📋 Generated Test Case\n\n${tableHeader}\n${tableDivider}\n${tableRow}`,
        rawData: data 
      }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `❌ Error: ${error.message}` }]);
    } finally { setIsLoading(false); }
  };

  return (
    <div className="relative bg-white rounded-2xl shadow-xl flex-1 flex flex-col overflow-hidden h-full border border-gray-100">
      
      {/* Toast Notification */}
      {showCopyToast && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[60] bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 font-bold animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 size={18} /> Copied!
        </div>
      )}

      {/* Delete Dialog */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 border border-gray-100">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="p-4 bg-red-50 text-red-500 rounded-full"><AlertCircle size={40} /></div>
              <h3 className="text-xl font-black text-gray-800">Delete Message?</h3>
              <p className="text-sm text-gray-500 font-medium">This action cannot be undone.</p>
              <div className="flex gap-3 w-full mt-4">
                <button onClick={() => setDeleteTargetId(null)} className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-100">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-6 border-b flex justify-between items-center bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><FileText size={24} /></div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">AI TestGen Full v1.0</h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Mode: RAG Enabled</p>
          </div>
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
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group animate-in fade-in duration-500`}>
            <div className={`flex gap-4 max-w-[95%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-blue-600'}`}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>

              <div className="flex flex-col gap-1">
                <div className={`relative rounded-2xl p-4 shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'}`}>
                  {msg.role === 'user' && msg.attachedFile && (
                    <div className="mb-2 p-2 bg-white/20 rounded-lg flex items-center gap-2 text-[10px] font-bold border border-white/30 backdrop-blur-sm">
                      <FileUp size={12} />
                      <span className="truncate max-w-[150px]">{msg.attachedFile.name}</span>
                      <span className="opacity-60">({(msg.attachedFile.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  )}
                  {editingId === msg.id ? (
                    <div className="flex flex-col gap-2 min-w-52">
                      <textarea value={editInput} onChange={(e) => setEditInput(e.target.value)} className="w-full p-2 rounded-lg bg-white/10 text-white outline-none border border-white/20" rows={3} autoFocus />
                      <div className="flex justify-end gap-2 text-white">
                        <button onClick={() => saveEdit(msg.id)} className="p-1 hover:bg-white/20 rounded"><Check size={16}/></button>
                        <button onClick={() => setEditingId(null)} className="p-1 hover:bg-white/20 rounded"><X size={16}/></button>
                      </div>
                    </div>
                  ) : (
                    <article className={`prose prose-sm md:prose-base max-w-none ${msg.role === 'user' ? 'prose-invert' : 'prose-slate'}`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </article>
                  )}
                </div>

                {/* Toolbar & Info Section */}
                <div className={`flex items-center mt-1 px-2 ${msg.role === 'user' ? 'flex-row-reverse justify-between' : 'justify-between'}`}>
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                     {msg.role === 'user' ? 'YOU' : 'AI ASSISTANT'}
                   </span>
                   
                   {/* User Toolbar: ชิดซ้าย */}
                   {msg.role === 'user' && (
                    <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button onClick={() => handleCopy(msg.content)} className="text-gray-400 hover:text-blue-600"><Copy size={14}/></button>
                      <button onClick={() => startEdit(msg.id, msg.content)} className="text-gray-400 hover:text-blue-500"><Edit3 size={14}/></button>
                      <button onClick={() => setDeleteTargetId(msg.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                    </div>
                  )}

                   {/* AI Toolbar: ชิดขวา */}
                   {msg.role === 'assistant' && (
                     <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-auto">
                        <div className="flex items-center gap-3 border-r border-gray-100 pr-4 mr-1">
                          <button onClick={() => handleCopy(msg.content)} className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-blue-600 transition-colors uppercase"><Copy size={14} /> Copy</button>
                          <button onClick={() => setDeleteTargetId(msg.id)} className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors uppercase"><Trash2 size={14} /> Delete</button>
                        </div>
                        {msg.rawData && (
                          <button className="text-[10px] font-bold uppercase text-green-600 hover:text-green-700 flex items-center gap-1.5 transition-colors">
                            <FileSpreadsheet size={14} /> Export CSV
                          </button>
                        )}
                     </div>
                   )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && <div className="ml-14 text-blue-600 font-bold text-xs animate-pulse">GENERATING...</div>}
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
            <button onClick={() => setSelectedFile(null)} className="text-blue-400 hover:text-red-500"><XCircle size={18}/></button>
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
                  <button onClick={() => setShowColumnDropdown(false)}><X size={14}/></button>
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
                  <button type="button" onClick={addCustomColumn} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"><Plus size={16}/></button>
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