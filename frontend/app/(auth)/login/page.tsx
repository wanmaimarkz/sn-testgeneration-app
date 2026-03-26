'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({ email: '', password: '' });

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: formData.email, password: formData.password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Login failed');

      localStorage.setItem('user', JSON.stringify({
        id: data.user_id,
        username: data.username,
        hf_token: data.hf_token,
      }));

      if (data.hf_token) localStorage.setItem('hf_key', data.hf_token);
      document.cookie = "isLoggedIn=true; path=/; max-age=86400";
      router.push('/');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        /* เพิ่มฟอนต์ Kanit เข้ามาแทน Syne */
        @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        .login-root { font-family: 'DM Sans', sans-serif; }
        
        /* สร้าง class สำหรับ font หัวข้อ */
        .heading-font { font-family: 'Kanit', sans-serif; }

        .input-field {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1.5px solid #e5e7eb;
          border-radius: 12px;
          outline: none;
          background: #fff;
          color: #111;
          font-size: 0.875rem;
          font-family: 'DM Sans', sans-serif;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input-field:focus {
          border-color: #3b82f6; /* เปลี่ยนเป็นสีฟ้า Blue-500 */
          box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
        }
        .input-field::placeholder { color: #9ca3af; }

        .btn-primary {
          width: 100%;
          background: #1d4ed8; /* เปลี่ยนเป็นสีฟ้า Blue-700 */
          color: #fff;
          padding: 0.875rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.9rem;
          letter-spacing: 0.01em;
          transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          cursor: pointer; border: none;
          box-shadow: 0 4px 14px rgba(29,78,216,0.25);
        }
        .btn-primary:hover:not(:disabled) {
          background: #2563eb; /* Blue-600 */
          box-shadow: 0 6px 20px rgba(29,78,216,0.35);
        }
        .btn-primary:active:not(:disabled) { transform: scale(0.98); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        .divider-line {
          flex: 1; height: 1px; background: #e5e7eb;
        }
      `}</style>

      <div className="login-root w-full max-w-sm">

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full border border-blue-100 bg-blue-50">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="text-xs font-semibold text-blue-600 tracking-wide uppercase heading-font">EZ TEST</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-1.5 tracking-tight heading-font">
            Welcome back
          </h2>
          <p className="text-gray-400 text-sm font-light">Sign in to continue to your workspace.</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl animate-in fade-in slide-in-from-top-1">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>

          {/* Username */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
            <input
              type="text"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input-field"
              placeholder="name@company.com"
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-gray-700">Password</label>
              <Link href="/reset-password" className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-field"
                style={{ paddingRight: '2.75rem' }}
                placeholder="Enter your password..."
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors p-0.5"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-1">
            <button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading
                ? <><Loader2 size={16} className="animate-spin" /> Signing in...</>
                : 'Sign In'
              }
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-7 flex items-center gap-3">
          <div className="divider-line" />
          <span className="text-xs text-gray-300 shrink-0">or</span>
          <div className="divider-line" />
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-blue-600 font-semibold hover:text-blue-800 transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </>
  );
}