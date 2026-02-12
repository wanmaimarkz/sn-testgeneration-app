'use client';
import Link from 'next/link';
import { useState } from 'react';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full flex items-center justify-center p-8 md:p-16 bg-white overflow-y-auto min-h-full">
      <div className="w-full max-w-md space-y-10 animate-in fade-in zoom-in-95 duration-500">
        {/* หัวข้อ Sign Up */}
        <div className="text-center">
          <h2 className="text-5xl font-black text-blue-600 tracking-tight">Add account</h2>
        </div>

        <form className="space-y-6" onSubmit={(e) => {
          e.preventDefault();
          window.location.href = '/login';
        }} method='POST'
          action="api/auth/register">
          {/* ช่อง Email */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Username</label>
            <input
              type="text"
              placeholder="tester"
              className="w-full px-4 py-3 bg-blue-50/50 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-black font-medium"
            />
          </div>

          {/* ช่อง Password พร้อมปุ่มเปิด/ปิดตา */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="At least 4 characters"
                className="w-full px-4 py-3 bg-blue-50/50 border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-black font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors">
              </button>
            </div>
          </div>

          {/* ช่องยืนยัน Password */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm password"
              className="w-full px-4 py-3 bg-blue-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-black font-medium"
            />
          </div>

          {/* ปุ่มสมัครสมาชิกสีดำ */}
          <button className="w-full py-4 bg-black text-white rounded-xl font-black text-lg hover:bg-gray-800 transition-all shadow-xl active:scale-[0.98] mt-4"
            type="submit">
            Add
          </button>
        </form>

        {/* ลิงก์กลับไปหน้า Login */}
        <p className="text-center text-sm font-bold text-gray-500 pt-4">
          Already have an account? <Link href="/login" className="text-blue-600 hover:underline ml-1">Log in</Link>
        </p>
      </div>
    </div>
  );
}