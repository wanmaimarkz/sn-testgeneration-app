'use client';
import { useState } from 'react';
import { User, Mail, Lock, ShieldCheck, Save, Camera } from 'lucide-react';

export default function ProfilePage() {
  return (
    <div className='h-full w-full overflow-y-auto custom-scrollbar bg-gray-100'>
      <div className="flex items-center justify-center min-h-full p-4 lg:p-12">
        <div className="bg-white rounded-4xl shadow-2xl shadow-black/10 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">

          {/* Header Section */}
          <div className="relative h-44 bg-linear-to-r from-blue-600 to-indigo-700 flex flex-col items-center justify-center text-white">
            <div className="absolute -bottom-12">
              <div className="relative group">
                <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center border-4 border-white overflow-hidden">
                  <User size={48} className="text-blue-600" />
                </div>
                <button className="absolute bottom-0 right-0 bg-white p-2 rounded-xl shadow-lg text-blue-600 hover:scale-110 transition-transform">
                  <Camera size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <form className="pt-20 p-8 lg:p-12 space-y-8">
            <div className="text-center mb-4">
              <h1 className="text-2xl font-black text-gray-800 mt-5">Profile Settings</h1>
              <p className="text-gray-400 text-sm font-medium">Update your personal information below</p>
            </div>

            {/* ข้อมูลชื่อ-นามสกุล */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">First Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-700 font-medium" defaultValue="Marwan" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Last Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-700 font-medium" defaultValue="Sulong" />
                </div>
              </div>
            </div>

            {/* ข้อมูลอีเมล (แสดงแบบ Read-only หรือ Disabled ตามภาพ ref) */}
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" disabled className="w-full pl-12 pr-4 py-3.5 bg-gray-100 border border-gray-200 rounded-2xl text-gray-400 cursor-not-allowed font-medium" defaultValue="marwan115613@gmail.com" />
              </div>
            </div>

            <div className="h-px bg-gray-100 w-full my-2"></div>

            {/* ส่วนเปลี่ยนรหัสผ่าน */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-blue-600">
                <Lock size={18} />
                <h3 className="text-sm font-bold">Security & Password</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                  <input type="password" placeholder="••••••••" className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-700" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Confirm Password</label>
                  <input type="password" placeholder="••••••••" className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-700" />
                </div>
              </div>

              {/* ส่วนการยืนยันรหัสผ่านเดิมด้วยสีแดงเพื่อเน้นความสำคัญ */}
              <div className="p-5 bg-red-50 rounded-3xl border border-red-100 space-y-3">
                <div className="flex items-center gap-2 text-red-600">
                  <ShieldCheck size={18} />
                  <label className="text-xs font-black uppercase tracking-widest">Verify Current Password</label>
                </div>
                <input type="password" required className="w-full px-5 py-3.5 bg-white border border-red-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500 text-gray-700" placeholder="Enter password to save changes" />
              </div>
            </div>

            <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transition-all active:scale-[0.98] flex items-center justify-center gap-3">
              <Save size={20} />
              Save Changes
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}