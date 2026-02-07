"use client";
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Bot, User, Loader2, FileText, Copy, Download } from 'lucide-react';

export default function TestCasePage() {
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Mock API
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "### 📋 Test Case: Login Validation\nBelow is the generated test case based on your requirements.\n\n| Step | Description | Expected Result | Status |\n| :--- | :--- | :--- | :---: |\n| 1 | Enter a valid email address | Field accepts input | ✅ |\n| 2 | Enter password | Characters are masked | ✅ |\n| 3 | Click Sign In | Redirect to Dashboard | ✅ |\n\n**Note:** Ensure API is reachable." 
      }]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="bg-white rounded-4xlshadow-xl flex-1 flex flex-col overflow-hidden h-full border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b flex justify-between items-center bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Test Case Generator</h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Model: Qwen 2.5 Instruct</p>
          </div>
        </div>
      </div>
      
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50/50 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4 opacity-40">
            <Bot size={64} strokeWidth={1} />
            <p className="text-sm font-bold tracking-wide">Start creating a test case by typing system details.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
            <div className={`flex gap-4 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${
                msg.role === 'user' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-blue-600'
              }`}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              
              <div className="flex flex-col gap-2">
                <div className={`rounded-2xl p-3 shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                }`}>
                  {/* การแสดงผล Markdown ที่ปรับแต่งตาม Mockup */}
                  <article className={`prose prose-sm md:prose-base max-w-none 
                    ${msg.role === 'user' ? 'prose-invert' : 'prose-slate'}
                    prose-headings:font-black prose-headings:tracking-tight
                    prose-p:leading-relaxed
                    prose-table:border prose-table:border-gray-100 prose-table:rounded-xl prose-table:overflow-hidden
                    prose-th:bg-blue-50/50 prose-th:text-blue-700 prose-th:px-4 prose-th:py-3 prose-th:font-bold
                    prose-td:px-4 prose-td:py-3 prose-td:border-t prose-td:border-gray-50
                    prose-code:bg-blue-50 prose-code:text-blue-600 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md
                    prose-pre:bg-slate-900 prose-pre:rounded-2xl prose-pre:shadow-lg
                  `}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </article>

                  {/* ปุ่ม Action เสริมสำหรับ AI */}
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-50">
                      <button className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-blue-600 transition-colors">
                        <Copy size={14} /> Copy
                      </button>
                      <button className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-blue-600 transition-colors">
                        <Download size={14} /> Download
                      </button>
                    </div>
                  )}
                </div>
                <span className={`text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.role === 'user' ? 'You' : 'AI TestGen'}
                </span>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start items-center gap-3 text-blue-600 font-bold text-xs animate-pulse ml-14">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></span>
            </div>
            AI IS THINKING...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t flex gap-3 items-center">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-black transition-all font-medium disabled:opacity-50"
          placeholder="Describe the function you wish to test..."
        />
        <button 
          disabled={isLoading || !input.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-blue-100 active:scale-95 shrink-0"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}