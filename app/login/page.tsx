'use client';

import { useState, Suspense, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import Image from 'next/image';

function LoginForm() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Handle redirect when user becomes authenticated based on role
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const role = (session.user as any)?.role;

      setTimeout(() => {
        let redirectUrl = '/';

        if (role === 'admin') {
          redirectUrl = '/admin';
        } else if (role === 'hr') {
          redirectUrl = '/hr';
        } else if (role === 'employee') {
          redirectUrl = '/employee';
        }

        window.location.href = redirectUrl;
      }, 100);
    }
  }, [session, status]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An error occurred during login. Please try again.');
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Mobile Image - Full Width at Top */}
      <div className="w-full lg:hidden relative h-[360px]">
        <Image
          src="/assets/loginbg.jpg"
          alt="Professional Team"
          fill
          className="object-cover"
          priority
          unoptimized
        />
      </div>

      {/* Left Panel - Image (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/assets/loginbg.jpg"
            alt="Professional Team"
            fill
            className="object-cover"
            priority
            unoptimized
          />
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-start justify-center p-4 lg:p-12 bg-white">

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="mb-4 lg:mb-6 flex flex-col items-start">
            <Logo size="lg" className="hidden lg:block mb-6" />
            <h2 className="text-xl lg:text-2xl font-[900] text-gray-800 mt-2 lg:mt-4">Welcome back MaveriX!</h2>
            <p className="mt-1 lg:mt-2 text-xs lg:text-sm text-gray-600 text-left max-w-sm">
              We&apos;re glad to see you again. Sign in to access your dashboard and continue your work.
            </p>
          </div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSignIn}
            className="space-y-4 lg:space-y-5"
          >
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-red-50 border border-red-200 text-red-700 px-3 lg:px-4 py-2 lg:py-3 rounded-lg text-xs lg:text-sm"
              >
                {error}
              </motion.div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs lg:text-sm font-medium text-gray-700 mb-1.5 lg:mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 lg:w-5 lg:h-5" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 lg:pl-10 pr-4 py-2.5 lg:py-3 text-gray-900 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition font-secondary bg-white"
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs lg:text-sm font-medium text-gray-700 mb-1.5 lg:mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 lg:w-5 lg:h-5" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-9 lg:pl-10 pr-10 lg:pr-11 py-2.5 lg:py-3 text-gray-900 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition font-secondary bg-white"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 lg:w-5 lg:h-5" /> : <Eye className="w-4 h-4 lg:w-5 lg:h-5" />}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2.5 lg:py-3 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </motion.button>

            <div className="text-center mt-4">
              <Link 
                href="/forgot-password" 
                className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
          </motion.form>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
