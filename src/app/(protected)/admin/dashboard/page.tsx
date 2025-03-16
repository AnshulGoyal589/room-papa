// app/admin/page.tsx

import { checkAuth } from '@/lib/auth';
import React from 'react';

export default async function AdminDashboard() {
  // Check if the user is a manager
  await checkAuth('manager');
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Manager Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Manage Hotels</h2>
          <p className="text-gray-600 mb-4">Add, edit, or remove hotel listings</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Manage Hotels
          </button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Manage Trips</h2>
          <p className="text-gray-600 mb-4">Create and manage trip packages</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Manage Trips
          </button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Customer Bookings</h2>
          <p className="text-gray-600 mb-4">View and manage all bookings</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            View Bookings
          </button>
        </div>
      </div>
    </div>
  );
}