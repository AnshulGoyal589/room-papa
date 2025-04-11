import React from 'react';
import { MapPin, Users, Tag, Star, Calendar, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Property } from '@/lib/mongodb/models/Property';
import Image from 'next/image';

const PropertyDetails: React.FC<{ item: Property }> = ({ item }) => {
  // Function to get formatted address
  const getFormattedAddress = () => {
    if (!item.location) return 'Address not available';
    
    const { address, city, state, country } = item.location;
    let formattedAddress = address || '';
    
    if (city) formattedAddress += `, ${city}`;
    if (state) formattedAddress += `, ${state}`;
    if (country) formattedAddress += `, ${country}`;
    
    return formattedAddress || 'Address not available';
  };

  // Format the property type for display
  const formatPropertyType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
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

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Property Details</h3>
      
      {/* Main property details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="flex items-center">
          <MapPin className="w-4 h-4 mr-2 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Location</p>
            <p>{getFormattedAddress()}</p>
          </div>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 mr-2 text-gray-500">$</div>
          <div>
            <p className="text-sm text-gray-500">Price per night</p>
            <p>
              {item.costing?.price?.toLocaleString() || 0} {item.costing?.currency || 'USD'}
              {item.costing?.discountedPrice && item.costing?.discountedPrice < item.costing?.price && (
                <span className="ml-2 text-green-600">
                  Discounted: {item.costing.discountedPrice.toLocaleString()} {item.costing.currency}
                </span>
              )}
            </p>
          </div>
        </div>
 
        <div className="flex items-center">
          <Users className="w-4 h-4 mr-2 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Maximum Rooms</p>
            <p>{item.rooms || 0}</p>
          </div>
        </div>
        <div className="flex items-center">
          <Tag className="w-4 h-4 mr-2 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Type</p>
            <p>{formatPropertyType(item.type || 'hotel')}</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <Star className="w-4 h-4 mr-2 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Rating</p>
            <p>
              {item.totalRating || 0}/5 ({item.review?.length || 0} reviews)
              {item.propertyRating && <span className="ml-2">Property Rating: {item.propertyRating.toString()}</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-2 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Availability</p>
            <p>
              {item.startDate ? new Date(item.startDate).toLocaleDateString() : 'N/A'} - 
              {item.endDate ? new Date(item.endDate).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>

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
      
      {/* Amenities section */}
      <div className="mt-6">
        <h4 className="text-md font-medium mb-2">Amenities</h4>
        {renderBadges(item.amenities, 'No amenities listed')}
      </div>

      {/* Property Accessibility */}
      <div className="mt-6">
        <h4 className="text-md font-medium mb-2">Property Accessibility</h4>
        {renderBadges(item.propertyAccessibility, 'No property accessibility features listed')}
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
      
      {/* Banner Image */}
      {item.bannerImage && item.bannerImage.url && (
        <div className="mt-6">
          <h4 className="text-md font-medium mb-2">Banner Image</h4>
          <Image
            width={500}
            height={300}
            src={item.bannerImage.url} 
            alt={item.bannerImage.alt || "Property banner"} 
            className="rounded-md object-cover w-full h-64"
          />
        </div>
      )}
      
      {/* Detail Images section */}
      {item.detailImages && item.detailImages.length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-medium mb-2">Gallery</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {item.detailImages.map((image, index) => (
              <Image
                width={200}
                height={200} 
                key={index} 
                src={image.url} 
                alt={`Property image ${index + 1}`} 
                className="rounded-md object-cover h-32 w-full"
              />
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
                  <Star className="w-4 h-4 mr-1 text-yellow-500" />
                  <span>{review.rating}/5</span>
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

export default PropertyDetails;