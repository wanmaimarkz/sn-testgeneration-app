'use client';
import { useState } from 'react';
import { EllipsisVertical, FolderPlus, MessageCircle  } from 'lucide-react';

export default function SidebarRight() {
  return (
    <aside className="w-64 bg-white border-l flex flex-col p-5 h-screen overflow-hidden shadow-2xl shrink-0">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Chat lists</h2>

      {/* ปุ่ม New Folder */}
      <button className="w-full border-2 border-dashed border-blue-400 rounded-xl py-4 px-3 mb-6 text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-3 font-bold text-sm">
        <FolderPlus />
        New Folder
      </button>

      {/* รายการแชท (Static UI ไปก่อน) */}
      <div className="flex-1 overflow-y-auto space-y-4">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] px-2 mb-4">Recent History</p>
        {/* วนลูปแสดง Chat Cards ตรงนี้ */}
        <div className="space-y-3 pb-8">
          {/* mock */}
          <div className="relative group">
            <div className="flex flex-col p-2 rounded-xl border transition-all relative bg-white border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md">
              <a href="#" className="flex items-center gap-4 mb-1">
                <div className="w-10 h-10 text-blue-500 rounded-lg flex items-center justify-center shadow-inner shadow-gray-200">
                  <MessageCircle className='text-blue-500'/>
                </div>
                <div className="truncate flex-1">
                  <p className="text-sm font-bold text-gray-700 truncate">Title</p>
                  <p className="text-[10px] text-gray-400 font-medium">19:00 - 01 Fab</p>
                </div>
              </a>

              <div className="absolute top-3 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-gray-400 hover:text-blue-500 p-1">
                  <EllipsisVertical width={18}/>
                </button>
              </div>
            </div>

            <div id="opt-chat-{{ chat.id }}" className="hidden absolute right-4 top-12 w-48 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 py-2">
              <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">Options</div>
              <button className="w-full text-left px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-3">
                <i className="fas fa-pen text-xs"></i> Rename
              </button>
              <button className="w-full text-left px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-3">
                <i className="fas fa-arrows-alt text-xs"></i> Move to
              </button>
              <button className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50 flex items-center gap-3">
                <i className="far fa-trash-alt text-xs"></i> Delete
              </button>
            </div>
          </div>

          <div className="relative group">
            <div className="flex flex-col p-2 rounded-xl border transition-all relative bg-white border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md">
              <a href="#" className="flex items-center gap-4 mb-1">
                <div className="w-10 h-10 text-blue-500 rounded-lg flex items-center justify-center shadow-inner shadow-gray-200">
                  <MessageCircle className='text-blue-500'/>
                </div>
                <div className="truncate flex-1">
                  <p className="text-sm font-bold text-gray-700 truncate">Title 2</p>
                  <p className="text-[10px] text-gray-400 font-medium">18:00 - 01 Fab</p>
                </div>
              </a>

              <div className="absolute top-3 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-gray-400 hover:text-blue-500 p-1">
                  <EllipsisVertical width={18}/>
                </button>
              </div>
            </div>

            <div id="opt-chat-{{ chat.id }}" className="hidden absolute right-4 top-12 w-48 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 py-2">
              <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">Options</div>
              <button className="w-full text-left px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-3">
                <i className="fas fa-pen text-xs"></i> Rename
              </button>
              <button className="w-full text-left px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-3">
                <i className="fas fa-arrows-alt text-xs"></i> Move to
              </button>
              <button className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50 flex items-center gap-3">
                <i className="far fa-trash-alt text-xs"></i> Delete
              </button>
            </div>
          </div>


        </div>
      </div>
    </aside>
  );
}