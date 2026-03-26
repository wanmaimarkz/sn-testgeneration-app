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
}

export default function Dashboard() {
  const router = useRouter();
  const [recentChats, setRecentChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

        // เรียก API ดึงประวัติแชทของ User คนนี้
        const res = await fetch(`http://127.0.0.1:8000/api/chat/user/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          // นำมาแสดงแค่ 5 รายการล่าสุด
          setRecentChats(data.slice(0, 5));
        }
      } catch (error) {
        console.error("Failed to fetch recent chats", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentChats();
  }, []);

  // ฟังก์ชันจัดการเมื่อคลิกประวัติแชท
  const handleChatClick = (chatId: number) => {
    // บันทึก ID ลง LocalStorage เพื่อให้หน้า /test-case โหลดประวัติขึ้นมา
    localStorage.setItem('last_testcase_chat_id', String(chatId));
    router.push('/test-case');
  };

  // ฟังก์ชันแปลงวันที่ให้สวยงามอ่านง่าย
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
            {isLoading ? (
              <div className="flex items-center justify-center py-6 text-gray-400">
                <Loader2 className="animate-spin w-6 h-6" />
              </div>
            ) : recentChats.length > 0 ? (
              recentChats.map((chat) => (
                <div 
                  key={chat.id}
                  onClick={() => handleChatClick(chat.id)}
                  className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                      <MessageCircle size={20} />
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-gray-700 truncate group-hover:text-blue-700 transition-colors">{chat.name}</p>
                      <p className="text-xs text-gray-400">{formatDate(chat.created_at)}</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
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