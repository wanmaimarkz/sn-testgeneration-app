'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import {
  EllipsisVertical, FolderPlus, MessageCircle, Pencil,
  ArrowRightLeft, Trash2, Loader2, Folder, Check, X, ChevronRight, ChevronDown,
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Chat {
  id: number;
  name: string;           // backend uses "name" not "title"
  created_at: string;
  folder_id: number | null;
  user_id: number;
}

interface FolderItem {
  id: number;
  name: string;
  user_id: number;
}

interface SidebarRightProps {
  userId?: number | null;
  selectedChatId?: number | null;
  onChatSelect?: (chatId: number) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  const dd = d.getDate().toString().padStart(2, '0');
  const mon = d.toLocaleString('en', { month: 'short' });
  return `${hh}:${mm} · ${dd} ${mon}`;
}

// ─── API Calls ────────────────────────────────────────────────────────────────

const fetchWithTimeout = (url: string, options?: RequestInit, ms = 8000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
};

const api = {
  getChats: (userId: number) =>
    fetchWithTimeout(`${API_BASE}/chat/user/${userId}`)
      .then(r => r.json()) as Promise<Chat[]>,

  getFolders: (userId: number) =>
    fetchWithTimeout(`${API_BASE}/folder/user/${userId}`)
      .then(r => r.json()) as Promise<FolderItem[]>,

  deleteChat: (chatId: number) =>
    fetch(`${API_BASE}/chat/${chatId}`, { method: 'DELETE' }),

  renameChat: (chatId: number, name: string) =>
    fetch(`${API_BASE}/chat/${chatId}/rename`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }),

  moveChat: (chatId: number, folderId: number | null) =>
    fetch(`${API_BASE}/chat/${chatId}/move`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder_id: folderId }),
    }),

  createFolder: async (name: string, userId: number) => {
    const res = await fetch(`${API_BASE}/folder/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, user_id: userId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail ?? 'Failed to create folder');
    return data as FolderItem;
  },

  deleteFolder: (folderId: number) =>
    fetch(`${API_BASE}/folder/${folderId}`, { method: 'DELETE' }),

  renameFolder: (folderId: number, name: string) =>
    fetch(`${API_BASE}/folder/${folderId}/rename`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }),
};

// ─── Inline Rename Input ───────────────────────────────────────────────────────

function InlineRename({
  defaultValue,
  onConfirm,
  onCancel,
}: {
  defaultValue: string;
  onConfirm: (val: string) => void;
  onCancel: () => void;
}) {
  const [val, setVal] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);

  return (
    <div className="flex items-center gap-1 px-1">
      <input
        ref={inputRef}
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); onConfirm(val.trim()); }
          if (e.key === 'Escape') onCancel();
        }}
        className="flex-1 text-sm border border-blue-300 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-200 min-w-0"
      />
      <button type="button" onClick={() => onConfirm(val.trim())} className="text-green-500 hover:text-green-600 p-0.5">
        <Check width={14} />
      </button>
      <button type="button" onClick={onCancel} className="text-gray-400 hover:text-red-400 p-0.5">
        <X width={14} />
      </button>
    </div>
  );
}

// ─── Move-to Sub-menu ─────────────────────────────────────────────────────────

function MoveToMenu({
  folders,
  currentFolderId,
  onMove,
}: {
  folders: FolderItem[];
  currentFolderId: number | null;
  onMove: (folderId: number | null) => void;
}) {
  return (
    <div className="absolute left-full top-0 ml-1 w-44 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 py-2">
      <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">
        Move to
      </div>
      {currentFolderId !== null && (
        <button
          onClick={() => onMove(null)}
          className="w-full text-left px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50 italic"
        >
          Remove from folder
        </button>
      )}
      {folders.length === 0 && (
        <p className="px-4 py-2 text-xs text-gray-400">No folders yet</p>
      )}
      {folders.map(f => (
        <button
          key={f.id}
          onClick={() => onMove(f.id)}
          disabled={f.id === currentFolderId}
          className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-blue-50 flex items-center gap-2 disabled:opacity-40"
        >
          <Folder className="w-3.5 h-3.5 text-blue-400" />
          <span className="truncate">{f.name}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Chat Card ────────────────────────────────────────────────────────────────

function ChatCard({
  chat,
  folders,
  openMenuId,
  setOpenMenuId,
  onDelete,
  onRename,
  onMove,
  onSelect,
  isSelected,
}: {
  chat: Chat;
  folders: FolderItem[];
  openMenuId: number | null;
  setOpenMenuId: (id: number | null) => void;
  onDelete: (id: number) => void;
  onRename: (id: number, name: string) => void;
  onMove: (id: number, folderId: number | null) => void;
  onSelect?: (chatId: number) => void;
  isSelected?: boolean;
}) {
  const [renaming, setRenaming] = useState(false);
  const [showMove, setShowMove] = useState(false);
  const isOpen = openMenuId === chat.id;

  return (
    <div className="relative group">
      <div className={`flex flex-col p-2 rounded-xl border transition-all bg-white shadow-sm
        ${isSelected
          ? 'border-blue-400 bg-blue-50 shadow-md'
          : isOpen
            ? 'border-blue-200 shadow-md'
            : 'border-gray-100 hover:border-blue-200 hover:shadow-md'}`}>

        {renaming ? (
          <InlineRename
            defaultValue={chat.name}
            onConfirm={name => { onRename(chat.id, name); setRenaming(false); }}
            onCancel={() => setRenaming(false)}
          />
        ) : (
          <button
            onClick={() => {
              onSelect?.(chat.id);
              window.dispatchEvent(new CustomEvent('chat:selected', { detail: { chatId: chat.id } }));
            }}
            className="flex items-center gap-3 text-left w-full"
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-50 shrink-0">
              <MessageCircle className="w-4 h-4 text-blue-500" />
            </div>
            <div className="truncate flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>{chat.name}</p>
              <p className="text-[10px] text-gray-400 font-medium">{formatDate(chat.created_at)}</p>
            </div>
          </button>
        )}

        {!renaming && (
          <div className={`absolute top-2.5 right-2 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <button
              className="text-gray-400 hover:text-blue-500 p-1 rounded-lg hover:bg-blue-50"
              onClick={e => { e.preventDefault(); setOpenMenuId(isOpen ? null : chat.id); setShowMove(false); }}
            >
              <EllipsisVertical width={16} />
            </button>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-2 top-11 w-44 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 py-1.5">
          <div className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">
            Options
          </div>

          <button
            className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2.5"
            onClick={() => { setRenaming(true); setOpenMenuId(null); }}
          >
            <Pencil className="w-3 h-3" /> Rename
          </button>

          <div className="relative">
            <button
              className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2.5"
              onClick={() => setShowMove(p => !p)}
            >
              <ArrowRightLeft className="w-3 h-3" />
              Move to
              <ChevronRight className="w-3 h-3 ml-auto" />
            </button>
            {showMove && (
              <MoveToMenu
                folders={folders}
                currentFolderId={chat.folder_id}
                onMove={folderId => { onMove(chat.id, folderId); setOpenMenuId(null); setShowMove(false); }}
              />
            )}
          </div>

          <div className="border-t border-gray-50 mt-1 pt-1">
            <button
              className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2.5"
              onClick={() => { onDelete(chat.id); setOpenMenuId(null); }}
            >
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Folder Section ───────────────────────────────────────────────────────────

function FolderSection({
  folder, chats, folders, openMenuId, setOpenMenuId,
  onDeleteChat, onRenameChat, onMoveChat, onDeleteFolder, onRenameFolder,
  selectedChatId, onSelectChat,
}: {
  folder: FolderItem;
  chats: Chat[];
  folders: FolderItem[];
  openMenuId: number | null;
  setOpenMenuId: (id: number | null) => void;
  onDeleteChat: (id: number) => void;
  onRenameChat: (id: number, name: string) => void;
  onMoveChat: (id: number, folderId: number | null) => void;
  onDeleteFolder: (id: number) => void;
  onRenameFolder: (id: number, name: string) => void;
  selectedChatId?: number | null;
  onSelectChat?: (chatId: number) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [renamingFolder, setRenamingFolder] = useState(false);
  const [folderMenuOpen, setFolderMenuOpen] = useState(false);

  return (
    <div className="mb-1">
      {/* Folder Header */}
      <div className="group flex items-center gap-1 px-1 py-1.5 rounded-lg hover:bg-gray-50">
        <button className="flex items-center gap-1.5 flex-1 min-w-0" onClick={() => setCollapsed(p => !p)}>
          {collapsed
            ? <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
            : <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" />}
          <Folder className="w-4 h-4 text-blue-400 shrink-0" />
          {!renamingFolder && (
            <span className="text-xs font-semibold text-gray-600 truncate">{folder.name}</span>
          )}
        </button>

        {renamingFolder ? (
          <div className="flex-1">
            <InlineRename
              defaultValue={folder.name}
              onConfirm={name => { onRenameFolder(folder.id, name); setRenamingFolder(false); }}
              onCancel={() => setRenamingFolder(false)}
            />
          </div>
        ) : (
          <div className="relative opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              className="text-gray-400 hover:text-blue-500 p-0.5 rounded"
              onClick={() => setFolderMenuOpen(p => !p)}
            >
              <EllipsisVertical width={14} />
            </button>
            {folderMenuOpen && (
              <div className="absolute right-0 top-6 w-40 bg-white border border-gray-100 rounded-xl shadow-2xl z-50 py-1.5">
                <button
                  className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => { setRenamingFolder(true); setFolderMenuOpen(false); }}
                >
                  <Pencil className="w-3 h-3" /> Rename
                </button>
                <button
                  className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
                  onClick={() => { onDeleteFolder(folder.id); setFolderMenuOpen(false); }}
                >
                  <Trash2 className="w-3 h-3" /> Delete folder
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Folder Contents */}
      {!collapsed && (
        <div className="ml-4 mt-1 space-y-1.5 border-l border-gray-100 pl-2">
          {chats.length === 0 && (
            <p className="text-[11px] text-gray-400 py-1 px-2 italic">Empty folder</p>
          )}
          {chats.map(chat => (
            <ChatCard
              key={chat.id}
              chat={chat}
              folders={folders}
              openMenuId={openMenuId}
              setOpenMenuId={setOpenMenuId}
              onDelete={onDeleteChat}
              onRename={onRenameChat}
              onMove={onMoveChat}
              onSelect={onSelectChat}
              isSelected={selectedChatId === chat.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

export default function SidebarRight({ userId }: SidebarRightProps) {
  const pathname = usePathname();
  const [chats, setChats] = useState<Chat[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      const [fetchedChats, fetchedFolders] = await Promise.all([
        api.getChats(userId),
        api.getFolders(userId),
      ]);
      setChats(Array.isArray(fetchedChats) ? fetchedChats : []);
      setFolders(Array.isArray(fetchedFolders) ? fetchedFolders : []);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Connection timed out — is the server running?');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load');
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // layout render SidebarRight เฉพาะ test-case / test-script อยู่แล้ว ไม่ต้องเช็ค path ซ้ำ
  // pathname ใน deps → refetch ทุกครั้งที่ navigate ระหว่าง test-case ↔ test-script
  useEffect(() => {
    if (userId) fetchData();
  }, [userId, pathname, fetchData]);

  // ── Close menus on outside click ────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Chat Actions ────────────────────────────────────────────────────────────
  const handleDeleteChat = async (chatId: number) => {
    setChats(prev => prev.filter(c => c.id !== chatId)); // optimistic
    await api.deleteChat(chatId);
    fetchData(); // sync กับ server
  };

  const handleRenameChat = async (chatId: number, name: string) => {
    if (!name) return;
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, name } : c)); // optimistic
    await api.renameChat(chatId, name);
    fetchData();
  };

  const handleMoveChat = async (chatId: number, folderId: number | null) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, folder_id: folderId } : c)); // optimistic
    await api.moveChat(chatId, folderId);
    fetchData();
  };

  // ── Folder Actions ──────────────────────────────────────────────────────────
  const [folderError, setFolderError] = useState<string | null>(null);

  const handleCreateFolder = async (name: string) => {
    if (!name || !userId) return;
    setFolderError(null);
    try {
      const res = await api.createFolder(name, userId);
      if ('detail' in res) throw new Error((res as any).detail);
      setCreatingFolder(false);
      fetchData(); // sync จาก server
    } catch (err) {
      setFolderError(err instanceof Error ? err.message : 'Failed to create folder');
    }
  };

  const handleDeleteFolder = async (folderId: number) => {
    setFolders(prev => prev.filter(f => f.id !== folderId));
    setChats(prev => prev.filter(c => c.folder_id !== folderId));
    await api.deleteFolder(folderId);
    fetchData();
  };

  const handleRenameFolder = async (folderId: number, name: string) => {
    if (!name) return;
    setFolders(prev => prev.map(f => f.id === folderId ? { ...f, name } : f));
    await api.renameFolder(folderId, name);
    fetchData();
  };

  // รับ event จาก page.tsx เมื่อสร้าง chat ใหม่
  // ใช้งาน: window.dispatchEvent(new CustomEvent('chat:created'))
  useEffect(() => {
    const handler = () => fetchData();
    window.addEventListener('chat:created', handler);
    return () => window.removeEventListener('chat:created', handler);
  }, [fetchData]);

  const unassignedChats = (chats ?? []).filter(c => c.folder_id === null);

  return (
    <aside
      ref={sidebarRef}
      className="w-64 bg-white border-l flex flex-col p-5 h-screen overflow-hidden shadow-2xl shrink-0"
    >
      <h2 className="text-xl font-bold text-gray-800 mb-6">Chat lists</h2>

      {/* New Folder */}
      {creatingFolder ? (
        <div className="mb-4">
          <InlineRename
            defaultValue=""
            onConfirm={handleCreateFolder}
            onCancel={() => { setCreatingFolder(false); setFolderError(null); }}
          />
          {folderError && (
            <p className="text-[11px] text-red-400 font-medium mt-1.5 px-1">{folderError}</p>
          )}
        </div>
      ) : (
        <button
          onClick={() => setCreatingFolder(true)}
          className="w-full border-2 border-dashed border-blue-400 rounded-xl py-4 px-3 mb-6 text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-3 font-bold text-sm"
        >
          <FolderPlus />
          New Folder
        </button>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] px-2 mb-3">
          Recent History
        </p>

        {loading && (
          <div className="flex items-center justify-center py-10 text-gray-400">
            <Loader2 className="animate-spin w-5 h-5 mr-2" />
            <span className="text-sm">Loading...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-6 px-2">
            <p className="text-xs text-red-400 font-medium mb-2">{error}</p>
            <button onClick={fetchData} className="text-xs text-blue-500 hover:underline">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && chats.length === 0 && folders.length === 0 && (
          <div className="text-center py-10">
            <MessageCircle className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-400">No chats yet</p>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-1 pb-8">
            {/* Folder sections */}
            {(folders ?? []).map(folder => (
              <FolderSection
                key={folder.id}
                folder={folder}
                chats={chats.filter(c => c.folder_id === folder.id)}
                folders={folders}
                openMenuId={openMenuId}
                setOpenMenuId={setOpenMenuId}
                onDeleteChat={handleDeleteChat}
                onRenameChat={handleRenameChat}
                onMoveChat={handleMoveChat}
                onDeleteFolder={handleDeleteFolder}
                onRenameFolder={handleRenameFolder}
                selectedChatId={selectedChatId}
                onSelectChat={setSelectedChatId}
              />
            ))}

            {/* Unassigned chats */}
            {unassignedChats.length > 0 && folders.length > 0 && (
              <p className="text-[11px] font-bold text-gray-300 uppercase tracking-widest px-1 pt-3 pb-1">
                Unsorted
              </p>
            )}
            <div className="space-y-2">
              {unassignedChats.map(chat => (
                <ChatCard
                  key={chat.id}
                  chat={chat}
                  folders={folders}
                  openMenuId={openMenuId}
                  setOpenMenuId={setOpenMenuId}
                  onDelete={handleDeleteChat}
                  onRename={handleRenameChat}
                  onMove={handleMoveChat}
                  onSelect={setSelectedChatId}
                  isSelected={selectedChatId === chat.id}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}