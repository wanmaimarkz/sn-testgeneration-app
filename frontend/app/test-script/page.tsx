"use client";
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Send, Bot, User, Loader2, Terminal, Copy, 
  Download, Trash2, Edit3, Check, X, Code2 
} from 'lucide-react';

export default function TestScriptPage() {
  const [messages, setMessages] = useState<{ id: string, role: string, content: string, rawData?: any }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // กำหนด chat_id สำหรับใช้งานร่วมกับ ChromaDB (RAG)
  const chatId = "script-session-001"; 

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

  // --- 2. Download function (Postman JSON & Script File) ---
  const handleDownloadScript = (content: string, type: 'json' | 'js') => {
    const element = document.createElement("a");
    let fileContent = content;
    let fileName = "test-script.js";

    if (type === 'json') {
      fileName = "postman_collection.json";
      const postmanTemplate = {
        info: { name: "Generated Script", schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json" },
        item: [{ 
          name: "Test Request", 
          event: [{ listen: "test", script: { exec: content.split('\n'), type: "text/javascript" } }],
          request: { method: "POST", url: { raw: "{{base_url}}/api" } }
        }]
      };
      fileContent = JSON.stringify(postmanTemplate, null, 2);
    }

    const file = new Blob([fileContent], { type: type === 'json' ? 'application/json' : 'text/javascript' });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
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
        body: JSON.stringify({ 
          text: `Generate a Postman test script for: ${input}`, 
          chat_id: chatId 
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Generation failed");

      // Markdown Code Block
      const scriptMarkdown = `# Generated Script\n\`\`\`javascript\n${data.expected || "// No code generated"}\n\`\`\``;

      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'assistant', 
        content: scriptMarkdown,
        rawData: data.expected
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
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
            <Terminal size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">AI Test Script Generator</h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Model: Qwen 2.5 Coder (RAG Mode)</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50/50 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4 opacity-40">
            <Code2 size={64} strokeWidth={1} />
            <p className="text-sm font-bold tracking-wide">Describe the API or feature you want to script.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group animate-in fade-in duration-500`}>
            <div className={`flex gap-4 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm ${msg.role === 'user' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white border-gray-200 text-purple-600'}`}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>

              <div className="flex flex-col gap-1">
                <div className={`flex items-center gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`relative rounded-2xl p-4 shadow-sm ${msg.role === 'user' ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'}`}>
                    {editingId === msg.id ? (
                      <div className="flex flex-col gap-2 min-w-52">
                        <textarea value={editInput} onChange={(e) => setEditInput(e.target.value)} className="w-full p-2 rounded-lg bg-white/10 text-white outline-none border border-white/20" rows={3} autoFocus />
                        <div className="flex justify-end gap-2 text-white">
                          <button onClick={() => saveEdit(msg.id)} className="p-1 hover:bg-white/20 rounded transition-colors"><Check size={16}/></button>
                          <button onClick={() => setEditingId(null)} className="p-1 hover:bg-white/20 rounded transition-colors"><X size={16}/></button>
                        </div>
                      </div>
                    ) : (
                      <article className={`prose prose-sm md:prose-base max-w-none ${msg.role === 'user' ? 'prose-invert' : 'prose-slate'}`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </article>
                    )}
                  </div>

                  {/* Quick Actions for User (Side) */}
                  {msg.role === 'user' && (
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button onClick={() => startEdit(msg.id, msg.content)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-purple-500 transition-colors" title="Edit"><Edit3 size={14} /></button>
                      <button onClick={() => handleDelete(msg.id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-500 transition-colors" title="Delete"><Trash2 size={14} /></button>
                    </div>
                  )}
                </div>

                {/* Toolbar for Assistant (Bottom) */}
                <div className={`flex items-center mt-1 px-2 ${msg.role === 'user' ? 'justify-end' : 'justify-between'}`}>
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{msg.role === 'user' ? 'You' : 'AI Assistant'}</span>
                   {msg.role === 'assistant' && (
                     <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-auto">
                        <div className="flex items-center gap-3 border-r border-gray-100 pr-4 mr-1">
                          <button onClick={() => handleCopy(msg.content)} className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-purple-600 transition-colors uppercase"><Copy size={14} /> Copy</button>
                          <button onClick={() => handleDelete(msg.id)} className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-red-500 transition-colors uppercase"><Trash2 size={14} /> Delete</button>
                        </div>
                        <div className="flex gap-4">
                          <button onClick={() => handleDownloadScript(msg.rawData || msg.content, 'js')} className="text-[10px] font-bold uppercase text-purple-600 hover:text-purple-800 flex items-center gap-1.5 transition-colors"><Download size={14} /> Script (.js)</button>
                          <button onClick={() => handleDownloadScript(msg.rawData || msg.content, 'json')} className="text-[10px] font-bold uppercase text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors"><Download size={14} /> Postman JSON</button>
                        </div>
                     </div>
                   )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start items-center gap-3 text-purple-600 font-bold text-xs animate-pulse ml-14">
            <Loader2 size={16} className="animate-spin" /> WRITING CODE...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t flex gap-3 items-center">
        <input value={input} onChange={(e) => setInput(e.target.value)} disabled={isLoading} className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white text-gray-600 transition-all font-medium disabled:opacity-50" placeholder="e.g., Create a test script for user registration API..." />
        <button disabled={isLoading || !input.trim()} className="bg-purple-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-100 active:scale-95 transition-all shrink-0"><Send size={20}/></button>
      </form>
    </div>
  );
}