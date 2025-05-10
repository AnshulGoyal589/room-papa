'use client'

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, Calendar, Star, Bookmark, Heart, X } from 'lucide-react';
import { Property } from '@/lib/mongodb/models/Property';
import { Trip } from '@/lib/mongodb/models/Trip';
import { Travelling } from '@/lib/mongodb/models/Travelling';

export default function SearchResults() {
  const router = useRouter();
  const currentSearchParams = useSearchParams();
  // const [searchParams, setSearchParams] = useState<{ [key: string]: string }>({});
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [category, setCategory] = useState<string>('property');
  const [filterChips, setFilterChips] = useState<Array<{key: string, value: string}>>([]);

  // Parse search parameters on component mount and when URL changes
  useEffect(() => {
    const params: { [key: string]: string } = {};
    currentSearchParams?.forEach((value, key) => {
      params[key] = value;
    });
    // setSearchParams(params);
    
    // Set initial states from URL params
    setSortBy(params.sortBy || 'createdAt');
    setSortOrder(params.sortOrder || 'desc');
    setCurrentPage(parseInt(params.page || '1'));
    setCategory(params.category || 'property');
    
    // Create filter chips from URL params (excluding pagination, sorting, and category)
    const chips: Array<{key: string, value: string}> = [];
    Object.entries(params).forEach(([key, value]) => {
      if (
        key !== 'page' && 
        key !== 'sortBy' && 
        key !== 'sortOrder' && 
        key !== 'category' &&
        value
      ) {
        chips.push({ key, value });
      }
    });
    setFilterChips(chips);
  }, [currentSearchParams]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const params = new URLSearchParams(currentSearchParams?.toString() || '');
      
      try {
        const response = await fetch(`/api/search?${params.toString()}`);
        const data = await response.json();
        setResults(data.results);
        setTotalPages(Math.ceil(data.total / 10));
      } catch (error) {
        console.error('Error fetching search results:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentSearchParams]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    
    const params = new URLSearchParams(currentSearchParams?.toString() || '');
    params.set('page', page.toString());
    router.push(`/customer/search?${params.toString()}`, { scroll: false });
    window.scrollTo(0, 0);
  };

  const handleSortChange = (field: string, order: string) => {
    const params = new URLSearchParams(currentSearchParams?.toString() || '');
    params.set('sortBy', field);
    params.set('sortOrder', order);
    params.set('page', '1'); // Reset to first page when sorting changes
    router.push(`/customer/search?${params.toString()}`, { scroll: false });
  };

  const handleRemoveFilter = (chipKey: string) => {
    const params = new URLSearchParams(currentSearchParams?.toString() || '');
    params.delete(chipKey);
    params.set('page', '1'); // Reset to first page when filters change
    router.push(`/customer/search?${params.toString()}`, { scroll: false });
  };

  // Format filter chip label for display
  const formatChipLabel = (key: string, value: string): string => {
    // Custom formatting for specific filter types
    switch (key) {
      case 'minPrice':
        return `Price > ${value}`;
      case 'maxPrice':
        return `Price < ${value}`;
      case 'rooms':
        return `${value} Rooms`;
      case 'city':
      case 'country':
        return value;
      case 'startDate':
        return `From: ${new Date(value).toLocaleDateString()}`;
      case 'endDate':
        return `To: ${new Date(value).toLocaleDateString()}`;
      default:
        // Format camelCase keys to readable text
        const formattedKey = key.replace(/([A-Z])/g, ' $1').toLowerCase();
        return `${formattedKey}: ${value}`;
    }
  };

  const renderPropertyCard = (property: Property) => (
    <div 
      key={property._id?.toString()} 
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow" 
      onClick={() => router.push(`/customer/property/${property._id}`)}
    >
      <div className="relative h-48">
        {
          property.bannerImage && 
            <Image 
              src={property.bannerImage.url} 
              alt={property.title || ""}
              fill
              style={{ objectFit: 'cover' }}
            />
        }
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
          {property.totalRating && (
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium">{property.propertyRating?.toString()}</span>
              <Star size={16} className="text-yellow-500 mr-1" />
            </div>
          )}
        </div>
        
        <Link href={`/properties/${property._id}`} className="block">
          <h3 className="font-semibold text-lg mb-1 hover:text-primary">{property.title}</h3>
        </Link>
        
        <div className="flex items-center mt-2 text-sm text-gray-600 mb-3">
          <span>{property.rooms} Rooms</span>
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <div>
            <span className="text-lg font-bold">{property.costing.currency} {property.costing.discountedPrice }</span>
            <span className="text-gray-500"> / night</span>
          </div>
          <Link href={`/properties/${property._id}`} className="bg-primary text-white px-4 py-2 rounded-md text-sm">
            View Details
          </Link>
        </div>
      </div>
    </div>
  );

  const renderTripCard = (trip: Trip) => (
    <div key={trip._id?.toString()} 
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
      onClick={() => router.push(`/customer/trip/${trip._id}`)}
    >
      <div className="relative h-48">
        {trip.bannerImage ? (
          <Image 
            src={trip.bannerImage.url || '/placeholder-trip.jpg'} 
            alt={trip.title || ""}
            fill
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <Image 
            src="/placeholder-trip.jpg" 
            alt={trip.title || ""}
            fill
            style={{ objectFit: 'cover' }}
          />
        )}
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
        
        {trip.costing && (
          <div className="mt-2 text-sm">
            <span className="font-medium">Budget: </span>
            <span>{trip.costing.discountedPrice} {trip.costing.currency}</span>
          </div>
        )}
        
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center text-sm text-gray-500">
            <span>{trip.activities?.length || 0} activities</span>
          </div>
          <Link href={`/trips/${trip._id}`} className="bg-primary text-white px-4 py-2 rounded-md text-sm">
            View Trip
          </Link>
        </div>
      </div>
    </div>
  );
  
  const renderTravellingCard = (itinerary: Travelling) => (

    <div key={itinerary._id?.toString()}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
      onClick={() => router.push(`/customer/travelling/${itinerary._id}`)}
    >
      <div className="relative h-48">
        {itinerary.bannerImage ? (
          <Image 
            src={itinerary.bannerImage.url || '/placeholder-itinerary.jpg'} 
            alt={itinerary.title || ""}
            fill
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <Image 
            src="/placeholder-itinerary.jpg" 
            alt={itinerary.title || ""}
            fill
            style={{ objectFit: 'cover' }}
          />
        )}
        <div className="absolute top-3 right-3 flex space-x-2">
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
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Filter Chips Section */}
      {filterChips.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {filterChips.map((chip) => (
              <div 
                key={chip.key}
                className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm"
              >
                <span>{formatChipLabel(chip.key, chip.value)}</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFilter(chip.key);
                  }}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {filterChips.length > 1 && (
              <button 
                onClick={() => {
                  const params = new URLSearchParams();
                  params.set('category', category);
                  router.push(`/customer/search?${params.toString()}`);
                }}
                className="text-sm text-primary hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          {results.length} {category === 'property' ? 'Properties' : category === 'trip' ? 'Trips' : 'Itineraries'} Found
        </h2>
        
        {/* <div className="flex items-center space-x-4">
          <div>
            <label htmlFor="sortBy" className="mr-2 text-sm">Sort by:</label>
            <select
              id="sortBy"
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                handleSortChange(field, order);
              }}
              className="p-2 border rounded-md"
            >
              <option value="createdAt-desc">Newest</option>
              <option value="createdAt-asc">Oldest</option>
              <option value="costing.discountedPrice-asc">Price (Low to High)</option>
              <option value="costing.discountedPrice-desc">Price (High to Low)</option>
              <option value="rat-asc">Highest Rated</option>
              
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
        </div> */}
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-gray-100 rounded-lg h-80 animate-pulse"></div>
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {results.map((item) => {
            switch (category) {
              case 'trip':
                return renderTripCard(item as Trip);
              case 'travelling':
                return renderTravellingCard(item as Travelling);
              default:
                return renderPropertyCard(item as Property);
            }
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium mb-2">No results found</h3>
          <p className="text-gray-500">Try adjusting your search criteria</p>
        </div>
      )}
      
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