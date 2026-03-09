'use client';
import { useState, useEffect } from 'react';
import { User, Lock, ShieldCheck, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ProfilePage() {
  // --- STATE ---
  const [userId, setUserId] = useState<number | null>(null);
  const [username, setUsername] = useState('');
  const [initialUsername, setInitialUsername] = useState(''); // Track to know if it changed

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  // --- INITIAL LOAD ---
  useEffect(() => {
    // Parse the JSON object from local storage
    const storedUserStr = localStorage.getItem('user');

    if (storedUserStr) {
      try {
        const userData = JSON.parse(storedUserStr);
        // Handle variations of the ID key (user_id or id) depending on your API
        if (userData.user_id) setUserId(userData.user_id);
        else if (userData.id) setUserId(userData.id);

        if (userData.username) {
          setUsername(userData.username);
          setInitialUsername(userData.username);
        }
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
  }, []);

  // --- FORM SUBMISSION ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    if (!userId) {
      setStatus({ type: 'error', message: 'Error: User not logged in.' });
      return;
    }

    setIsLoading(true);

    try {
      let updatedSomething = false;

      // 1. UPDATE USERNAME (Only if it changed)
      if (username && username !== initialUsername) {
        const res = await fetch('http://127.0.0.1:8000/api/profile/username', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            new_username: username
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Failed to update username');

        // Retrieve the current user object, update the username, and save it back
        const storedUserStr = localStorage.getItem('user');
        if (storedUserStr) {
          const userData = JSON.parse(storedUserStr);
          userData.username = data.new_username;
          localStorage.setItem('user', JSON.stringify(userData));
        }

        setInitialUsername(data.new_username);
        updatedSomething = true;
      }

      // 2. UPDATE PASSWORD (Only if fields are filled out)
      if (currentPassword || newPassword || confirmPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error("New passwords do not match.");
        }
        if (!currentPassword) {
          throw new Error("Current password is required to set a new password.");
        }

        const res = await fetch('http://127.0.0.1:8000/profile/password', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            current_password: currentPassword,
            new_password: newPassword
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Failed to update password');

        // Clear password fields on success
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        updatedSomething = true;
      }

      if (updatedSomething) {
        setStatus({ type: 'success', message: 'Profile updated successfully!' });
      } else {
        setStatus({ type: 'error', message: 'No changes were made.' });
      }

    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='h-full w-full overflow-y-auto custom-scrollbar bg-gray-100'>
      <div className="flex items-center justify-center min-h-full p-4 lg:p-12">
        <div className="bg-white rounded-4xl shadow-2xl shadow-black/10 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">

          {/* Header Section */}
          <div className="relative h-44 bg-gradient-to-r from-blue-600 to-indigo-700 flex flex-col items-center justify-center text-white">
            <div className="absolute -bottom-12">
              <div className="relative group">
                <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center border-4 border-white overflow-hidden">
                  <User size={48} className="text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="pt-20 p-8 lg:p-12 space-y-8">
            <div className="text-center mb-4">
              <h1 className="text-2xl font-black text-gray-800 mt-5">Profile Settings</h1>
              <p className="text-gray-400 text-sm font-medium">Update your personal information below</p>
            </div>

            {/* Status Alert Banner */}
            {status.message && (
              <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                {status.message}
              </div>
            )}

            {/* Username Section */}
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Username</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-400 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-700 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Password Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-blue-600">
                <Lock size={18} />
                <h3 className="text-sm font-bold">Security & Password</h3>
              </div>

              <div className="p-5 bg-red-50 rounded-3xl border border-red-300 space-y-3">
                <div className="flex items-center gap-2 text-red-600">
                  <ShieldCheck size={18} />
                  <label className="text-xs font-black uppercase tracking-widest">Verify Current Password</label>
                </div>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-5 py-3.5 bg-white border border-red-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500 text-gray-700"
                  placeholder="Required to change password"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-400 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-400 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-700"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 text-white rounded-2xl font-black shadow-lg transition-all flex items-center justify-center gap-3 
                ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 hover:shadow-blue-300 active:scale-[0.98]'}`}
            >
              <Save size={20} />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}