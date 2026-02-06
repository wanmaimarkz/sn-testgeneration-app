'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full max-w-sm">
      <h2 className="text-4xl font-bold text-gray-900 mb-2 text-center">Sign In</h2>
      <p className="text-gray-500 text-center mb-8 font-light">Welcome back! Please enter your details.</p>

      <form className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
          <input 
            type="email" 
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all hover:border-purple-300"
            placeholder="name@company.com"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              placeholder="••••••••"
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-gray-400 hover:text-purple-600"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Link href="/reset-password" className="text-sm text-blue-600 hover:underline">Forgot Password?</Link>
        </div>

        <button className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold hover:bg-black transition-all active:scale-[0.98] shadow-lg">
          Sign In
        </button>
      </form>
      
      <p className="text-center text-sm text-gray-600 mt-8">
        Don't have an account? <Link href="/register" className="text-blue-600 font-bold hover:underline">Sign up</Link>
      </p>
    </div>
  );
}