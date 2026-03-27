"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, Terminal, ChevronRight, Clock, Loader2, MessageCircle } from 'lucide-react';

// กำหนด Type ของ Chat ตาม Backend
interface Chat {
  id: number;
  name: string;
  created_at: string;
  folder_id: number | null;
  user_id: number;
  chat_type: 'test_case' | 'test_script';
}

export default function Dashboard() {
  const router = useRouter();
  const [recentChats, setRecentChats] = useState<Chat[]>([]);
  const [totalChats, setTotalChats] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const RECENT_LIMIT = 4;

  // ฟังก์ชันดึงประวัติแชทล่าสุดจาก API
  useEffect(() => {
    const fetchRecentChats = async () => {
      try {
        const userDataStr = localStorage.getItem('user');
        if (!userDataStr) {
          setIsLoading(false);
          return;
        }
        
        const user = JSON.parse(userDataStr);
        if (!user.id) {
          setIsLoading(false);
          return;
        }

        // ✅ เพิ่ม ?_t=${Date.now()} และ Header ตัด Cache 
        const res = await fetch(`http://127.0.0.1:8000/api/chat/user/${user.id}?_t=${Date.now()}`, { 
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache' }
        });

        if (res.ok) {
          const data = await res.json();
          setTotalChats(data.length);
          setRecentChats(data.slice(0, RECENT_LIMIT));
        }
      } catch (error) {
        console.error("Failed to fetch recent chats", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentChats();
  }, []);

  // ฟังก์ชันเปิดแชทใหม่ (กระตุ้น Sidebar ให้รีเซ็ต)
  const handleNewNavigation = (path: string) => {
    localStorage.removeItem('last_testcase_chat_id');
    window.dispatchEvent(new CustomEvent('chat:new'));
    router.push(path);
  };

  // ฟังก์ชันจัดการเมื่อคลิกประวัติแชท
  const handleChatClick = (chat: Chat) => {
    const targetPath = chat.chat_type === 'test_script' ? '/test-script' : '/test-case';
    router.push(`${targetPath}?chatId=${chat.id}`);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const dd = d.getDate().toString().padStart(2, '0');
    const mon = d.toLocaleString('en', { month: 'short' });
    const yyyy = d.getFullYear();
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    return `${dd} ${mon} ${yyyy} · ${hh}:${mm}`;
  };

  return (
    <div className="p-8 overflow-y-auto bg-white rounded-2xl h-full custom-scrollbar">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">AI Test System</h1>
          <p className="text-gray-500 text-lg">Select a tool to start generating test artifacts.</p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Card: Test Case */}
          <div 
            onClick={() => handleNewNavigation('/test-case')} 
            className="cursor-pointer group p-8 bg-white border border-gray-200 rounded-2xl hover:border-blue-500 hover:shadow-xl transition-all duration-300"
          >
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <FileText size={28} />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Test Case Generator</h2>
            <p className="text-gray-500 mb-6 text-sm">Create detailed test scenarios and plans.</p>
            <span className="text-blue-600 font-semibold inline-flex items-center gap-1">Get Started <ChevronRight size={16}/></span>
          </div>

          {/* Card: Test Script */}
          <div 
            onClick={() => handleNewNavigation('/test-script')} 
            className="cursor-pointer group p-8 bg-white border border-gray-200 rounded-2xl hover:border-purple-500 hover:shadow-xl transition-all duration-300"
          >
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Terminal size={28} />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Test Script Generator</h2>
            <p className="text-gray-500 mb-6 text-sm">Generate automation code for Playwright.</p>
            <span className="text-purple-600 font-semibold inline-flex items-center gap-1">Get Started <ChevronRight size={16}/></span>
          </div>
        </div>

        {/* History Section */}
        <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Clock size={20} className="text-gray-400" /> Recent History
              {totalChats > 0 && (
                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {totalChats}
                </span>
              )}
            </h3>
            {totalChats > RECENT_LIMIT && (
              <div
                onClick={() => handleNewNavigation('/test-case')}
                className="cursor-pointer text-xs font-bold text-blue-500 hover:text-blue-700 flex items-center gap-1 transition-colors"
              >
                View all <ChevronRight size={13} />
              </div>
            )}
          </div>
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-6 text-gray-400">
                <Loader2 className="animate-spin w-6 h-6" />
              </div>
            ) : recentChats.length > 0 ? (
              recentChats.map((chat) => (
                <div 
                  key={chat.id}
                  onClick={() => handleChatClick(chat)}
                  className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      chat.chat_type === 'test_script'
                        ? 'bg-purple-50 text-purple-500 group-hover:bg-purple-500 group-hover:text-white'
                        : 'bg-blue-50 text-blue-500 group-hover:bg-blue-500 group-hover:text-white'
                    }`}>
                      {chat.chat_type === 'test_script'
                        ? <Terminal size={20} />
                        : <FileText size={20} />
                      }
                    </div>
                    <div className="truncate">
                      <p className={`font-bold truncate transition-colors ${
                        chat.chat_type === 'test_script'
                          ? 'text-gray-700 group-hover:text-purple-700'
                          : 'text-gray-700 group-hover:text-blue-700'
                      }`}>{chat.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                          chat.chat_type === 'test_script'
                            ? 'bg-purple-100 text-purple-600'
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {chat.chat_type === 'test_script' ? 'Script' : 'Case'}
                        </span>
                        <p className="text-xs text-gray-400">{formatDate(chat.created_at)}</p>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} className={`transition-colors text-gray-300 ${
                    chat.chat_type === 'test_script' ? 'group-hover:text-purple-500' : 'group-hover:text-blue-500'
                  }`} />
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-white rounded-xl border border-gray-100 border-dashed">
                <MessageCircle size={24} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400 font-medium">No recent history found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}