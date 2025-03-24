import React from 'react';
import { MapPin, Home, Bath, Users, Tag, Star, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Property } from '@/lib/mongodb/models/Property';

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
          <Home className="w-4 h-4 mr-2 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Bedrooms</p>
            <p>{item.bedrooms || 0}</p>
          </div>
        </div>
        <div className="flex items-center">
          <Bath className="w-4 h-4 mr-2 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Bathrooms</p>
            <p>{item.bathrooms || 0}</p>
          </div>
        </div>
        <div className="flex items-center">
          <Users className="w-4 h-4 mr-2 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Maximum Guests</p>
            <p>{item.maximumGuests || 0}</p>
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
            <p>{item.totalRating || 0}/5 ({item.review?.length || 0} reviews)</p>
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
      </div>
      
      {/* Amenities section */}
      <div className="mt-6">
        <h4 className="text-md font-medium mb-2">Amenities</h4>
        <div className="flex flex-wrap gap-2">
          {item.amenities && item.amenities.length > 0 ? (
            item.amenities.map((amenity, index) => (
              <Badge key={index} variant="outline">
                {typeof amenity === 'string' ? 
                  amenity.charAt(0).toUpperCase() + amenity.slice(1).replace(/([A-Z])/g, ' $1') : 
                  'Unknown Amenity'}
              </Badge>
            ))
          ) : (
            <p className="text-gray-500">No amenities listed</p>
          )}
        </div>
      </div>
      
      {/* Banner Image */}
      {item.bannerImage && item.bannerImage.url && (
        <div className="mt-6">
          <h4 className="text-md font-medium mb-2">Banner Image</h4>
          <img 
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
              <img 
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