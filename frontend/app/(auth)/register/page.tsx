'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full flex items-center justify-center p-8 md:p-16 bg-white overflow-y-auto min-h-full">
      <div className="w-full max-w-md space-y-10 animate-in fade-in zoom-in-95 duration-500">
        {/* หัวข้อ Sign Up */}
        <div className="text-center">
          <h2 className="text-5xl font-black text-blue-600 tracking-tight">Sign Up</h2>
        </div>

        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          {/* แถว ชื่อ และ นามสกุล */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Name</label>
              <input 
                type="text" 
                placeholder="Name" 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-black font-medium" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Surname</label>
              <input 
                type="text" 
                placeholder="Surname" 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-black font-medium" 
              />
            </div>
          </div>

          {/* ช่อง Email */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Email</label>
            <input 
              type="email" 
              placeholder="test01@gmail.com" 
              className="w-full px-4 py-3 bg-blue-50/50 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-black font-medium" 
            />
          </div>

          {/* ช่อง Password พร้อมปุ่มเปิด/ปิดตา */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="At least 8 characters" 
                className="w-full px-4 py-3 bg-blue-50/50 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-black font-medium" 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* ช่องยืนยัน Password */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Confirm Password</label>
            <input 
              type="password" 
              placeholder="Confirm password" 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-black font-medium" 
            />
          </div>

          {/* ปุ่มสมัครสมาชิกสีดำ */}
          <button className="w-full py-4 bg-black text-white rounded-xl font-black text-lg hover:bg-gray-800 transition-all shadow-xl active:scale-[0.98] mt-4">
            Sign Up
          </button>
        </form>

        {/* ลิงก์กลับไปหน้า Login */}
        <p className="text-center text-sm font-bold text-gray-500 pt-4">
          Already have an account? <Link href="/login" className="text-blue-600 hover:underline ml-1">Sign in</Link>
        </p>
      </div>
    </div>
  );
}