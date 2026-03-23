'use client';
import { useState, useEffect } from 'react';
import { User, Lock, ShieldCheck, Save, AlertCircle, CheckCircle2, Key, Eye, EyeOff, Check, Trash2 } from 'lucide-react';

export default function ProfilePage() {
  const [userId, setUserId] = useState<number | null>(null);
  const [username, setUsername] = useState('');
  const [initialUsername, setInitialUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hfKey, setHfKey] = useState('');
  const [showHfKey, setShowHfKey] = useState(false);
  const [hfKeySaved, setHfKeySaved] = useState(false);
  const [hfKeyStatus, setHfKeyStatus] = useState<{ type: string; message: string }>({ type: '', message: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<'account' | 'security' | 'api'>('account');

  useEffect(() => {
    const storedUserStr = localStorage.getItem('user');
    if (storedUserStr) {
      try {
        const userData = JSON.parse(storedUserStr);
        if (userData.id) setUserId(userData.id);
        if (userData.username) { setUsername(userData.username); setInitialUsername(userData.username); }
      } catch (e) { console.error("Failed to parse user data", e); }
    }
    const savedKey = localStorage.getItem('hf_key');
    if (savedKey) { setHfKey(savedKey); setHfKeySaved(true); }
  }, []);

  const handleSaveHfKey = async () => {
    const trimmed = hfKey.trim();
    if (!trimmed) { setHfKeyStatus({ type: 'error', message: 'please enter HuggingFace API Key' }); return; }
    if (!trimmed.startsWith('hf_')) { setHfKeyStatus({ type: 'error', message: 'Key must be start with "hf_"' }); return; }

    try {
      const res = await fetch('http://127.0.0.1:8000/api/profile/hf-token', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, hf_token: trimmed }),
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
    setHfKeySaved(true);
    setHfKeyStatus({ type: 'success', message: 'Save HuggingFace Key success' });
    setTimeout(() => setHfKeyStatus({ type: '', message: '' }), 3000);
  };

  const handleRemoveHfKey = () => {
    localStorage.removeItem('hf_key');
    setHfKey(''); setHfKeySaved(false); setHfKeyStatus({ type: '', message: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    if (!userId) { setStatus({ type: 'error', message: 'Error: User not logged in.' }); return; }
    setIsLoading(true);
    try {
      let updatedSomething = false;
      if (username && username !== initialUsername) {
        const res = await fetch('http://127.0.0.1:8000/api/profile/username', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, new_username: username })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Failed to update username');
        const storedUserStr = localStorage.getItem('user');
        if (storedUserStr) { const userData = JSON.parse(storedUserStr); userData.username = data.new_username; localStorage.setItem('user', JSON.stringify(userData)); }
        setInitialUsername(data.new_username); updatedSomething = true;
      }
      if (currentPassword || newPassword || confirmPassword) {
        if (newPassword !== confirmPassword) throw new Error("New passwords do not match.");
        if (!currentPassword) throw new Error("Current password is required.");
        const res = await fetch('http://127.0.0.1:8000/api/profile/password', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, current_password: currentPassword, new_password: newPassword })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Failed to update password');
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); updatedSomething = true;
      }
      if (updatedSomething) { setStatus({ type: 'success', message: 'Profile updated successfully!' }); }
      else { setStatus({ type: 'error', message: 'No changes were made.' }); }
    } catch (err: any) { setStatus({ type: 'error', message: err.message }); }
    finally { setIsLoading(false); }
  };

  const maskedKey = hfKey.length > 8
    ? `${hfKey.slice(0, 5)}${'•'.repeat(Math.min(hfKey.length - 8, 20))}${hfKey.slice(-3)}`
    : hfKey;

  const initials = username ? username.slice(0, 2).toUpperCase() : '??';

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'api', label: 'API Keys', icon: Key },
  ] as const;

  return (
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
                onClick={() => { setActiveSection(tab.id); setStatus({ type: '', message: '' }); }}
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

        {/* Status Banner */}
        {status.message && (
          <div className={`mb-5 px-5 py-4 rounded-2xl flex items-center gap-3 text-sm font-bold border ${status.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-red-50 text-red-600 border-red-200'
            }`}>
            {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

            {/* Account Tab */}
            {activeSection === 'account' && (
              <div className="p-8 space-y-6">
                <div>
                  <h2 className="text-base font-black text-gray-800 mb-1">Account Information</h2>
                  <p className="text-xs text-gray-400 font-medium">Update your display name</p>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">Username</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <User size={15} className="text-blue-500" />
                    </div>
                    <input
                      disabled
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="w-full pl-16 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-300 transition-all text-gray-400 font-semibold text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeSection === 'security' && (
              <div className="p-8 space-y-6">
                <div>
                  <h2 className="text-base font-black text-gray-800 mb-1">Change Password</h2>
                  <p className="text-xs text-gray-400 font-medium">You must verify your current password before changing it.</p>
                </div>
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
                  type="submit"
                  disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
                  className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${isLoading || !currentPassword || !newPassword || !confirmPassword
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200 active:scale-[0.98]'
                    }`}
                >
                  <Lock size={15} />
                  {isLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            )}

            {/* API Keys Tab */}
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
                  <div className={`px-4 py-3 rounded-xl flex items-center gap-2.5 text-xs font-bold border ${hfKeyStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'
                    }`}>
                    {hfKeyStatus.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    {hfKeyStatus.message}
                  </div>
                )}

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

                <div className="space-y-2">
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">
                    {hfKeySaved ? 'Replace Key' : 'Enter Key'}
                  </label>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Key size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showHfKey ? 'text' : 'password'}
                        value={hfKey}
                        onChange={(e) => { setHfKey(e.target.value); setHfKeySaved(false); }}
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
                    <button
                      type="button"
                      onClick={handleSaveHfKey}
                      className="px-5 py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-sm shadow-blue-200 active:scale-[0.98] shrink-0 flex items-center gap-2"
                    >
                      <Check size={15} />
                      Save
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400 ml-1">Your key is stored locally in your browser only.</p>
                </div>
              </div>
            )}

          </div>
        </form>
      </div>
    </div>
  );
}