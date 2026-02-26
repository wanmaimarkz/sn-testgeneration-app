"use client";
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Send, Bot, User, Loader2, FileText, Copy, 
  Download, Trash2, Edit3, Check, X, FileSpreadsheet 
} from 'lucide-react';

export default function TestCasePage() {
  const [messages, setMessages] = useState<{ id: string, role: string, content: string, rawData?: any }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // กำหนด chat_id สำหรับใช้งานร่วมกับ ChromaDB (RAG)
  const chatId = "session-test-001"; 

  const scrollToBottom = () => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
  useEffect(() => { scrollToBottom(); }, [messages]);

  // --- 1. Basic handle message ---
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleDelete = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  const startEdit = (id: string, content: string) => {
    setEditingId(id);
    setEditInput(content);
  };

  const saveEdit = (id: string) => {
    setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, content: editInput } : msg));
    setEditingId(null);
  };

  // --- 2. Download function (CSV จาก Backend) ---
  const handleDownloadCSV = async (msg: any) => {
    if (!msg.rawData) return;
    try {
      const response = await fetch('http://127.0.0.1:8000/api/chat/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([msg.rawData]),
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `test_case_${msg.rawData.id}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV Download Error:", err);
    }
  };

  // --- 3. Send to AI (RAG API) ---
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/chat/test-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input, chat_id: chatId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Generation failed");

      // Convert JSON Response from AI to be Markdown for display
      const aiMarkdown = `# **${data.id}**: ${data.scenario}\n**Prerequisites:** ${data.prerequisites}\n\n| Step | Description |\n| :-- | :-- |\n${data.steps.map((s: string, i: number) => `| ${i+1} | ${s} |`).join('\n')}\n\n**Data:** ${data.data}\n**Expected:** ${data.expected}`;

      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'assistant', 
        content: aiMarkdown,
        rawData: data 
      }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `❌ Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl flex-1 flex flex-col overflow-hidden h-full border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b flex justify-between items-center bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">AI TestGen Full v1.0</h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Mode: RAG Enabled (Qwen 2.5)</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50/50 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group animate-in fade-in duration-500`}>
            <div className={`flex gap-4 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-blue-600'}`}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>

              <div className="flex flex-col gap-1">
                <div className={`flex items-center gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Message Bubble */}
                  <div className={`relative rounded-2xl p-4 shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'}`}>
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

                  {/* ปุ่มจัดการฝั่ง User อยู่ด้านข้าง Bubble */}
                  {msg.role === 'user' && (
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button onClick={() => handleCopy(msg.content)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600"><Copy size={16}/></button>
                      <button onClick={() => startEdit(msg.id, msg.content)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-500"><Edit3 size={16}/></button>
                      <button onClick={() => handleDelete(msg.id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                    </div>
                  )}
                </div>

                {/* --- Toolbar for AI Assistant --- */}
                <div className={`flex items-center mt-1 px-2 ${msg.role === 'user' ? 'justify-end' : 'justify-between'}`}>
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{msg.role === 'user' ? 'You' : 'AI Assistant'}</span>
                   
                   {msg.role === 'assistant' && (
                     <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-auto">
                        {/* กลุ่ม Copy / Delete */}
                        <div className="flex items-center gap-3 border-r border-gray-100 pr-4 mr-1">
                          <button onClick={() => handleCopy(msg.content)} className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-blue-600 transition-colors uppercase">
                            <Copy size={14} /> Copy
                          </button>
                          <button onClick={() => handleDelete(msg.id)} className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-red-500 transition-colors uppercase">
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                        
                        {/* ปุ่ม Export CSV */}
                        {msg.rawData && (
                          <button onClick={() => handleDownloadCSV(msg)} className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-green-600 hover:text-green-700 transition-colors">
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
        {isLoading && (
          <div className="flex justify-start items-center gap-3 text-blue-600 font-bold text-xs animate-pulse ml-14">
            <Loader2 size={16} className="animate-spin" /> GENERATING TEST CASES...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t flex gap-3 items-center">
        <input value={input} onChange={(e) => setInput(e.target.value)} disabled={isLoading} className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-black transition-all font-medium disabled:opacity-50" placeholder="Describe a feature (e.g., User Login) to generate test cases..." />
        <button disabled={isLoading || !input.trim()} className="bg-blue-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all"><Send size={20}/></button>
      </form>
    </div>
  );
}