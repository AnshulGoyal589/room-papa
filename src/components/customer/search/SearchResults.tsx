'use client'

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, Calendar, Bookmark, Heart, X, BedDouble, Sparkles, Plane, Train, Car } from 'lucide-react'; // Added more icons
import { Property } from '@/lib/mongodb/models/Property'; // Assuming ObjectId is handled
import { Trip } from '@/lib/mongodb/models/Trip';
import { Travelling } from '@/lib/mongodb/models/Travelling'; // Assuming TransportationType is defined
// Define TransportationType as an enum
export enum TransportationType {
  flight = 'flight',
  train = 'train',
  bus = 'bus',
  car = 'car',
  boat = 'boat',
  other = 'other',
}


// Helper function for PropertyType (if you have specific display needs)
// enum PropertyType { hotel = 'Hotel', apartment = 'Apartment', resort = 'Resort', villa = 'Villa', guestHouse = 'Guest House' }

// Helper to get rating description
const getRatingDescription = (rating?: number): { text: string; className: string } => {
  if (rating === undefined || rating === null) return { text: "No rating", className: "text-gray-600" };
  if (rating >= 9.5) return { text: "Exceptional", className: "text-green-700" };
  if (rating >= 9.0) return { text: "Superb", className: "text-green-600" };
  if (rating >= 8.5) return { text: "Fabulous", className: "text-blue-700" };
  if (rating >= 8.0) return { text: "Very Good", className: "text-blue-600" };
  if (rating >= 7.0) return { text: "Good", className: "text-teal-600" };
  if (rating >= 6.0) return { text: "Pleasant", className: "text-orange-600" };
  return { text: "Review score", className: "text-gray-700" };
};

// Helper to format review count
const formatReviewCount = (reviews?: Array<{ comment: string; rating: number }>): string => {
  const count = reviews?.length || 0;
  if (count === 0) return "No reviews yet";
  return `${count} review${count === 1 ? '' : 's'}`;
};


