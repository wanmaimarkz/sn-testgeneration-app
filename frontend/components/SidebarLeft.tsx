'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, FileText, Terminal, UserCircle, LogOut } from 'lucide-react';

export default function SidebarLeft() {
  const pathname = usePathname();

  // 2. เปลี่ยนชื่อ icon เป็น Component
  const menuItems = [
    { name: 'Dashboard', icon: House, path: '/' },
    { name: 'Test Case', icon: FileText, path: '/test-case' },
    { name: 'Test Script', icon: Terminal, path: '/test-script' },
    { name: 'Profile', icon: UserCircle, path: '/profile' },
  ];

  return (
    <nav className="w-64 bg-white border-r h-full flex flex-col p-4 shadow-sm">
      <div className="mb-10 px-2 flex items-center gap-3">
        <span className="font-bold text-xl text-gray-800 tracking-tight">AI TestGen</span>
      </div>

      <div className="space-y-2 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex items-center gap-3 p-4 rounded-2xl transition-all font-bold text-sm ${
                pathname === item.path 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <Icon size={22} strokeWidth={2.5} />
              {item.name}
            </Link>
          );
        })}
      </div>

      <Link href={"/login/"} className="flex items-center gap-3 p-4 rounded-2xl text-red-500 font-bold hover:bg-red-50 transition-colors">
        <LogOut size={22} strokeWidth={2.5} color='red'/>
        Logout
      </Link>
    </nav>
  );
}