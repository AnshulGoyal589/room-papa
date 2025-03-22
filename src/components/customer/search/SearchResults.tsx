'use client'

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, Calendar, Users, Star, Bookmark, Heart } from 'lucide-react';

interface SearchResultsProps {
  initialResults: any[];
  category: string;
  searchParams: { [key: string]: string };
}

export default function SearchResults({ initialResults, category, searchParams }: SearchResultsProps) {
  const router = useRouter();
  const currentSearchParams = useSearchParams();
  const [results, setResults] = useState(initialResults);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState(searchParams.sortBy || 'createdAt');
  const [sortOrder, setSortOrder] = useState(searchParams.sortOrder || 'desc');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.page || '1'));
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    // Set initial state from props
    setResults(initialResults);
    setSortBy(searchParams.sortBy || 'createdAt');
    setSortOrder(searchParams.sortOrder || 'desc');
    setCurrentPage(parseInt(searchParams.page || '1'));
    
    // Calculate total pages (in a real app, this would come from the API)
    setTotalPages(Math.ceil(initialResults.length / 10) || 1);
  }, [initialResults, searchParams]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      const params = new URLSearchParams(currentSearchParams?.toString() || '');
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);
      params.set('page', currentPage.toString());
      params.set('category', searchParams.category || 'travelling');
      
      try {
        const response = await fetch(`/api/search?${params.toString()}`);
        const data = await response.json();
        // console.log("hhghghghghghgh: ",data);
        setResults(data.results);
        setTotalPages(Math.ceil(data.total / 10));
        
        // Update URL without triggering a navigation
        router.push(`/customer/search?${params.toString()}`, { scroll: false });
      } catch (error) {
        console.error('Error fetching search results:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [sortBy, sortOrder, currentPage, router, currentSearchParams, searchParams.sortBy, searchParams.sortOrder, searchParams.page]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc'); // Default to descending for new sort field
    }
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  // Render property card
  const renderPropertyCard = (property: any) => (
    <div key={property._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48">
        {property.bannerImage ? (
          <Image 
            src={property.bannerImage.url || '/placeholder-property.jpg'} 
            alt={property.name || ""}
            fill
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <Image 
            src="/placeholder-property.jpg" 
            alt={property.name || ""}
            fill
            style={{ objectFit: 'cover' }}
          />
        )}
        <button className="absolute top-3 right-3 bg-white p-1.5 rounded-full">
          <Heart size={18} className="text-gray-500 hover:text-red-500" />
        </button>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between mb-2">
          <div className="flex items-center">
            <MapPin size={16} className="text-gray-500 mr-1" />
            <span className="text-sm text-gray-500">{property.location?.city}, {property.location?.country}</span>
          </div>
          {property.rating && (
            <div className="flex items-center">
              <Star size={16} className="text-yellow-500 mr-1" />
              <span className="text-sm font-medium">{property.rating} ({property.reviewCount || 0})</span>
            </div>
          )}
        </div>
        
        <Link href={`/properties/${property._id}`} className="block">
          <h3 className="font-semibold text-lg mb-1 hover:text-primary">{property.name}</h3>
        </Link>
        
        <div className="flex items-center mt-2 text-sm text-gray-600 mb-3">
          <span className="mr-3">{property.bedrooms} Beds</span>
          <span className="mr-3">{property.bathrooms} Baths</span>
          <span>{property.maximumGuests} Guests</span>
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <div>
            <span className="text-lg font-bold">${property.pricePerNight}</span>
            <span className="text-gray-500"> / night</span>
          </div>
          <Link href={`/properties/${property._id}`} className="bg-primary text-white px-4 py-2 rounded-md text-sm">
            View Details
          </Link>
        </div>
      </div>
    </div>
  );

  // Render trip card
  const renderTripCard = (trip: any) => (
    <div key={trip._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48">
        {trip.bannerImage ? (
          <Image 
            src={trip.bannerImage.url || '/placeholder-trip.jpg'} 
            alt={trip.title}
            fill
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <Image 
            src="/placeholder-trip.jpg" 
            alt={trip.title}
            fill
            style={{ objectFit: 'cover' }}
          />
        )}
        <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full text-xs font-medium">
          {trip.status}
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-center mb-2">
          <MapPin size={16} className="text-gray-500 mr-1" />
          <span className="text-sm text-gray-500">{trip.destination?.city}, {trip.destination?.country}</span>
        </div>
        
        <Link href={`/trips/${trip._id}`} className="block">
          <h3 className="font-semibold text-lg mb-1 hover:text-primary">{trip.title}</h3>
        </Link>
        
        <div className="flex items-center mt-2 text-sm text-gray-600">
          <Calendar size={16} className="mr-1" />
          <span>{new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}</span>
        </div>
        
        {trip.budget && (
          <div className="mt-2 text-sm">
            <span className="font-medium">Budget: </span>
            <span>{trip.budget.amount} {trip.budget.currency}</span>
          </div>
        )}
        
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center text-sm text-gray-500">
            <span className="flex items-center mr-3">
              <Users size={16} className="mr-1" />
              {trip.sharedWith?.length || 0} sharing
            </span>
            <span>{trip.activities?.length || 0} activities</span>
          </div>
          <Link href={`/trips/${trip._id}`} className="bg-primary text-white px-4 py-2 rounded-md text-sm">
            View Trip
          </Link>
        </div>
      </div>
    </div>
  );
  
  // Render travelling (itinerary) card
  const renderTravellingCard = (itinerary: any) => (
    <div key={itinerary._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48">
        {itinerary.bannerImage ? (
          <Image 
            src={itinerary.bannerImage.url || '/placeholder-itinerary.jpg'} 
            alt={itinerary.title}
            fill
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <Image 
            src="/placeholder-itinerary.jpg" 
            alt={itinerary.title}
            fill
            style={{ objectFit: 'cover' }}
          />
        )}
        <div className="absolute top-3 right-3 flex space-x-2">
          <div className="bg-white px-2 py-1 rounded-full text-xs font-medium">
            {itinerary.visibility}
          </div>
          <button className="bg-white p-1.5 rounded-full">
            <Bookmark size={16} className="text-gray-500 hover:text-primary" />
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <Link href={`/itineraries/${itinerary._id}`} className="block">
          <h3 className="font-semibold text-lg mb-1 hover:text-primary">{itinerary.title}</h3>
        </Link>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{itinerary.description || 'No description available'}</p>
        
        <div className="flex items-center mt-2 text-sm text-gray-600">
          <Calendar size={16} className="mr-1" />
          <span>{itinerary.days?.length || 0} days</span>
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center text-sm text-gray-500">
            {itinerary.likes !== undefined && (
              <span className="flex items-center mr-3">
                <Heart size={16} className="mr-1" />
                {itinerary.likes}
              </span>
            )}
            {itinerary.comments !== undefined && (
              <span className="flex items-center">
                <span className="mr-1">💬</span>
                {itinerary.comments.length}
              </span>
            )}
          </div>
          <Link href={`/itineraries/${itinerary._id}`} className="bg-primary text-white px-4 py-2 rounded-md text-sm">
            View Details
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          {results.length} {category === 'property' ? 'Properties' : category === 'trip' ? 'Trips' : 'Itineraries'} Found
        </h2>
        
        <div className="flex items-center space-x-4">
          <div>
            <label htmlFor="sortBy" className="mr-2 text-sm">Sort by:</label>
            <select
              id="sortBy"
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="p-2 border rounded-md"
            >
              <option value="createdAt-desc">Newest</option>
              <option value="createdAt-asc">Oldest</option>
              {category === 'property' && (
                <>
                  <option value="pricePerNight-asc">Price (Low to High)</option>
                  <option value="pricePerNight-desc">Price (High to Low)</option>
                  <option value="rating-desc">Highest Rated</option>
                </>
              )}
              {category === 'trip' && (
                <>
                  <option value="startDate-asc">Departure (Soonest)</option>
                  <option value="duration-asc">Duration (Shortest)</option>
                  <option value="duration-desc">Duration (Longest)</option>
                </>
              )}
              {category === 'travelling' && (
                <>
                  <option value="likes-desc">Most Popular</option>
                  <option value="days.length-desc">Longest Itineraries</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-gray-100 rounded-lg h-80 animate-pulse"></div>
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((item) => {
            switch (category) {
              case 'property':
                return renderPropertyCard(item);
              case 'trip':
                return renderTripCard(item);
              case 'travelling':
                return renderTravellingCard(item);
              default:
                return null;
            }
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium mb-2">No results found</h3>
          <p className="text-gray-500">Try adjusting your search criteria</p>
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-md border disabled:opacity-50"
            >
              Previous
            </button>
            
            {[...Array(totalPages)].map((_, index) => {
              const pageNumber = index + 1;
              // Show first, last, current and adjacent pages
              if (
                pageNumber === 1 || 
                pageNumber === totalPages || 
                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
              ) {
                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`px-3 py-1 rounded-md ${
                      pageNumber === currentPage
                        ? 'bg-primary text-white'
                        : 'border hover:bg-gray-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              } else if (
                (pageNumber === currentPage - 2 && currentPage > 3) || 
                (pageNumber === currentPage + 2 && currentPage < totalPages - 2)
              ) {
                return <span key={pageNumber}>...</span>;
              }
              return null;
            })}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-md border disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
