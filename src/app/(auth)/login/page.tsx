"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Mail, 
  Lock, 
  EyeOff, 
  Eye, 
  LogIn,
  Facebook
   
} from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempt:', { email, password });
  };

  const handleSocialLogin = (provider: 'google' | 'facebook') => {
    // Implement social login logic
    console.log(`Login with ${provider}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-400 p-6 text-center text-white">
          <h2 className="text-3xl font-bold">Welcome Back</h2>
          <p className="mt-2 text-blue-100">Log in to continue your travel journey</p>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {/* Email Input */}
          <div className="relative">
            <label className="block text-gray-700 mb-2">Email Address</label>
            <div className="flex items-center border rounded-lg px-3 py-2">
              <Mail className="text-gray-400 mr-2" />
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full text-gray-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="relative">
            <label className="block text-gray-700 mb-2">Password</label>
            <div className="flex items-center border rounded-lg px-3 py-2">
              <Lock className="text-gray-400 mr-2" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full text-gray-700 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-blue-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <Link 
              href="/forgot-password" 
              className="text-sm text-blue-600 hover:underline mt-2 block text-right"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Login Button */}
          <Button 
            type="submit" 
            variant="default" 
            size="lg" 
            className="w-full flex items-center justify-center"
          >
            <LogIn className="mr-2" />
            Log In
          </Button>

          {/* Divider */}
          <div className="flex items-center my-4">
            <div className="flex-grow border-t"></div>
            <span className="mx-4 text-gray-500">or</span>
            <div className="flex-grow border-t"></div>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialLogin('google')}
              className="flex items-center justify-center"
            >
              <Facebook className="mr-2" />
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialLogin('facebook')}
              className="flex items-center justify-center"
            >
              <Facebook className="mr-2" />
              Facebook
            </Button>
          </div>

          {/* Register Link */}
          <div className="text-center mt-6">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link 
                href="/register" 
                className="text-blue-600 hover:underline font-semibold"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}