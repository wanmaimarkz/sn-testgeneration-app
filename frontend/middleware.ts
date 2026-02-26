import { NextResponse, NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const isAuthenticated = request.cookies.get('isLoggedIn')?.value;

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/register');

  if (!isAuthenticated && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url)); // กลับไปหน้า Dashboard
  }

  return NextResponse.next();
}

// การตั้งค่า matcher เพื่อกำหนดหน้าที่ต้องการให้ตรวจสอบ
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}