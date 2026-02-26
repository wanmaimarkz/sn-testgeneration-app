'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // ใช้สำหรับการเปลี่ยนหน้า
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. สร้าง State สำหรับเก็บข้อมูลจากฟอร์ม
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });

  // 2. ตั้งเวลาให้ Error หายไปเอง
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // 3. ฟังก์ชันสำหรับส่งข้อมูลไปยัง Backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // ตรวจสอบเบื้องต้น: รหัสผ่านต้องตรงกัน
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      // ยิง API ไปยัง Backend ที่ Port 8000
      const response = await fetch('http://127.0.0.1:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed');
      }

      // เมื่อสมัครสำเร็จ ให้ส่งไปหน้า Login
      router.push('/login');
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center p-8 md:p-16 bg-white overflow-y-auto min-h-full">
      <div className="w-full max-w-md space-y-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center">
          <h2 className="text-5xl font-black text-blue-600 tracking-tight">Add account</h2>
        </div>

        {/* แสดงข้อความแจ้งเตือน Error */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl font-medium animate-in slide-in-from-top-1">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit} method='POST'>
          {/* ช่อง Username */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Username</label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              placeholder="tester"
              className="w-full px-4 py-3 bg-blue-50/50 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-black font-medium"
            />
          </div>

          {/* ช่อง Password */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={4}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="At least 4 characters"
                className="w-full px-4 py-3 bg-blue-50/50 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-black font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* ช่องยืนยัน Password */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Confirm Password</label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              placeholder="Confirm password"
              className="w-full px-4 py-3 bg-blue-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-black font-medium"
            />
          </div>

          <button 
            disabled={isLoading}
            className="w-full py-4 bg-black text-white rounded-xl font-black text-lg hover:bg-gray-800 transition-all shadow-xl active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : 'Add'}
          </button>
        </form>

        <p className="text-center text-sm font-bold text-gray-500 pt-4">
          Already have an account? <Link href="/login" className="text-blue-600 hover:underline ml-1">Log in</Link>
        </p>
      </div>
    </div>
  );
}