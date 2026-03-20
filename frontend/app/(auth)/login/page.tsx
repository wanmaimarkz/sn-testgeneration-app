'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // State สำหรับเก็บค่าจาก Input
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // ตั้งเวลาให้ Error หายไปเอง
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.email, // Backend ของคุณรับค่าในชื่อ username
          password: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      // Login สำเร็จ: เก็บข้อมูลผู้ใช้และไปหน้า Dashboard
      if (response.ok) {
        // บันทึกใน LocalStorage ตามเดิมสำหรับใช้งานในหน้าเว็บ
        localStorage.setItem('user', JSON.stringify({
          id: data.user_id,       // map user_id → id ให้ตรงกับที่ layout.tsx อ่าน
          username: data.username,
        }));

        document.cookie = "isLoggedIn=true; path=/; max-age=86400"; // อยู่ได้ 1 วัน

        router.push('/');
      }
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="flex flex-col items-center gap-1">
        <h2 className="text-5xl font-black text-blue-600 tracking-tight">Login</h2>
        <p className="text-gray-500 text-center mb-8 font-light">Welcome back! Please enter your details.</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl font-medium animate-in fade-in slide-in-from-top-1">
          {error}
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit} method='POST'>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
          <input 
            type="text" 
            required
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full text-black p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all hover:border-purple-300"
            placeholder="name@company.com"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full text-black p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              placeholder="Enter your password..."
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-gray-400 hover:text-purple-600"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Link href="/reset-password" className="text-sm text-blue-600 hover:underline">Forgot Password?</Link>
        </div>

        <button 
          disabled={isLoading}
          className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold hover:bg-black transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Sign In'}
        </button>
      </form>
      
      <p className="text-center text-sm text-gray-600 mt-8">
        Don't have an account? <Link href="/register" className="text-blue-600 font-bold hover:underline">Sign up</Link>
      </p>
    </div>
  );
}