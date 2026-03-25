// components/testscript/CodeBlock.tsx
"use client";
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = 'typescript' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-gray-700 bg-gray-900 text-sm w-full">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
          <span className="ml-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            {language}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all ${
            copied
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
          }`}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      {/* Code content */}
      <pre className="p-5 overflow-x-auto text-gray-100 leading-relaxed font-mono text-xs md:text-sm whitespace-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}
