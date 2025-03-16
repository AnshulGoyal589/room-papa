"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Mail, 
  Lock, 
  User, 
  EyeOff, 
  Eye, 
  UserPlus,
  Facebook
} from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement registration logic
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    console.log('Registration attempt:', formData);
  };

  const handleSocialRegister = (provider: 'google' | 'facebook') => {
    // Implement social registration logic
    console.log(`Register with ${provider}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-400 p-6 text-center text-white">
          <h2 className="text-3xl font-bold">Create Your Account</h2>
          <p className="mt-2 text-blue-100">Start your travel adventure today</p>
        </div>

        <form onSubmit={handleRegister} className="p-8 space-y-6">
          {/* Name Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">First Name</label>
              <div className="flex items-center border rounded-lg px-3 py-2">
                <User className="text-gray-400 mr-2" />
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="w-full text-gray-700 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Last Name</label>
              <div className="flex items-center border rounded-lg px-3 py-2">
                <User className="text-gray-400 mr-2" />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="w-full text-gray-700 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-gray-700 mb-2">Email Address</label>
            <div className="flex items-center border rounded-lg px-3 py-2">
              <Mail className="text-gray-400 mr-2" />
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full text-gray-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Password Inputs */}
          <div>
            <label className="block text-gray-700 mb-2">Password</label>
            <div className="flex items-center border rounded-lg px-3 py-2">
              <Lock className="text-gray-400 mr-2" />
              <input
                type={showPassword.password ? 'text' : 'password'}
                name="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full text-gray-700 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => ({
                  ...prev,
                  password: !prev.password
                }))}
                className="text-gray-400 hover:text-blue-600"
              >
                {showPassword.password ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Confirm Password</label>
            <div className="flex items-center border rounded-lg px-3 py-2">
              <Lock className="text-gray-400 mr-2" />
              <input
                type={showPassword.confirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                className="w-full text-gray-700 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => ({
                  ...prev,
                  confirmPassword: !prev.confirmPassword
                }))}
                className="text-gray-400 hover:text-blue-600"
              >
                {showPassword.confirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Register Button */}
          <Button 
            type="submit" 
            variant="primary" 
            size="lg" 
            className="w-full flex items-center justify-center"
          >
            <UserPlus className="mr-2" />
            Sign Up
          </Button>

          {/* Divider */}
          <div className="flex items-center my-4">
            <div className="flex-grow border-t"></div>
            <span className="mx-4 text-gray-500">or</span>
            <div className="flex-grow border-t"></div>
          </div>

          {/* Social Registration */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialRegister('google')}
              className="flex items-center justify-center"
            >
              <Facebook className="mr-2" />
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialRegister('facebook')}
              className="flex items-center justify-center"
            >
              <Facebook className="mr-2" />
              Facebook
            </Button>
          </div>

          {/* Login Link */}
          <div className="text-center mt-6">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link 
                href="/login" 
                className="text-blue-600 hover:underline font-semibold"
              >
                Log In
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}