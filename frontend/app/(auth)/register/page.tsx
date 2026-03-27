'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });

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

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Registration failed');

      router.push('/login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        .register-root { font-family: 'DM Sans', sans-serif; }
        
        /* Font for Headings */
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
          /* Changed from indigo to blue */
          border-color: #3b82f6; /* Blue-500 */
          box-shadow: 0 0 0 3px rgba(59,130,246,0.12); /* Blue-500 with opacity */
        }
        .input-field::placeholder { color: #9ca3af; }

        .btn-primary {
          width: 100%;
          /* Changed background to blue */
          background: #1d4ed8; /* Blue-700 for depth */
          color: #fff;
          padding: 0.875rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.9rem;
          letter-spacing: 0.01em;
          transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          cursor: pointer; border: none;
          box-shadow: 0 4px 14px rgba(29,78,216,0.25); /* Adjusted shadow color */
        }
        .btn-primary:hover:not(:disabled) {
          /* Lighter blue on hover */
          background: #2563eb; /* Blue-600 */
          box-shadow: 0 6px 20px rgba(29,78,216,0.35); /* Adjusted shadow color */
        }
        .btn-primary:active:not(:disabled) { transform: scale(0.98); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        .divider-line {
          flex: 1; height: 1px; background: #e5e7eb;
        }
      `}</style>

      <div className="register-root w-full max-w-sm">
        
        {/* Header */}
        <div className="mb-8">
          {/* Changed badge colors to blue */}
          <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full border border-blue-100 bg-blue-50">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="text-xs font-semibold text-blue-600 tracking-wide uppercase heading-font">Join Us</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-1.5 tracking-tight heading-font">
            Create account
          </h2>
          <p className="text-gray-400 text-sm font-light">Get started with your new workspace.</p>
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
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="input-field"
              placeholder="Your username"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={4}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-field"
                style={{ paddingRight: '2.75rem' }}
                placeholder="At least 4 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                /* Changed hover color to blue */
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors p-0.5"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="input-field"
              placeholder="Repeat your password"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-1">
            <button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading
                ? <><Loader2 size={16} className="animate-spin" /> Creating account...</>
                : 'Create Account'
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
          Already have an account?{' '}
          {/* Changed link color to blue */}
          <Link href="/login" className="text-blue-600 font-semibold hover:text-blue-800 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </>
  );
}