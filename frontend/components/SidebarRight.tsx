'use client';
import { useState } from 'react';

export default function SidebarRight() {
  return (
    <aside className="w-64 bg-white border-l flex flex-col p-5 h-screen overflow-hidden shadow-2xl shrink-0">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Chat lists</h2>
      
      {/* ปุ่ม New Folder */}
      <button className="w-full border-2 border-dashed border-blue-400 rounded-2xl p-4 mb-6 text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-3 font-bold text-sm">
        <i className="fas fa-plus-square text-lg"></i>
        New Folder
      </button>

      {/* รายการแชท (Static UI ไปก่อน) */}
      <div className="flex-1 overflow-y-auto space-y-4">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] px-2 mb-4">Recent History</p>
        {/* วนลูปแสดง Chat Cards ตรงนี้ */}
      </div>
    </aside>
  );
}