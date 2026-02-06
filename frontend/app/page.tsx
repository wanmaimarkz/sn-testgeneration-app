import Link from 'next/link';
import { FileText, Terminal, ChevronRight, Clock } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="p-8 overflow-y-auto bg-white rounded-2xl h-full">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">AI Test System</h1>
          <p className="text-gray-500 text-lg">Select a tool to start generating test artifacts.</p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Card: Test Case */}
          <Link href="/test-case" className="group p-8 bg-white border border-gray-200 rounded-2xl hover:border-blue-500 hover:shadow-xl transition-all duration-300">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <FileText size={28} />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Test Case Generator</h2>
            <p className="text-gray-500 mb-6 text-sm">Create detailed test scenarios and plans using Llama 3.2.</p>
            <span className="text-blue-600 font-semibold inline-flex items-center gap-1">Get Started <ChevronRight size={16}/></span>
          </Link>

          {/* Card: Test Script */}
          <Link href="/test-script" className="group p-8 bg-white border border-gray-200 rounded-2xl hover:border-purple-500 hover:shadow-xl transition-all duration-300">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Terminal size={28} />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Test Script Generator</h2>
            <p className="text-gray-500 mb-6 text-sm">Generate automation code for Cypress or Selenium.</p>
            <span className="text-purple-600 font-semibold inline-flex items-center gap-1">Get Started <ChevronRight size={16}/></span>
          </Link>
        </div>

        {/* History Section */}
        <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Clock size={20} className="text-gray-400" /> Recent History
          </h3>
          <div className="space-y-3">
             {/* ประวัติ recent chat (อันนี้ mock)*/}
             <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-700">Login System Test</p>
                    <p className="text-xs text-gray-400">24 Oct 2025 · 14:30</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}