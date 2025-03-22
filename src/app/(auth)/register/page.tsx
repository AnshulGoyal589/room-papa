"use client"

import React, { useEffect } from 'react';
import { useClerk } from '@clerk/nextjs';

const RegisterPage = () => {
  const { openSignUp } = useClerk();

  useEffect(() => {
    openSignUp();
  }, [openSignUp]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-8">Welcome to Our App</h1>
      <p className="text-lg text-gray-600">
        Please sign up to continue.
      </p>
    </div>
  );
};

export default RegisterPage;
