'use client';
import { useState, useEffect, useCallback } from 'react';
import { User, Lock, ShieldCheck, AlertCircle, CheckCircle2, Key, Eye, EyeOff, Check, Trash2, Pencil, X } from 'lucide-react';

// ── Toast types ──────────────────────────────────────────────────────────────
type ToastType = 'error' | 'success' | 'warning';
interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

// ── Floating Toast Component ──────────────────────────────────────────────────
function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-bold animate-in slide-in-from-bottom-4 fade-in duration-300 min-w-[280px] max-w-sm
            ${toast.type === 'error'
              ? 'bg-red-600 text-white border-red-700 shadow-red-900/30'
              : toast.type === 'warning'
              ? 'bg-amber-500 text-white border-amber-600 shadow-amber-900/20'
              : 'bg-emerald-600 text-white border-emerald-700 shadow-emerald-900/20'
            }`}
        >
          {toast.type === 'success'
            ? <CheckCircle2 size={16} className="shrink-0" />
            : <AlertCircle size={16} className="shrink-0" />
          }
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => onDismiss(toast.id)}
            className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const [userId, setUserId] = useState<number | null>(null);

  // Username state
  const [username, setUsername] = useState('');
  const [initialUsername, setInitialUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState({ type: '', message: '' });
  const [isUsernameLoading, setIsUsernameLoading] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState({ type: '', message: '' });
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  // HF Key — input state
  const [hfKey, setHfKey] = useState('');
  const [hfEndpointUrl, setHfEndpointUrl] = useState('');
  const [showHfKey, setShowHfKey] = useState(false);

  // HF Key — SAVED state (badge / status row only updates here)
  const [savedHfKey, setSavedHfKey] = useState('');
  const [savedHfEndpointUrl, setSavedHfEndpointUrl] = useState('');

  const [hfKeyStatus, setHfKeyStatus] = useState<{ type: string; message: string }>({ type: '', message: '' });
  const [activeSection, setActiveSection] = useState<'account' | 'security' | 'api'>('account');

  // ── Toast state ──────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string, duration = 4000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    const storedUserStr = localStorage.getItem('user');
    if (storedUserStr) {
      try {
        const userData = JSON.parse(storedUserStr);
        if (userData.id) setUserId(userData.id);
        if (userData.username) {
          setUsername(userData.username);
          setInitialUsername(userData.username);
        }
      } catch (e) { console.error("Failed to parse user data", e); }
    }
    const savedKey = localStorage.getItem('hf_key');
    if (savedKey) { setHfKey(savedKey); setSavedHfKey(savedKey); }
    const savedEndpoint = localStorage.getItem('hf_endpoint_url');
    if (savedEndpoint) { setHfEndpointUrl(savedEndpoint); setSavedHfEndpointUrl(savedEndpoint); }
  }, []);

  // ── Username ──────────────────────────────────────────────────────────────
  const handleSaveUsername = async () => {
    if (!userId) { setUsernameStatus({ type: 'error', message: 'Error: User not logged in.' }); return; }
    if (!username.trim()) { setUsernameStatus({ type: 'error', message: 'Username cannot be empty.' }); return; }
    if (username === initialUsername) { setUsernameStatus({ type: 'error', message: 'No changes were made.' }); return; }

    setIsUsernameLoading(true);
    setUsernameStatus({ type: '', message: '' });
    try {
      const res = await fetch('http://127.0.0.1:8000/api/profile/username', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, new_username: username.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to update username');

      const storedUserStr = localStorage.getItem('user');
      if (storedUserStr) {
        const userData = JSON.parse(storedUserStr);
        userData.username = data.new_username;
        localStorage.setItem('user', JSON.stringify(userData));
        window.dispatchEvent(new CustomEvent('user:updated'));
      }
      setInitialUsername(data.new_username);
      setUsername(data.new_username);
      setUsernameStatus({ type: 'success', message: 'Username updated successfully!' });
      setTimeout(() => setUsernameStatus({ type: '', message: '' }), 3000);
    } catch (err: any) {
      setUsernameStatus({ type: 'error', message: err.message });
    } finally {
      setIsUsernameLoading(false);
    }
  };

  // ── Password ──────────────────────────────────────────────────────────────
  const handleSavePassword = async () => {
    if (!userId) { setPasswordStatus({ type: 'error', message: 'Error: User not logged in.' }); return; }
    if (newPassword !== confirmPassword) { setPasswordStatus({ type: 'error', message: 'New passwords do not match.' }); return; }
    if (!currentPassword) { setPasswordStatus({ type: 'error', message: 'Current password is required.' }); return; }

    setIsPasswordLoading(true);
    setPasswordStatus({ type: '', message: '' });
    try {
      const res = await fetch('http://127.0.0.1:8000/api/profile/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, current_password: currentPassword, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to update password');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setPasswordStatus({ type: 'success', message: 'Password updated successfully!' });
      setTimeout(() => setPasswordStatus({ type: '', message: '' }), 3000);
    } catch (err: any) {
      setPasswordStatus({ type: 'error', message: err.message });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  // ── HF Key ────────────────────────────────────────────────────────────────
  const handleSaveHfKey = async () => {
    const trimmed = hfKey.trim();
    const trimmedEndpoint = hfEndpointUrl.trim();
    if (!trimmed) { setHfKeyStatus({ type: 'error', message: 'Please enter HuggingFace API Key' }); return; }
    if (!trimmed.startsWith('hf_')) { setHfKeyStatus({ type: 'error', message: 'Key must start with "hf_"' }); return; }
    if (!trimmedEndpoint) { setHfKeyStatus({ type: 'error', message: 'Please enter HuggingFace Endpoint URL' }); return; }
    if (!trimmedEndpoint.startsWith('https://')) { setHfKeyStatus({ type: 'error', message: 'Endpoint URL must start with "https://"' }); return; }

    try {
      const res = await fetch('http://127.0.0.1:8000/api/profile/hf-token', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, hf_token: trimmed, hf_endpoint_url: trimmedEndpoint }),
      });
      if (!res.ok) {
        const data = await res.json();
        setHfKeyStatus({ type: 'error', message: data.detail || 'Failed to save key' });
        return;
      }
    } catch {
      setHfKeyStatus({ type: 'error', message: 'Cannot connect to server' });
      return;
    }

    localStorage.setItem('hf_key', trimmed);
    localStorage.setItem('hf_endpoint_url', trimmedEndpoint);
    setSavedHfKey(trimmed);
    setSavedHfEndpointUrl(trimmedEndpoint);
    setHfKeyStatus({ type: 'success', message: 'HuggingFace settings saved successfully' });
    setTimeout(() => setHfKeyStatus({ type: '', message: '' }), 3000);
  };

  // ── Remove HF Key → red floating toast ───────────────────────────────────
  const handleRemoveHfKey = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/profile/hf-token?user_id=${userId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        showToast('error', data.detail || 'Failed to remove key');
        return;
      }
    } catch {
      showToast('error', 'Cannot connect to server');
      return;
    }

    // --- แก้ไขส่วนนี้: ลบแค่เฉพาะ hf_key ---
    localStorage.removeItem('hf_key');
    setHfKey('');
    setSavedHfKey('');
    setHfKeyStatus({ type: '', message: '' });
    showToast('error', 'HuggingFace API key has been removed');
  };

  // ── Remove Endpoint URL → red floating toast ──────────────────────────────
  const handleRemoveEndpointUrl = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/profile/hf-endpoint?user_id=${userId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        showToast('error', data.detail || 'Failed to remove endpoint URL');
        return;
      }
    } catch {
      showToast('error', 'Cannot connect to server');
      return;
    }

    // ลบแค่เฉพาะ endpoint url
    localStorage.removeItem('hf_endpoint_url');
    setHfEndpointUrl('');
    setSavedHfEndpointUrl('');
    showToast('error', 'Inference Endpoint URL has been removed');
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const maskedKey = savedHfKey.length > 8
    ? `${savedHfKey.slice(0, 5)}${'•'.repeat(Math.min(savedHfKey.length - 8, 20))}${savedHfKey.slice(-3)}`
    : savedHfKey;

  const initials = username ? username.slice(0, 2).toUpperCase() : '??';
  const hfKeySaved = !!savedHfKey;

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'api', label: 'API Keys', icon: Key },
  ] as const;

  return (
    <>
      {/* ── Floating Toast Layer ── */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="h-full w-full overflow-y-auto bg-linear-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 custom-scrollbar">
        <div className="max-w-3xl mx-auto px-6 py-12">

          {/* Hero Card */}
          <div className="relative rounded-3xl overflow-hidden mb-8 shadow-xl shadow-blue-900/10">
            <div className="absolute inset-0 bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800" />
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/5" />
            <div className="absolute top-8 right-40 w-20 h-20 rounded-full bg-white/5" />

            <div className="relative px-10 py-10 flex items-center gap-8">
              <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg">
                  <span className="text-3xl font-black text-white tracking-tight">{initials}</span>
                </div>
                {hfKeySaved && (
                  <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-emerald-400 rounded-lg flex items-center justify-center shadow-md border-2 border-white">
                    <Key size={12} className="text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-black text-white tracking-tight truncate">{username || 'Loading...'}</h1>
                <p className="text-blue-200 text-sm font-medium mt-1">User ID #{userId}</p>
                <div className="flex items-center gap-3 mt-4 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${hfKeySaved ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30' : 'bg-white/10 text-blue-200 border border-white/20'}`}>
                    <Key size={10} />
                    {hfKeySaved ? 'HF Key Connected' : 'No HF Key'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-white/10 text-blue-200 border border-white/20">
                    <User size={10} />
                    Active Account
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Nav */}
          <div className="flex gap-1 p-1.5 bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSection(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <Icon size={15} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

            {/* ── Account Tab ── */}
            {activeSection === 'account' && (
              <div className="p-8 space-y-6">
                <div>
                  <h2 className="text-base font-black text-gray-800 mb-1">Account Information</h2>
                  <p className="text-xs text-gray-400 font-medium">Update your display name</p>
                </div>

                {usernameStatus.message && (
                  <div className={`px-4 py-3 rounded-xl flex items-center gap-2.5 text-xs font-bold border ${usernameStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                    {usernameStatus.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    {usernameStatus.message}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">Username</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <User size={15} className="text-blue-500" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-16 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-300 transition-all text-gray-700 font-semibold text-sm"
                      placeholder="Enter username"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveUsername}
                  disabled={isUsernameLoading || !username.trim() || username === initialUsername}
                  className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${isUsernameLoading || !username.trim() || username === initialUsername
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200 active:scale-[0.98]'
                    }`}
                >
                  <Pencil size={15} />
                  {isUsernameLoading ? 'Saving...' : 'Save Username'}
                </button>
              </div>
            )}

            {/* ── Security Tab ── */}
            {activeSection === 'security' && (
              <div className="p-8 space-y-6">
                <div>
                  <h2 className="text-base font-black text-gray-800 mb-1">Change Password</h2>
                  <p className="text-xs text-gray-400 font-medium">You must verify your current password before changing it.</p>
                </div>

                {passwordStatus.message && (
                  <div className={`px-4 py-3 rounded-xl flex items-center gap-2.5 text-xs font-bold border ${passwordStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                    {passwordStatus.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    {passwordStatus.message}
                  </div>
                )}

                <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={15} className="text-amber-600" />
                    <label className="text-xs font-black text-amber-700 uppercase tracking-widest">Current Password</label>
                  </div>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3.5 bg-white border border-amber-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-400 text-gray-700 text-sm font-medium"
                    placeholder="Enter your current password"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'New Password', value: newPassword, onChange: setNewPassword },
                    { label: 'Confirm Password', value: confirmPassword, onChange: setConfirmPassword },
                  ].map(({ label, value, onChange }) => (
                    <div key={label} className="space-y-2">
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">{label}</label>
                      <input
                        type="password"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-700 text-sm"
                      />
                    </div>
                  ))}
                </div>

                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs font-bold text-red-500 flex items-center gap-1.5">
                    <AlertCircle size={13} /> Passwords do not match
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleSavePassword}
                  disabled={isPasswordLoading || !currentPassword || !newPassword || !confirmPassword}
                  className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${isPasswordLoading || !currentPassword || !newPassword || !confirmPassword
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200 active:scale-[0.98]'
                    }`}
                >
                  <Lock size={15} />
                  {isPasswordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            )}

            {/* ── API Keys Tab ── */}
            {activeSection === 'api' && (
              <div className="p-8 space-y-6">
                <div>
                  <h2 className="text-base font-black text-gray-800 mb-1">HuggingFace API Key</h2>
                  <p className="text-xs text-gray-400 font-medium">
                    Required for Cloud Model — get your key at{' '}
                    <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-500 font-bold hover:underline">
                      huggingface.co/settings/tokens
                    </a>
                  </p>
                </div>

                {hfKeyStatus.message && (
                  <div className={`px-4 py-3 rounded-xl flex items-center gap-2.5 text-xs font-bold border ${hfKeyStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                    {hfKeyStatus.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    {hfKeyStatus.message}
                  </div>
                )}

                {/* Key status row */}
                <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border ${hfKeySaved ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${hfKeySaved ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${hfKeySaved ? 'text-emerald-700' : 'text-gray-500'}`}>
                      {hfKeySaved ? 'Key Connected' : 'No Key Set'}
                    </p>
                    {hfKeySaved && <p className="text-xs text-emerald-600 font-mono mt-0.5">{maskedKey}</p>}
                  </div>
                  {hfKeySaved && (
                    <button
                      type="button"
                      onClick={handleRemoveHfKey}
                      className="flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-600 transition-colors px-3 py-1.5 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  )}
                </div>

                {/* Key input */}
                <div className="space-y-2">
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">
                    {hfKeySaved ? 'Replace Key' : 'Enter Key'}
                  </label>
                  <div className="relative">
                    <Key size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showHfKey ? 'text' : 'password'}
                      value={hfKey}
                      onChange={(e) => setHfKey(e.target.value)}
                      placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-300 text-gray-800 text-sm font-mono transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowHfKey(p => !p)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showHfKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Endpoint URL input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">
                      Inference Endpoint URL
                    </label>
                    {savedHfEndpointUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveEndpointUrl}
                        className="flex items-center gap-1 text-xs font-bold text-red-400 hover:text-red-600 transition-colors px-2 py-1 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={11} /> Remove URL
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Your HuggingFace Inference Endpoint — find it at{' '}
                    <a href="https://ui.endpoints.huggingface.co" target="_blank" rel="noopener noreferrer" className="text-blue-500 font-bold hover:underline">
                      ui.endpoints.huggingface.co
                    </a>
                  </p>
                  <input
                    type="text"
                    value={hfEndpointUrl}
                    onChange={(e) => setHfEndpointUrl(e.target.value)}
                    placeholder="https://xxxxxxxxxxxxxxxx.endpoints.huggingface.cloud"
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-300 text-gray-800 text-sm font-mono transition-all"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveHfKey}
                  className="px-5 py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-sm shadow-blue-200 active:scale-[0.98] flex items-center gap-2"
                >
                  <Check size={15} />
                  Save HuggingFace Settings
                </button>
                <p className="text-[11px] text-gray-400 ml-1">Your configurations are saved securely to your account.</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}