'use client';

import Link from 'next/link';
import { Wind, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="max-w-md w-full space-y-8 bg-[#f5f5f7]/80 dark:bg-[#1c1c1e]/80 backdrop-blur-xl p-10 rounded-3xl shadow-xl transition-colors duration-300">
        
        <div className="flex flex-col items-center text-center">
          <div className="h-16 w-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
            <Wind className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-3xl font-bold text-[#1d1d1f] dark:text-white tracking-tight">Welcome back</h2>
          <p className="text-[#86868b] dark:text-[#98989d] mt-2">Sign in to your administrator account</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1d1d1f] dark:text-white mb-1" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-4 py-3 bg-white dark:bg-white/5 border-none placeholder-[#86868b] dark:placeholder-[#98989d] text-[#1d1d1f] dark:text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm transition-shadow"
                placeholder="admin@bengaluru-aqi.gov.in"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1d1d1f] dark:text-white mb-1" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-4 py-3 bg-white dark:bg-white/5 border-none placeholder-[#86868b] dark:placeholder-[#98989d] text-[#1d1d1f] dark:text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm transition-shadow"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-none bg-white dark:bg-white/10 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-[#1d1d1f] dark:text-white">
                Remember me
              </label>
            </div>
            <div className="text-sm">
              <a href="#" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors">
                Forgot your password?
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-6">
            <Link
              href="/"
              className="group relative w-full flex justify-center py-3 px-4 text-sm font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
            >
              Sign in
            </Link>
            
            <Link
              href="/"
              className="group relative w-full flex justify-center items-center gap-2 py-3 px-4 text-sm font-medium rounded-full text-[#1d1d1f] dark:text-white bg-[#e5e5ea] dark:bg-white/10 hover:bg-[#d1d1d6] dark:hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#86868b] transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-[#86868b] dark:text-[#98989d] group-hover:text-[#1d1d1f] dark:group-hover:text-white transition-colors" />
              Cancel / Return to Dashboard
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
