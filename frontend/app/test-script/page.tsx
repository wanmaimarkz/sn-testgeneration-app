"use client";
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Bot, User, Code2, Loader2, Terminal } from 'lucide-react';

export default function TestScriptPage() {
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
        content: "### Automation Script (Cypress)\n```javascript\ndescribe('Login Test', () => {\n  it('should login successfully', () => {\n    cy.visit('/login')\n    cy.get('#email').type('user@test.com')\n    cy.get('#password').type('password123')\n    cy.get('button[type=\"submit\"]').click()\n  })\n})```" 
      }]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl flex-1 flex flex-col overflow-hidden h-full border border-gray-100">
      {/* Header - เปลี่ยนสีเป็น Purple */}
      <div className="p-6 border-b flex justify-between items-center bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
            <Terminal size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Test Script Generator</h1>
            <p className="text-xs text-gray-500 font-medium">Model: Qwen 2.5 Coder</p>
          </div>
        </div>
      </div>
      
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3 opacity-60">
            <Code2 size={48} strokeWidth={1.5} />
            <p className="text-sm font-medium">พิมพ์รายละเอียดสคริปต์ที่ต้องการสร้าง (เช่น Cypress, Selenium)</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                msg.role === 'user' ? 'bg-purple-600 text-white' : 'bg-white border text-purple-600'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`rounded-2xl p-4 ${
                msg.role === 'user' ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
              }`}>
                <article className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert' : ''}`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                </article>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start items-center gap-2 text-purple-600 font-medium text-sm animate-pulse ml-11">
            <Loader2 size={16} className="animate-spin" />
            AI is coding...
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
          className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white text-black transition-all disabled:opacity-50"
          placeholder="พิมพ์รายละเอียดสคริปต์ที่ต้องการ..."
        />
        <button 
        //   ฆฆ
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-purple-100 active:scale-95 shrink-0"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}