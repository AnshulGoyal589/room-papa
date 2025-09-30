'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookingDetails } from '@/lib/mongodb/models/Booking';
import { Button } from '@/components/ui/button';

// Define the props this component receives from the server page.
interface AppointmentsClientViewProps {
  initialBookings: BookingDetails[];
  totalPages: number;
  currentPage: number;
  currentFilters: {
    type: string;
    search: string;
  };
}

export default function AppointmentsClientView({ 
  initialBookings, 
  totalPages, 
  currentPage, 
  currentFilters 
}: AppointmentsClientViewProps) {
  const router = useRouter();
  
  // Initialize state for the filter inputs with the values from the server (read from the URL).
  const [typeFilter, setTypeFilter] = useState(currentFilters.type);
  const [searchTerm, setSearchTerm] = useState(currentFilters.search);
  
  // The bookings list is now a prop, not state. It's updated by the server on re-render.
  const bookings = initialBookings;

  // This function is the core of the client-side interaction.
  // It builds the new URL and tells the router to navigate to it.
  // This triggers a re-render of the parent Server Component, which fetches the new data.
  const handleFilterChange = () => {
    const params = new URLSearchParams();
    if (typeFilter !== 'all') params.set('type', typeFilter);
    if (searchTerm) params.set('search', searchTerm);
    
    // Reset to page 1 when filters change
    // params.set('page', '1'); // Optional: you might want to reset to page 1 on filter change
    
    router.push(`/manager/appointments?${params.toString()}`);
  };
  
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    if (typeFilter !== 'all') params.set('type', typeFilter);
    if (searchTerm) params.set('search', searchTerm);
    if (newPage > 1) params.set('page', String(newPage));
    router.push(`/manager/appointments?${params.toString()}`);
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Your Booked Activities</h1>
        
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search by Title or Guest</label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFilterChange()}
                placeholder="Search and press Enter..."
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#003c95]"
              />
            </div>
            
            <div className="w-full md:w-auto">
              <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                id="type-filter"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  // Optionally trigger search on change or wait for button click
                }}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#003c95]"
              >
                <option value="all">All Types</option>
                <option value="property">Property</option>
                <option value="travelling">Travelling</option>
                <option value="trip">Trip</option>
              </select>
            </div>
            <Button onClick={handleFilterChange}>Apply Filters</Button>
          </div>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-medium text-gray-600">No appointments found</h3>
          <p className="text-gray-500 mt-2">
            {typeFilter !== 'all' || searchTerm
              ? 'Try adjusting your filters to see more results'
              : 'You don\'t have any appointments yet'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guest
                  </th>
              
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <tr key={booking.details.id?.toString()} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.details.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.details.locationFrom} → {booking.details.locationTo}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm capitalize text-gray-900">
                        {booking.type}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(booking.bookingDetails.checkIn)} - {formatDate(booking.bookingDetails.checkOut)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {booking.guestDetails.firstName} {booking.guestDetails.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.guestDetails.email}
                      </div>
                    </td>
               
 
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <nav className="flex items-center space-x-2">
                <Button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1}>Previous</Button>
                <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
                <Button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages}>Next</Button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
}