'use client';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatWindow({ title, model }: { title: string; model: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  return (
    <div className="bg-white rounded-xl shadow-lg flex-1 flex flex-col overflow-hidden h-full">
      {/* Header */}
      <div className="p-6 border-b flex justify-between items-center bg-white">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <p className="text-sm text-gray-500">Model: <span className="font-semibold text-blue-600">{model}</span></p>
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50 custom-scrollbar">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
              msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border text-gray-800 rounded-tl-none'
            }`}>
              <div className="prose prose-sm max-w-none prose-table:border prose-th:bg-gray-100">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-4 bg-white border-t">
        <div className="relative flex items-center">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe the system to test..." 
            className="h-12 w-full p-4 bg-gray-100 rounded-full pr-14 outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
          />
          <button className="absolute right-3 bg-blue-500 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  );
}