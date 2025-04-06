
'use client';

import { useEffect, useState } from 'react';
// import { Booking } from '@/lib/mongodb/models/booking';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {useUser} from '@clerk/nextjs';
import { BookingDetails } from '@/lib/mongodb/models/Booking';
// import { useToast } from '@/components/ui/use-toast';

export default function ManagerAppointmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // const { toast } = useToast();
  
  const { isSignedIn, user, isLoaded } = useUser();
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [filter, setFilter] = useState<string>(searchParams?.get('type') || 'all');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams?.get('status') || 'all');
  const [searchTerm, setSearchTerm] = useState<string>(searchParams?.get('search') || '');
  
  // Pagination
  const [page, setPage] = useState<number>(parseInt(searchParams?.get('page') || '1'));
  const [totalPages, setTotalPages] = useState<number>(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchBookings = async () => {
      if ( !isLoaded ) return;

      if (!isSignedIn) {
        setError('You must be logged in to view appointments');
        setLoading(false);
        return;
      }

      const managerStatusRes = await fetch(`/api/managerStatus`);
      const managerStatus = await managerStatusRes.json();
      if (!managerStatus.isManager) {
        alert('You are not authorized to access this page.');   
        router.push('/manager/dashboard');       
        return;
      }

      try {
        // Build query params
        const queryParams = new URLSearchParams();
        
        if (filter !== 'all') {
          queryParams.append('type', filter);
        }

        if (searchTerm) {
          queryParams.append('searchTerm', searchTerm);
        }
        
        // Pagination
        queryParams.append('limit', itemsPerPage.toString());
        queryParams.append('skip', ((page - 1) * itemsPerPage).toString());
        
        // Default sorting
        queryParams.append('sortBy', 'updatedAt');
        queryParams.append('sortOrder', 'desc');
        queryParams.append('ownerId', user.id);
        
        const response = await fetch(`/api/bookings/manager?${queryParams.toString()}`);

        
        if (!response.ok) {
          throw new Error('Failed to fetch bookings');
        }
        
        const data = await response.json();
        // console.log('Fetched bookings:', data);
        setBookings(data);
        
        // Get total count for pagination
        const countResponse = await fetch(`/api/bookings/manager/count?${queryParams.toString()}`);
        if (countResponse.ok) {
          const { count } = await countResponse.json();
          setTotalPages(Math.ceil(count / itemsPerPage));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [ filter, statusFilter, searchTerm, page , isSignedIn, isLoaded, user , router]); 

  // Update URL when filters change
  const updateFilters = (newFilter?: string, newStatus?: string, newSearch?: string, newPage?: number) => {
    const params = new URLSearchParams();
    
    const updatedFilter = newFilter !== undefined ? newFilter : filter;
    const updatedStatus = newStatus !== undefined ? newStatus : statusFilter;
    const updatedSearch = newSearch !== undefined ? newSearch : searchTerm;
    const updatedPage = newPage !== undefined ? newPage : page;
    
    if (updatedFilter !== 'all') params.set('type', updatedFilter);
    if (updatedStatus !== 'all') params.set('status', updatedStatus);
    if (updatedSearch) params.set('search', updatedSearch);
    if (updatedPage > 1) params.set('page', updatedPage.toString());
    
    const queryString = params.toString();
    router.push(`/manager/appointments${queryString ? `?${queryString}` : ''}`);
    
    if (newFilter !== undefined) setFilter(newFilter);
    if (newStatus !== undefined) setStatusFilter(newStatus);
    if (newSearch !== undefined) setSearchTerm(newSearch);
    if (newPage !== undefined) setPage(newPage);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };



  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center p-8 bg-red-50 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-700 mb-4">Error</h2>
          <p className="text-red-600">{error}</p>
          <Link href="/dashboard" className="mt-4 inline-block text-blue-600 hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Your Booked Activities</h1>
        
        {/* Search and filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search title, location, guest..."
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button 
                  onClick={() => updateFilters(undefined, undefined, searchTerm, 1)}
                  className="absolute right-2 top-2 text-gray-500 hover:text-blue-500"
                >
                  🔍
                </button>
              </div>
            </div>
            
            <div>
              <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                id="type-filter"
                value={filter}
                onChange={(e) => updateFilters(e.target.value, undefined, undefined, 1)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="property">Property</option>
                <option value="travelling">Travelling</option>
                <option value="trip">Trip</option>
              </select>
            </div>
            
            {/* <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => updateFilters(undefined, e.target.value, undefined, 1)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div> */}
            
            {/* <div className="self-end">
              <Link
                href="/dashboard/appointments/new"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
              >
                Create New
              </Link>
            </div> */}
          </div>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-medium text-gray-600">No appointments found</h3>
          <p className="text-gray-500 mt-2">
            {filter !== 'all' || statusFilter !== 'all' || searchTerm
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
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <nav className="flex items-center space-x-2">
                <button
                  onClick={() => updateFilters(undefined, undefined, undefined, Math.max(1, page - 1))}
                  disabled={page === 1}
                  className={`px-3 py-1 rounded ${page === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50'}`}
                >
                  Previous
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Show current page and surrounding pages
                  let pageNum = page;
                  if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  // Ensure page numbers are within valid range
                  if (pageNum < 1 || pageNum > totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => updateFilters(undefined, undefined, undefined, pageNum)}
                      className={`px-3 py-1 rounded ${page === pageNum ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 hover:bg-blue-50'}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => updateFilters(undefined, undefined, undefined, Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className={`px-3 py-1 rounded ${page === totalPages ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50'}`}
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
}