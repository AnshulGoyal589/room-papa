'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Booking } from '@/lib/mongodb/models/Booking';
import { Button } from '@/components/ui/button';
import BookingDetailModal from './BookingDetailModal';

interface AppointmentsClientViewProps {
  initialBookings: Booking[];
  currentFilters: {
    type: string;
    search: string;
  };
}

export default function AppointmentsClientView({ 
  initialBookings,
  currentFilters 
}: AppointmentsClientViewProps) {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState(currentFilters.type);
  const [searchTerm, setSearchTerm] = useState(currentFilters.search);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  
  const bookings = initialBookings;
  
  const handleFilterChange = () => {
    const params = new URLSearchParams();
    if (typeFilter !== 'all') params.set('type', typeFilter);
    if (searchTerm) params.set('search', searchTerm);
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
                  <tr 
                    key={booking.infoDetails.id?.toString()} 
                    className="hover:bg-gray-100 cursor-pointer" // Added hover and cursor
                    onClick={() => setSelectedBooking(booking)} // Set the selected booking on click
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.infoDetails.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.infoDetails.location?.address}
                        
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
        </>
      )}
      {selectedBooking && (
        <BookingDetailModal 
          booking={selectedBooking} 
          onClose={() => setSelectedBooking(null)} // Pass a function to close the modal
        />
      )}
    </div>
  );
}