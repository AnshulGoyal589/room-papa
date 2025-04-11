import React from 'react';
import { MapPin, Calendar, Banknote, Plane, Star, Users, Tag, Check } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Travelling } from '@/lib/mongodb/models/Travelling';
import Image from 'next/image';

const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString();
};

// Helper to render a list of string items as badges
const renderBadges = (items: string[] | undefined, emptyMessage: string) => {
  if (!items || items.length === 0 || (items.length === 1 && !items[0].trim())) {
    return <p className="text-gray-500">{emptyMessage}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => (
        <Badge key={index} variant="outline">
          {typeof item === 'string' ? 
            item.charAt(0).toUpperCase() + item.slice(1).replace(/([A-Z])/g, ' $1') : 
            'Unknown Item'}
        </Badge>
      ))}
    </div>
  );
};

const TravellingDetails: React.FC<{ item: Travelling }> = ({ item }) => {
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">{item.title}</h3>
      
      {item.description && (
        <p className="text-sm text-gray-700 mb-4">{item.description}</p>
      )}
      
      {item.bannerImage && (
        <div className="mb-6 relative rounded-md overflow-hidden h-64">
          <Image 
            src={item.bannerImage.url} 
            alt={item.bannerImage.alt || "banner image" } 
            fill 
            className="object-cover" 
          />
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-2 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Created</p>
            <p>{item.createdAt ? formatDate(item.createdAt) : 'N/A'}</p>
          </div>
        </div>
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-2 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Updated</p>
            <p>{item.updatedAt ? formatDate(item.updatedAt) : 'N/A'}</p>
          </div>
        </div>
        <div className="flex items-center">
          <Banknote className="w-4 h-4 mr-2 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Price</p>
            <p>
              {item.costing.currency} {item.costing.price.toLocaleString()}
              {item.costing.discountedPrice < item.costing.price && (
                <span className="ml-2 text-green-600">
                  Discounted: {item.costing.currency} {item.costing.discountedPrice.toLocaleString()}
                </span>
              )}
            </p>
          </div>
        </div>
        {item.totalRating !== undefined && (
          <div className="flex items-center">
            <Star className="w-4 h-4 mr-2 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Rating</p>
              <p>{item.totalRating.toFixed(1)}/5 ({item.review?.length || 0} reviews)</p>
              {item.travellingRating && <span className="ml-2">Travelling Rating: {item.travellingRating.toString()}</span>}
            </div>
          </div>
        )}
        
        {item.rat && (
          <div className="flex items-center">
            <Check className="w-4 h-4 mr-2 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">RAT</p>
              <p>{typeof item.rat === 'number' ? item.rat : item.rat}</p>
            </div>
          </div>
        )}
      </div>
      
      <Separator className="my-6" />
      
      <h3 className="text-lg font-medium mb-4">Transportation Details</h3>
      
      <div className="border rounded-md p-4 mb-6">
        <div className="flex items-center mb-3">
          <Plane className="w-5 h-5 mr-2" />
          <h4 className="font-medium">
            {item.transportation.type.charAt(0).toUpperCase() + item.transportation.type.slice(1)}
          </h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-start">
              <MapPin className="w-4 h-4 mr-2 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">From</p>
                <p>{item.transportation.from}</p>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-sm text-gray-500">Departure</p>
              <p>{formatDate(new Date(item.transportation.departureTime))} {formatTime(new Date(item.transportation.departureTime))}</p>
            </div>
          </div>
          <div>
            <div className="flex items-start">
              <MapPin className="w-4 h-4 mr-2 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">To</p>
                <p>{item.transportation.to}</p>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-sm text-gray-500">Arrival</p>
              <p>{formatDate(new Date(item.transportation.arrivalTime))} {formatTime(new Date(item.transportation.arrivalTime))}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Additional features sections (from Property component) */}
      <div className="mt-6">
        <h4 className="text-md font-medium mb-2">Amenities</h4>
        {renderBadges(item.amenities, 'No amenities listed')}
      </div>

      {/* Travelling Accessibility */}
      <div className="mt-6">
        <h4 className="text-md font-medium mb-2">Travelling Accessibility</h4>
        {renderBadges(item.travellingAccessibility, 'No travelling accessibility features listed')}
      </div>

      {/* Room Accessibility */}
      <div className="mt-6">
        <h4 className="text-md font-medium mb-2">Room Accessibility</h4>
        {renderBadges(item.roomAccessibility, 'No room accessibility features listed')}
      </div>

      {/* Popular Filters */}
      <div className="mt-6">
        <h4 className="text-md font-medium mb-2">Popular Filters</h4>
        {renderBadges(item.popularFilters, 'No popular filters listed')}
      </div>

      {/* Fun Things To Do */}
      <div className="mt-6">
        <h4 className="text-md font-medium mb-2">Fun Things To Do</h4>
        {renderBadges(item.funThingsToDo, 'No fun activities listed')}
      </div>

      {/* Meals */}
      <div className="mt-6">
        <h4 className="text-md font-medium mb-2">Meals</h4>
        {renderBadges(item.meals, 'No meal options listed')}
      </div>

      {/* Facilities */}
      <div className="mt-6">
        <h4 className="text-md font-medium mb-2">Facilities</h4>
        {renderBadges(item.facilities, 'No facilities listed')}
      </div>

      {/* Bed Preference */}
      <div className="mt-6">
        <h4 className="text-md font-medium mb-2">Bed Preference</h4>
        {renderBadges(item.bedPreference, 'No bed preferences listed')}
      </div>

      {/* Reservation Policy */}
      <div className="mt-6">
        <h4 className="text-md font-medium mb-2">Reservation Policy</h4>
        {renderBadges(item.reservationPolicy, 'No reservation policies listed')}
      </div>

      {/* Brands */}
      <div className="mt-6">
        <h4 className="text-md font-medium mb-2">Brands</h4>
        {renderBadges(item.brands, 'No brands listed')}
      </div>

      {/* Room Facilities */}
      <div className="mt-6">
        <h4 className="text-md font-medium mb-2">Room Facilities</h4>
        {renderBadges(item.roomFacilities, 'No room facilities listed')}
      </div>
      
      {/* Detail Images section */}
      {item.detailImages && item.detailImages.length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-medium mb-2">Gallery</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {item.detailImages.map((image, index) => (
              <div key={index} className="relative aspect-square overflow-hidden rounded-md">
                <Image 
                  src={image.url} 
                  alt={image.alt || `Travel image ${index + 1}`} 
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Reviews section */}
      {item.review && item.review.length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-medium mb-2">Reviews</h4>
          <div className="space-y-4">
            {item.review.slice(0, 3).map((review, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-md">
                <div className="flex items-center mb-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700">{review.comment}</p>
              </div>
            ))}
            {item.review.length > 3 && (
              <p className="text-sm text-gray-500">And {item.review.length - 3} more reviews</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TravellingDetails;