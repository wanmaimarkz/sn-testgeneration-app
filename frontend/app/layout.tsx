'use client';
import './globals.css';
import SidebarLeft from '@/components/SidebarLeft';
import SidebarRight from '@/components/SidebarRight';
import { Inter, Noto_Sans_Thai } from 'next/font/google';
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const notoThai = Noto_Sans_Thai({ subsets: ['thai'], variable: '--font-noto-thai' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const showRightSidebar = pathname.includes('/test-case') || pathname.includes('/test-script');
  const isAuthPage = pathname.includes('/login') || pathname.includes('/register');
  const isProfile = pathname.includes('/profile');

  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai&display=swap" rel="stylesheet"></link>
      </head>
      <body className={`${notoThai.className} bg-gray-100 flex h-screen overflow-hidden`}>
        {!isAuthPage&&(
        <aside className="w-64 shrink-0 h-full border-r bg-white">
          <SidebarLeft />
        </aside>
        )}
        
        <main className={`flex-1 flex flex-col relative min-w-0 bg-linear-to-br from-blue-600 via-purple-600 to-indigo-800 ${
          isAuthPage||isProfile ? 'p-0' : 'p-3'
        }`}>
          {children}
        </main>

        {showRightSidebar && (
          <aside className="w-64 shrink-0 h-full border-l bg-white hidden xl:block">
            <SidebarRight />
          </aside>
        )}
      </body>
    </html>
  );
}