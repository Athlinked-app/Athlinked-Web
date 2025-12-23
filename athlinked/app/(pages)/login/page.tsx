'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import SignupHero from '@/components/Signup/SignupHero';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState(''); // Can be email or username
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: identifier, password }), // Backend still expects 'email' field
      });

      const data = await response.json();

      if (!data.success) {
        setError(
          data.message || 'Login failed. Please check your credentials.'
        );
        setLoading(false);
        return;
      }

      if (data.user?.email) {
        localStorage.setItem('userEmail', data.user.email);
      } else if (data.user?.username) {
        localStorage.setItem('userEmail', `username:${data.user.username}`);
      } else {
        const isEmail = identifier.includes('@');
        localStorage.setItem(
          'userEmail',
          isEmail ? identifier : `username:${identifier}`
        );
      }

      router.push('/home');
    } catch (error) {
      console.error('Login error:', error);
      setError('Failed to connect to server. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Left Side - Hero Image */}
      <SignupHero />

      {/* Right Side - Login Form */}
      <div className="w-full md:w-1/2 xl:w-2/5 flex items-center justify-center bg-gray-100 p-4 sm:p-6 md:p-8 md:min-h-screen">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-6 sm:p-8 lg:p-10 xl:p-12 my-6 md:my-0">
          {/* Logo */}
          <div className="flex items-center mb-6 sm:mb-8">
            <img
              src="/assets/Signup/logo.png"
              alt="ATHLINKED"
              className="h-8 sm:h-10 w-auto"
            />
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600 mb-8">
            Sign in to your account to continue
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email/Username Field */}
            <div>
              <label
                htmlFor="identifier"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email/Username
              </label>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900"
                placeholder="Enter your email or username"
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent pr-12 text-gray-900"
                  placeholder="Enter your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Forgot Password Link */}
          <div className="mt-4 text-center">
            <a
              href="/forgot-password"
              className="text-sm text-yellow-500 hover:text-yellow-600 font-medium"
            >
              Forgot Password?
            </a>
          </div>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <a
                href="/signup"
                className="text-yellow-500 hover:text-yellow-600 font-semibold"
              >
                Sign Up
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
