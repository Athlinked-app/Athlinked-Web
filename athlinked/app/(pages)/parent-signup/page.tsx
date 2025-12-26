'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SignupHero from '@/components/Signup/SignupHero';
import { Eye, EyeOff } from 'lucide-react';

function ParentSignupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const username = searchParams.get('username');
  const email = searchParams.get('email');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (!username && !email) {
      setError('Invalid signup link. Username or email parameter is missing.');
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        let response;
        if (username) {
          response = await fetch(
            `http://localhost:3001/api/signup/user-by-username/${encodeURIComponent(username)}`
          );
        } else if (email) {
          response = await fetch(
            `http://localhost:3001/api/signup/user/${encodeURIComponent(email)}`
          );
        }

        if (!response) {
          setError('Failed to fetch user data');
          setLoading(false);
          return;
        }

        const data = await response.json();

        if (data.success && data.user) {
          setUserData(data.user);
        } else {
          setError(data.message || 'User not found');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load user information');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [username, email]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-black">Loading...</p>
      </div>
    );
  }

  const handleSubmit = async () => {
    setError('');

    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:3001/api/signup/parent-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username || null,
          email: email || null,
          password: password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store user identifier in localStorage
        // Store email if available, otherwise store username with prefix
        if (data.user?.email) {
          localStorage.setItem('userEmail', data.user.email);
        } else if (data.user?.username) {
          // For username-based signups, store username with a prefix so we can identify it
          localStorage.setItem('userEmail', `username:${data.user.username}`);
        }
        router.push('/home');
      } else {
        setError(data.message || 'Failed to complete signup');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Left Side - Hero Image */}
      <SignupHero />

      {/* Right Side - Sign Up Form */}
      <div className="w-full md:w-1/2 xl:w-3/5 flex items-center justify-center bg-gray-100 p-4 sm:p-6 md:p-8 md:min-h-screen">
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
          <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">
            Complete Signup
          </h1>
          {userData && (
            <p className="text-sm sm:text-base text-black mb-4">
              Completing signup for:{' '}
              <strong>{userData.parent_name || 'Parent'}</strong>
            </p>
          )}
          <p className="text-sm sm:text-base text-black mb-6 sm:mb-8">
            Create a strong password to secure the account
          </p>

          {/* Form */}
          <div className="space-y-4 mb-6">
            {/* Create Password */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Create Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-black"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-black" />
                  ) : (
                    <Eye className="w-5 h-5 text-black" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-black"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5 text-black" />
                  ) : (
                    <Eye className="w-5 h-5 text-black" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-700 text-center">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-[#CB9729] text-gray-800 font-medium py-3 rounded-lg transition-all mb-4 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Setting Password...' : 'Continue'}
          </button>

          {/* Sign In Link */}
          <div className="text-center text-xs sm:text-sm text-black">
            <span className="text-black">Already have an account? </span>
            <a href="#" className="text-[#CB9729] font-medium hover:underline">
              Sign in
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ParentSignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
          <p className="text-black">Loading...</p>
        </div>
      }
    >
      <ParentSignupContent />
    </Suspense>
  );
}
