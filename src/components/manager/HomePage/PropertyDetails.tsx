import React from 'react';
import { MapPin, Home, Bath, Users, Tag, Star, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
export type PropertyType = 'hotel' | 'apartment' | 'villa' | 'hostel' | 'resort';
export type PropertyAmenities = 'wifi' | 'pool' | 'gym' | 'spa' | 'restaurant' | 'parking' | 'airConditioning' | 'breakfast';

type PropertyItem = {
  id: string;
  title: string;
  description: string;
  category: 'Property';
  status: string;
  createdAt: Date;
  location: {
    address: string;
    city: string;
    state?: string;
    country: string;
    zipCode?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    }
  };
  price: number;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  maximumGuests: number;
  amenities: PropertyAmenities[];
  images: string[];
  type: PropertyType;
  rating?: number;
  reviewCount?: number;
};

const PropertyDetails: React.FC<{ item: PropertyItem }> = ({ item }) => {
  // Function to get formatted address
  const getFormattedAddress = () => {
    const { address, city, state, country, zipCode } = item.location;
    let formattedAddress = address;
    
    if (city) formattedAddress += `, ${city}`;
    if (state) formattedAddress += `, ${state}`;
    if (zipCode) formattedAddress += ` ${zipCode}`;
    if (country) formattedAddress += `, ${country}`;
    
    return formattedAddress;
  };

  // Format the property type for display
  const formatPropertyType = (type: PropertyType) => {
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
            <p>{item.price.toLocaleString()} {item.currency}</p>
          </div>
        </div>
        <div className="flex items-center">
          <Home className="w-4 h-4 mr-2 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Bedrooms</p>
            <p>{item.bedrooms}</p>
          </div>
        </div>
        <div className="flex items-center">
          <Bath className="w-4 h-4 mr-2 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Bathrooms</p>
            <p>{item.bathrooms}</p>
          </div>
        </div>
        <div className="flex items-center">
          <Users className="w-4 h-4 mr-2 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Maximum Guests</p>
            <p>{item.maximumGuests}</p>
          </div>
        </div>
        <div className="flex items-center">
          <Tag className="w-4 h-4 mr-2 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Type</p>
            <p>{formatPropertyType(item.type)}</p>
          </div>
        </div>
        
        {item.rating && (
          <div className="flex items-center">
            <Star className="w-4 h-4 mr-2 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Rating</p>
              <p>{item.rating}/5 ({item.reviewCount || 0} reviews)</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Amenities section */}
      <div className="mt-6">
        <h4 className="text-md font-medium mb-2">Amenities</h4>
        <div className="flex flex-wrap gap-2">
          {item.amenities.map((amenity) => (
            <Badge key={amenity} variant="outline">
              {amenity.charAt(0).toUpperCase() + amenity.slice(1).replace(/([A-Z])/g, ' $1')}
            </Badge>
          ))}
        </div>
      </div>
      
      {/* Images section */}
      {item.images && item.images.length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-medium mb-2">Images</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {item.images.map((image, index) => (
              <img 
                key={index} 
                src={image} 
                alt={`Property image ${index + 1}`} 
                className="rounded-md object-cover h-32 w-full"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetails;