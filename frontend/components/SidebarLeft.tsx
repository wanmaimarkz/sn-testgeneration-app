'use client';
import { usePathname, useRouter } from 'next/navigation';
import { House, FileText, Terminal, UserCircle, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function SidebarLeft() {
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState('');

  const loadUsername = () => {
    const storedUserStr = localStorage.getItem('user');
    if (storedUserStr) {
      try {
        const userData = JSON.parse(storedUserStr);
        if (userData.username) setUsername(userData.username);
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
  };

  useEffect(() => {
    loadUsername();
    window.addEventListener('user:updated', loadUsername);
    return () => window.removeEventListener('user:updated', loadUsername);
  }, []);

  const menuItems = [
    { name: 'Home', icon: House, path: '/' },
    { name: 'Test Case', icon: FileText, path: '/test-case' },
    { name: 'Test Script', icon: Terminal, path: '/test-script' },
    { name: 'Profile', icon: UserCircle, path: '/profile' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('hf_key');
    localStorage.removeItem('hf_endpoint_url');
    localStorage.removeItem('last_testcase_chat_id');
    localStorage.removeItem('preferred_model');
    sessionStorage.clear();

    document.cookie = "isLoggedIn=; path=/; max-age=0";

    window.location.href = '/login';
  };

  const handleNewChat = (path: string) => {
    if (path === '/test-case' || path === '/test-script') {
      localStorage.removeItem('last_testcase_chat_id');
      window.dispatchEvent(new CustomEvent('chat:new'));
    }
    router.push(path);
  };

  return (
    <nav className="w-64 bg-white border-r h-full flex flex-col p-4 shadow-sm">
      <div className="mb-10 px-2 pt-4 flex items-center gap-3">
        <span className="font-bold text-4xl text-gray-800 tracking-tight">AI TestGen</span>
      </div>

      <div className="space-y-2 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || (pathname?.startsWith(item.path) && item.path !== '/');

          return (
            <button
              key={item.path}
              onClick={() => handleNewChat(item.path)}
              className={`flex items-center gap-3 p-4 rounded-2xl transition-all font-bold text-sm w-full text-left cursor-pointer ${isActive
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-500 hover:bg-gray-100'
                }`}
            >
              <Icon size={22} strokeWidth={2.5} />
              {item.name} {item.name === 'Profile' && username && `(${username})`}
            </button>
          );
        })}
      </div>
      <div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 p-4 rounded-2xl text-red-500 font-bold hover:bg-red-50 transition-colors w-full cursor-pointer"
        >
          <LogOut size={22} strokeWidth={2.5} />
          Logout
        </button>
      </div>
    </nav>
  );
}