export default function SearchResults() {
  const router = useRouter();
  const currentSearchParams = useSearchParams();
  const [results, setResults] = useState<Array<Property | Trip | Travelling>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [category, setCategory] = useState<string>('property');
  const [filterChips, setFilterChips] = useState<Array<{key: string, value: string}>>([]);

  useEffect(() => {
    const params: { [key: string]: string } = {};
    currentSearchParams?.forEach((value, key) => {
      params[key] = value;
    });
    setCurrentPage(parseInt(params.page || '1'));
    setCategory(params.category || 'property');
    
    const chips: Array<{key: string, value: string}> = [];
    Object.entries(params).forEach(([key, value]) => {
      if (key !== 'page' && key !== 'sortBy' && key !== 'sortOrder' && key !== 'category' && value) {
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
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }
        const data = await response.json();
        setResults(data.results || []); // Ensure results is always an array
        setTotalPages(Math.ceil((data.total || 0) / 10)); // Ensure total is a number
      } catch (error) {
        console.error('Error fetching search results:', error);
        setResults([]); // Set to empty array on error
        setTotalPages(0);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentSearchParams) { // Only load if searchParams are available
        loadData();
    }
  }, [currentSearchParams]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    
    const params = new URLSearchParams(currentSearchParams?.toString() || '');
    params.set('page', page.toString());
    router.push(`/customer/search?${params.toString()}`, { scroll: false });
    window.scrollTo(0, 0);
  };

  const handleRemoveFilter = (chipKey: string) => {
    const params = new URLSearchParams(currentSearchParams?.toString() || '');
    params.delete(chipKey);
    params.set('page', '1'); 
    router.push(`/customer/search?${params.toString()}`, { scroll: false });
  };

  const formatChipLabel = (key: string, value: string): string => {
    switch (key) {
      case 'minPrice': return `Min Price: ${value}`;
      case 'maxPrice': return `Max Price: ${value}`;
      case 'rooms': return `${value} Room${parseInt(value) > 1 ? 's' : ''}`;
      case 'city': return `City: ${value}`;
      case 'country': return `Country: ${value}`;
      case 'checkIn': return `Check-in: ${new Date(value).toLocaleDateString()}`; // Changed from startDate
      case 'checkOut': return `Check-out: ${new Date(value).toLocaleDateString()}`; // Changed from endDate
      case 'adults': return `${value} Adult${parseInt(value) > 1 ? 's' : ''}`;
      case 'children': return `${value} Child${parseInt(value) > 1 ? 'ren' : ''}`;
      case 'pets': return value === 'true' ? 'Pets Allowed' : 'No Pets';
      case 'title': return `Keyword: ${value}`;
      default:
        const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        return `${formattedKey}: ${value}`;
    }
  };

  const renderPropertyCard = (property: Property) => {
    const ratingDesc = getRatingDescription(property.propertyRating);
    const reviewText = formatReviewCount(property.review);
    const propertyTypeDisplay = property.type ? property.type.charAt(0).toUpperCase() + property.type.slice(1) : 'Property';

    return (
    <div 
      key={property._id?.toString()} 
      className="flex flex-col md:flex-row border border-gray-300 rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 bg-white group"
    >
      {/* Image Section */}
      <div className="md:w-1/3 lg:w-[280px] relative cursor-pointer" onClick={() => router.push(`/customer/property/${property._id}`)}>
        {property.bannerImage?.url ? (
          <Image 
            src={property.bannerImage.url} 
            alt={property.title || "Property image"}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 33vw, 280px"
            style={{ objectFit: 'cover' }}
            
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <BedDouble size={48} className="text-gray-400" />
          </div>
        )}
        <button className="absolute top-3 right-3 bg-black bg-opacity-40 hover:bg-opacity-60 p-2 rounded-full transition-colors">
          <Heart size={20} className="text-white" />
        </button>
      </div>
      
          {/* Content Section */}
        <div className="md:w-2/3 lg:flex-grow p-4 flex flex-col">
       
          <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-1">
            <Link href={`/customer/property/${property._id}`} className="block">
              <h3 className="text-2xl font-bold text-blue-700 hover:text-blue-800 transition-colors line-clamp-2">{property.title || "Untitled Property"}</h3>
            </Link>
          </div>

          <div className="flex items-center text-xs text-blue-600 hover:underline mb-2 cursor-pointer" onClick={() => router.push(`/customer/property/${property._id}#location`)}>
            <MapPin size={14} className="mr-1" />
            <span>{property.location?.city}, {property.location?.country}</span>
            {/* Optionally, add "Show on map" if you have a maps link */}
          </div>

          <div className="text-sm text-gray-600 mb-3">
            <span className="font-semibold">{propertyTypeDisplay}</span> • <span>{property.rooms} Room{property.rooms === 1 ? '' : 's'}</span>
          </div>

          <p className="text-sm text-gray-700 mb-3 line-clamp-2 md:line-clamp-3 flex-grow">
            {property.description || "No description available."}
          </p>

          {property.amenities && property.amenities.length > 0 && (
            <div className="mb-3">
              <span className="text-sm font-semibold text-green-700">
                {property.amenities.slice(0, 20).join(' • ')}
                {property.amenities.length > 20 ? ' • ...' : ''}
              </span>
            </div>
          )}

        </div>

        <div className='flex flex-col w-[18%] justify-between items-center pt-4 pb-8 ' >

          <div>
            {property.propertyRating && (
              <div className="flex items-center gap-2 mt-1 sm:mt-0 sm:ml-4 flex-shrink-0">
                <div className="text-right">
                  <p className={`text-sm font-semibold ${ratingDesc.className}`}>{ratingDesc.text}</p>
                  <p className="text-xs text-gray-500">{reviewText}</p>
                </div>
                <div className="bg-blue-700 text-white text-base font-bold px-2 py-1 rounded-md h-fit">
                  {property.propertyRating.toFixed(1)}
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-auto text-right pr-8">
            {property.costing && (
              <>
                {property.costing.price > property.costing.discountedPrice && (
                    <span className="text-sm text-gray-500 line-through mr-2">
                        {property.costing.currency} {property.costing.price.toFixed(2)}
                    </span>
                )}
                <span className="text-2xl font-bold text-gray-800">
                  {property.costing.currency} {property.costing.discountedPrice.toFixed(2)}
                </span>
                <p className="text-xs text-gray-500">per night</p>
                <p className="text-xs text-gray-500">Includes taxes and fees</p>
              </>
            )}
            <Link 
              href={`/customer/property/${property._id}?checkIn=${currentSearchParams?.get('checkIn') || ''}&checkOut=${currentSearchParams?.get('checkOut') || ''}&adults=${currentSearchParams?.get('adults') || '1'}`} 
              className="mt-2 inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-md text-sm transition-colors w-full sm:w-auto"
            >
              See availability
            </Link>
          </div>
        </div>

    </div>
    );
  };
  
  const renderTripCard = (trip: Trip) => {
    const ratingDesc = getRatingDescription(trip.rating); // Assuming 'rating' is numerical for trips too
    const reviewText = formatReviewCount(trip.review); // Using the same review count formatter
    const placeholderImage = '/placeholder-trip.jpg';

    return (
      <div 
        key={trip._id?.toString()} 
        className="flex flex-col md:flex-row border border-gray-300 rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 bg-white group"
      >
        {/* Image Section */}
        <div className="md:w-1/3 lg:w-[280px] relative cursor-pointer" onClick={() => router.push(`/customer/trip/${trip._id}`)}>
          <Image 
            src={trip.bannerImage?.url || placeholderImage} 
            alt={trip.title || "Trip image"}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 33vw, 280px"
            style={{ objectFit: 'cover' }}
            
            onError={(e) => (e.currentTarget.src = placeholderImage)} // Fallback for broken image URLs
          />
           <button className="absolute top-3 right-3 bg-black bg-opacity-40 hover:bg-opacity-60 p-2 rounded-full transition-colors">
            <Heart size={20} className="text-white" />
          </button>
        </div>

        {/* Content Section */}
        <div className="md:w-2/3 lg:flex-grow p-4 flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-1">
            <Link href={`/customer/trip/${trip._id}`} className="block">
              <h3 className="text-xl font-bold text-blue-700 hover:text-blue-800 transition-colors line-clamp-2">{trip.title || "Adventure Awaits"}</h3>
            </Link>
            {trip.rating && (
              <div className="flex items-center gap-2 mt-1 sm:mt-0 sm:ml-4 flex-shrink-0">
                <div className="text-right">
                  <p className={`text-sm font-semibold ${ratingDesc.className}`}>{ratingDesc.text}</p>
                  <p className="text-xs text-gray-500">{reviewText}</p>
                </div>
                <div className="bg-blue-700 text-white text-base font-bold px-2 py-1 rounded-md h-fit">
                  {trip.rating.toFixed(1)}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center text-xs text-blue-600 hover:underline mb-2 cursor-pointer" onClick={() => router.push(`/customer/trip/${trip._id}`)}>
            <MapPin size={14} className="mr-1" />
            <span>{trip.destination?.city}, {trip.destination?.country}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <Calendar size={16} className="mr-2 text-gray-500" />
            <span>{new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(trip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>

          {trip.activities && trip.activities.length > 0 && (
            <div className="flex items-center text-sm text-gray-600 mb-3">
              <Sparkles size={16} className="mr-2 text-yellow-500" />
              <span>{trip.activities.length} Activit{trip.activities.length === 1 ? 'y' : 'ies'} included</span>
            </div>
          )}
          
          <p className="text-sm text-gray-700 mb-3 line-clamp-2 md:line-clamp-3 flex-grow">
            {trip.description || "Discover amazing places and experiences on this trip."}
          </p>

          {/* Price and CTA Section */}
          <div className="mt-auto pt-2 text-right">
            {trip.costing && (
              <>
                {trip.costing.price > trip.costing.discountedPrice && (
                    <span className="text-sm text-gray-500 line-through mr-2">
                        {trip.costing.currency} {trip.costing.price.toFixed(2)}
                    </span>
                )}
                <span className="text-2xl font-bold text-gray-800">
                  {trip.costing.currency} {trip.costing.discountedPrice.toFixed(2)}
                </span>
                <p className="text-xs text-gray-500">total per person</p>
              </>
            )}
            <Link 
              href={`/customer/trip/${trip._id}`} 
              className="mt-2 inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-md text-sm transition-colors w-full sm:w-auto"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    );
  };
  
  const renderTravellingCard = (itinerary: Travelling) => {
    // Travelling schema is a bit different, adapt as best as possible
    const placeholderImage = '/placeholder-itinerary.jpg';
    const getTransportationIcon = (type?: TransportationType) => {
      switch (type) {
        case TransportationType.flight: return <Plane size={16} className="mr-2 text-blue-500" />;
        case TransportationType.train: return <Train size={16} className="mr-2 text-green-500" />;
        case TransportationType.bus: return <Car size={16} className="mr-2 text-orange-500" />; // Assuming Car icon for Bus
        case TransportationType.car: return <Car size={16} className="mr-2 text-red-500" />;
        default: return <MapPin size={16} className="mr-2 text-gray-500" />;
      }
    };

    return (
      <div 
        key={itinerary._id?.toString()}
        className="flex flex-col md:flex-row border border-gray-300 rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 bg-white group"
      >
        {/* Image Section */}
        <div className="md:w-1/3 lg:w-[280px] relative cursor-pointer" onClick={() => router.push(`/customer/travelling/${itinerary._id}`)}>
          <Image 
            src={itinerary.bannerImage?.url || placeholderImage} 
            alt={itinerary.title || "Itinerary image"}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 33vw, 280px"
            style={{ objectFit: 'cover' }}
            
            onError={(e) => (e.currentTarget.src = placeholderImage)}
          />
          <button className="absolute top-3 right-3 bg-black bg-opacity-40 hover:bg-opacity-60 p-2 rounded-full transition-colors">
            <Bookmark size={20} className="text-white" />
          </button>
        </div>

        {/* Content Section */}
        <div className="md:w-2/3 lg:flex-grow p-4 flex flex-col">
          <Link href={`/customer/travelling/${itinerary._id}`} className="block mb-1">
            <h3 className="text-xl font-bold text-blue-700 hover:text-blue-800 transition-colors line-clamp-2">{itinerary.title || "Custom Itinerary"}</h3>
          </Link>
          
          {itinerary.transportation && (
            <div className="flex items-center text-sm text-gray-600 mb-2">
              {getTransportationIcon(itinerary.transportation.type as TransportationType)}
              <span>
                {itinerary.transportation.type ? itinerary.transportation.type.charAt(0).toUpperCase() + itinerary.transportation.type.slice(1) : 'Travel'} from <strong>{itinerary.transportation.from}</strong> to <strong>{itinerary.transportation.to}</strong>
              </span>
            </div>
          )}
          
          {itinerary.transportation?.departureTime && itinerary.transportation?.arrivalTime && (
            <div className="flex items-center text-sm text-gray-600 mb-3">
              <Calendar size={16} className="mr-2 text-gray-500" />
              <span>Dep: {new Date(itinerary.transportation.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="mx-1">•</span>
              <span>Arr: {new Date(itinerary.transportation.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}

          <p className="text-sm text-gray-700 mb-3 line-clamp-2 md:line-clamp-3 flex-grow">
            {itinerary.description || "Plan your perfect journey with this itinerary."}
          </p>
          
          {/* Price and CTA Section */}
          <div className="mt-auto pt-2 text-right">
            {itinerary.costing && (
              <>
                {itinerary.costing.price > itinerary.costing.discountedPrice && (
                    <span className="text-sm text-gray-500 line-through mr-2">
                        {itinerary.costing.currency} {itinerary.costing.price.toFixed(2)}
                    </span>
                )}
                <span className="text-2xl font-bold text-gray-800">
                  {itinerary.costing.currency} {itinerary.costing.discountedPrice.toFixed(2)}
                </span>
                <p className="text-xs text-gray-500">estimated cost</p>
              </>
            )}
            <Link 
              href={`/customer/travelling/${itinerary._id}`} 
              className="mt-2 inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-md text-sm transition-colors w-full sm:w-auto"
            >
              View Itinerary
            </Link>
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="container mx-auto px-4 py-8">
      {/* Filter Chips Section */}
      {filterChips.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-md font-semibold mb-3 text-gray-700">Active Filters:</h3>
          <div className="flex flex-wrap gap-2 items-center">
            {filterChips.map((chip) => (
              <div 
                key={`${chip.key}-${chip.value}`} // Ensure unique key
                className="flex items-center bg-blue-100 text-blue-700 rounded-full px-3 py-1.5 text-sm font-medium"
              >
                <span>{formatChipLabel(chip.key, chip.value)}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleRemoveFilter(chip.key); }}
                  className="ml-2 text-blue-500 hover:text-blue-700"
                  aria-label={`Remove filter ${chip.key}`}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            {filterChips.length > 0 && ( // Always show if there's at least one filter
              <button 
                onClick={() => {
                  const params = new URLSearchParams();
                  if (category) params.set('category', category); // Preserve category if set
                  router.push(`/customer/search?${params.toString()}`);
                }}
                className="text-sm text-red-600 hover:text-red-800 hover:underline font-medium ml-2"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {isLoading ? 'Searching...' : `${results.length} ${category === 'property' ? 'Properties' : category === 'trip' ? 'Trips' : 'Itineraries'} Found`}
        </h2>
        {/* Sorting dropdown can be added here if uncommented and styled */}
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6">
          {[...Array(3)].map((_, index) => ( // Show fewer, taller skeletons
            <div key={index} className="flex flex-col md:flex-row border border-gray-200 rounded-lg overflow-hidden bg-white h-[250px] md:h-[220px]">
                <div className="md:w-1/3 lg:w-[280px] bg-gray-200 animate-pulse h-full"></div>
                <div className="md:w-2/3 lg:flex-grow p-4 flex flex-col">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-1 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6 mb-auto animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded w-1/3 ml-auto animate-pulse"></div>
                </div>
            </div>
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 mb-12"> {/* Changed gap */}
          {results.map((item) => {
            // Type guard to ensure item has _id
            if (!item || typeof item._id === 'undefined') {
                console.warn("Search result item is missing _id:", item);
                return null; // Skip rendering this item
            }
            switch (category) {
              case 'trip':
                return renderTripCard(item as Trip);
              case 'travelling':
                return renderTravellingCard(item as Travelling);
              default: // property
                return renderPropertyCard(item as Property);
            }
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-2xl font-semibold text-gray-700 mb-2">No results found</h3>
          <p className="text-gray-500">Try adjusting your search filters or check back later.</p>
        </div>
      )}
      
      {totalPages > 1 && !isLoading && ( // Hide pagination when loading
        <div className="flex justify-center mt-10">
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 sm:px-4 py-2 rounded-md border bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              Previous
            </button>
            
            {[...Array(totalPages)].map((_, index) => {
              const pageNumber = index + 1;
              // Logic for ellipsis in pagination
              const showPage = pageNumber === 1 || pageNumber === totalPages || (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1);
              const showEllipsisStart = pageNumber === currentPage - 2 && currentPage > 3;
              const showEllipsisEnd = pageNumber === currentPage + 2 && currentPage < totalPages - 2;

              if (showPage) {
                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      pageNumber === currentPage
                        ? 'bg-blue-600 text-white border border-blue-600'
                        : 'border bg-white text-gray-600 hover:bg-gray-100 hover:border-gray-400'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              } else if (showEllipsisStart || showEllipsisEnd) {
                return <span key={`ellipsis-${pageNumber}`} className="px-2 py-2 text-gray-500">...</span>;
              }
              return null;
            })}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 sm:px-4 py-2 rounded-md border bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}

// Define TransportationType enum if not already globally available
// enum TransportationType {
//   Flight = 'flight',
//   Train = 'train',
//   Bus = 'bus',
//   Car = 'car',
//   Boat = 'boat',
//   Other = 'other',
// }